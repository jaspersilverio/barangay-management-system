<?php

namespace App\Http\Controllers;

use App\Models\IssuedCertificate;
use App\Models\Official;
use App\Models\Resident;
use App\Models\User;
use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CertificatePdfController extends Controller
{
    protected $pdfService;

    public function __construct(PdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    /**
     * Get active officials organized by position
     */
    protected function getOfficialsForCertificate(): array
    {
        // Get active barangay officials (category = 'official')
        $officials = Official::active()
            ->where('category', 'official')
            ->orderBy('position')
            ->get();

        $organized = [];
        foreach ($officials as $official) {
            $position = strtolower($official->position);

            // Map common positions
            if (str_contains($position, 'captain') || str_contains($position, 'punong barangay')) {
                $organized['captain'] = [
                    'name' => strtoupper($official->name),
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'secretary')) {
                $organized['secretary'] = [
                    'name' => strtoupper($official->name),
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'treasurer')) {
                $organized['treasurer'] = [
                    'name' => strtoupper($official->name),
                    'position' => $official->position
                ];
            }
        }

        // Log for debugging
        Log::info('Officials for certificate', ['officials' => $organized]);

        return $organized;
    }

    /**
     * Get captain user with signature
     */
    protected function getCaptainForCertificate(): ?array
    {
        try {
            $captainUser = User::where('role', 'captain')->first();
            
            if (!$captainUser) {
                Log::warning('No captain user found for certificate');
                return null;
            }

            $signatureBase64 = null;
            
            if ($captainUser->signature_path) {
                try {
                    if (Storage::disk('public')->exists($captainUser->signature_path)) {
                        $signaturePath = Storage::disk('public')->path($captainUser->signature_path);
                        
                        // Check if file is readable and not too large (max 5MB)
                        if (file_exists($signaturePath) && is_readable($signaturePath)) {
                            $fileSize = filesize($signaturePath);
                            if ($fileSize > 0 && $fileSize < 5 * 1024 * 1024) { // 5MB limit
                                $imageData = @file_get_contents($signaturePath);
                                if ($imageData !== false) {
                                    // Determine MIME type from file extension (works without GD)
                                    $mimeType = $this->getMimeTypeFromExtension($captainUser->signature_path);
                                    
                                    // If GD is available, try to get more accurate MIME type
                                    if (extension_loaded('gd')) {
                                        $imageInfo = @getimagesizefromstring($imageData);
                                        if ($imageInfo !== false && isset($imageInfo['mime'])) {
                                            $mimeType = $imageInfo['mime'];
                                        }
                                    }
                                    
                                    if ($mimeType) {
                                        $signatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                                        Log::info('Signature loaded successfully', [
                                            'path' => $captainUser->signature_path,
                                            'mime' => $mimeType,
                                            'size' => $fileSize
                                        ]);
                                    }
                                }
                            } else {
                                Log::warning('Signature file too large or empty', [
                                    'path' => $signaturePath,
                                    'size' => $fileSize
                                ]);
                            }
                        }
                    } else {
                        Log::warning('Signature file does not exist in storage', [
                            'signature_path' => $captainUser->signature_path
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to load captain signature', [
                        'error' => $e->getMessage(),
                        'signature_path' => $captainUser->signature_path
                    ]);
                    // Continue without signature - don't fail the whole PDF generation
                }
            } else {
                Log::info('No signature path set for captain user');
            }

            return [
                'name' => $captainUser->name,
                'position' => 'Punong Barangay',
                'signature_base64' => $signatureBase64
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get captain for certificate', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Get MIME type from file extension (fallback when GD is not available)
     */
    protected function getMimeTypeFromExtension(string $filePath): ?string
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'bmp' => 'image/bmp',
            'svg' => 'image/svg+xml',
        ];
        
        return $mimeTypes[$extension] ?? null;
    }

    /**
     * Generate certificate PDF and save to storage
     */
    public function generateCertificatePdf(IssuedCertificate $certificate): ?string
    {
        try {
            // Load the certificate with relationships
            $certificate->load(['resident.household.purok', 'issuedBy', 'certificateRequest']);

            // Load resident with full details
            $resident = Resident::with(['household.purok'])->find($certificate->resident_id);

            // Get officials for signature (for other positions)
            $officials = $this->getOfficialsForCertificate();

            // Get captain with signature
            $captain = $this->getCaptainForCertificate();

            // Prepare data for PDF
            $data = [
                'is_certificate' => true, // Flag for certificate-specific layout
                'title' => $certificate->certificate_type_label ?? 'Certificate',
                'document_title' => strtoupper($certificate->certificate_type_label ?? 'CERTIFICATE'),
                'certificate' => $certificate,
                'resident' => $resident,
                'officials' => $officials,
                'captain' => $captain,
                'valid_from_formatted' => Carbon::parse($certificate->valid_from)->format('F d, Y'),
                'valid_until_formatted' => Carbon::parse($certificate->valid_until)->format('F d, Y'),
                'issued_date_formatted' => Carbon::parse($certificate->created_at)->format('F d, Y'),
                'qr_code_data' => $certificate->qr_code
            ];

            // Determine view based on certificate type - all use base template now
            $view = match ($certificate->certificate_type) {
                'barangay_clearance' => 'pdf.certificates.barangay-clearance',
                'indigency' => 'pdf.certificates.indigency',
                'residency' => 'pdf.certificates.residency',
                'business_permit_endorsement' => 'pdf.certificates.business-permit',
                default => 'pdf.certificates.base-certificate'
            };

            // Generate filename
            $filename = sprintf(
                'certificates/%s_%s_%s.pdf',
                $certificate->certificate_type,
                $certificate->certificate_number,
                Carbon::now()->format('Y-m-d_H-i-s')
            );

            // Generate and save PDF
            $storagePath = $this->pdfService->saveToStorage($view, $data, $filename);

            return $storagePath;
        } catch (\Exception $e) {
            Log::error('PDF generation failed: ' . $e->getMessage(), [
                'certificate_id' => $certificate->id,
                'exception' => $e
            ]);
            return null;
        }
    }

    /**
     * Download certificate PDF
     */
    public function downloadCertificate($id)
    {
        try {
            Log::info('Starting PDF download', ['certificate_id' => $id]);
            
            $certificate = IssuedCertificate::find($id);

            if (!$certificate) {
                Log::warning('Certificate not found for download', ['certificate_id' => $id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            // Generate filename
            $filename = sprintf(
                '%s_%s.pdf',
                str_replace(' ', '_', $certificate->certificate_type_label ?? $certificate->certificate_type),
                $certificate->certificate_number
            );

            Log::info('Preparing certificate data', ['certificate_id' => $certificate->id]);
            
            // Prepare data first to catch any errors early
            $data = $this->prepareCertificateData($certificate);
            $view = $this->getViewForCertificate($certificate);

            Log::info('Generating PDF for download', [
                'certificate_id' => $certificate->id,
                'view' => $view,
                'filename' => $filename
            ]);

            // Use PdfService for download (generates fresh PDF on-demand)
            $response = $this->pdfService->download(
                $view,
                $data,
                $filename,
                ['paper' => 'A4', 'orientation' => 'portrait']
            );
            
            Log::info('PDF download completed successfully', ['certificate_id' => $certificate->id]);
            
            return $response;
        } catch (\Exception $e) {
            Log::error('PDF download failed', [
                'certificate_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get view path for certificate type
     */
    protected function getViewForCertificate(IssuedCertificate $certificate): string
    {
        return match ($certificate->certificate_type) {
            'barangay_clearance' => 'pdf.certificates.barangay-clearance',
            'indigency' => 'pdf.certificates.indigency',
            'residency' => 'pdf.certificates.residency',
            'business_permit_endorsement' => 'pdf.certificates.business-permit',
            default => 'pdf.certificates.base-certificate'
        };
    }

    /**
     * Prepare certificate data for PDF
     */
    protected function prepareCertificateData(IssuedCertificate $certificate): array
    {
        try {
            // Load relationships with error handling
            $certificate->load(['resident.household.purok', 'issuedBy', 'certificateRequest']);
            
            if (!$certificate->resident_id) {
                throw new \Exception('Certificate has no resident_id');
            }

            $resident = Resident::with(['household.purok'])->find($certificate->resident_id);
            
            if (!$resident) {
                throw new \Exception('Resident not found for certificate');
            }

            $officials = $this->getOfficialsForCertificate();
            
            // Get captain with signature
            $captain = $this->getCaptainForCertificate();

            // Format dates safely
            $validFromFormatted = 'N/A';
            $validUntilFormatted = 'N/A';
            $issuedDateFormatted = 'N/A';
            
            try {
                if ($certificate->valid_from) {
                    $validFromFormatted = Carbon::parse($certificate->valid_from)->format('F d, Y');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to format valid_from date', ['certificate_id' => $certificate->id]);
            }

            try {
                if ($certificate->valid_until) {
                    $validUntilFormatted = Carbon::parse($certificate->valid_until)->format('F d, Y');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to format valid_until date', ['certificate_id' => $certificate->id]);
            }

            try {
                if ($certificate->created_at) {
                    $issuedDateFormatted = Carbon::parse($certificate->created_at)->format('F d, Y');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to format created_at date', ['certificate_id' => $certificate->id]);
            }

            return [
                'is_certificate' => true, // Flag for certificate-specific layout
                'title' => $certificate->certificate_type_label ?? 'Certificate',
                'document_title' => strtoupper($certificate->certificate_type_label ?? 'CERTIFICATE'),
                'certificate' => $certificate,
                'resident' => $resident,
                'officials' => $officials,
                'captain' => $captain,
                'valid_from_formatted' => $validFromFormatted,
                'valid_until_formatted' => $validUntilFormatted,
                'issued_date_formatted' => $issuedDateFormatted,
                'qr_code_data' => $certificate->qr_code ?? null
            ];
        } catch (\Exception $e) {
            Log::error('Failed to prepare certificate data', [
                'certificate_id' => $certificate->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Preview certificate PDF in browser
     */
    public function previewCertificate($id)
    {
        try {
            Log::info('Starting PDF preview', ['certificate_id' => $id]);
            
            $certificate = IssuedCertificate::find($id);

            if (!$certificate) {
                Log::warning('Certificate not found for preview', ['certificate_id' => $id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            // Generate filename
            $filename = sprintf(
                '%s_%s.pdf',
                str_replace(' ', '_', $certificate->certificate_type_label ?? $certificate->certificate_type),
                $certificate->certificate_number
            );

            Log::info('Preparing certificate data', ['certificate_id' => $certificate->id]);

            // Prepare data first to catch any errors early
            $data = $this->prepareCertificateData($certificate);
            $view = $this->getViewForCertificate($certificate);

            Log::info('Generating PDF for preview', [
                'certificate_id' => $certificate->id,
                'view' => $view,
                'filename' => $filename
            ]);

            // Use PdfService for preview (generates fresh PDF on-demand)
            $response = $this->pdfService->preview(
                $view,
                $data,
                $filename,
                ['paper' => 'A4', 'orientation' => 'portrait']
            );
            
            Log::info('PDF preview completed successfully', ['certificate_id' => $certificate->id]);
            
            return $response;
        } catch (\Exception $e) {
            Log::error('PDF preview failed', [
                'certificate_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
