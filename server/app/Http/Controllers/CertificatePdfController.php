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
        $officials = Official::active()
            ->orderBy('position')
            ->get();

        $organized = [];
        foreach ($officials as $official) {
            $position = strtolower($official->position);

            // Map common positions
            if (str_contains($position, 'captain') || str_contains($position, 'punong barangay')) {
                $organized['captain'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'secretary')) {
                $organized['secretary'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            } elseif (str_contains($position, 'treasurer')) {
                $organized['treasurer'] = [
                    'name' => $official->name,
                    'position' => $official->position
                ];
            }
        }

        return $organized;
    }

    /**
     * Get captain user with signature
     */
    protected function getCaptainForCertificate(): ?array
    {
        $captainUser = User::where('role', 'captain')->first();
        
        if (!$captainUser) {
            return null;
        }

        $signatureBase64 = null;
        if ($captainUser->signature_path && Storage::disk('public')->exists($captainUser->signature_path)) {
            $signaturePath = Storage::disk('public')->path($captainUser->signature_path);
            $imageData = file_get_contents($signaturePath);
            $imageInfo = getimagesizefromstring($imageData);
            if ($imageInfo !== false) {
                $mimeType = $imageInfo['mime'];
                $signatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
            }
        }

        return [
            'name' => $captainUser->name,
            'position' => 'Barangay Captain',
            'signature_base64' => $signatureBase64
        ];
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

            // Prepare data first to catch any errors early
            $data = $this->prepareCertificateData($certificate);
            $view = $this->getViewForCertificate($certificate);

            Log::info('Generating PDF for download', [
                'certificate_id' => $certificate->id,
                'view' => $view,
                'filename' => $filename
            ]);

            // Use PdfService for download (generates fresh PDF on-demand)
            return $this->pdfService->download(
                $view,
                $data,
                $filename,
                ['paper' => 'A4', 'orientation' => 'portrait']
            );
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

            // Prepare data first to catch any errors early
            $data = $this->prepareCertificateData($certificate);
            $view = $this->getViewForCertificate($certificate);

            Log::info('Generating PDF for preview', [
                'certificate_id' => $certificate->id,
                'view' => $view,
                'filename' => $filename
            ]);

            // Use PdfService for preview (generates fresh PDF on-demand)
            return $this->pdfService->preview(
                $view,
                $data,
                $filename,
                ['paper' => 'A4', 'orientation' => 'portrait']
            );
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
