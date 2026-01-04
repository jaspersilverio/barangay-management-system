<?php

namespace App\Http\Controllers;

use App\Models\IssuedCertificate;
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
     * Generate certificate PDF and save to storage
     */
    public function generateCertificatePdf(IssuedCertificate $certificate): ?string
    {
        try {
            // Load the certificate with relationships
            $certificate->load(['resident', 'issuedBy', 'certificateRequest']);

            // Prepare data for PDF
            $data = [
                'title' => $certificate->certificate_type_label ?? 'Certificate',
                'document_title' => strtoupper($certificate->certificate_type_label ?? 'CERTIFICATE'),
                'certificate' => $certificate,
                'resident' => $certificate->resident,
                'valid_from_formatted' => Carbon::parse($certificate->valid_from)->format('F d, Y'),
                'valid_until_formatted' => Carbon::parse($certificate->valid_until)->format('F d, Y'),
                'issued_date_formatted' => Carbon::parse($certificate->created_at)->format('F d, Y'),
                'qr_code_data' => $certificate->qr_code
            ];

            // Determine view based on certificate type
            $view = match ($certificate->certificate_type) {
                'barangay_clearance' => 'pdf.barangay-clearance',
                'indigency' => 'pdf.indigency',
                'residency' => 'pdf.residency',
                'business_permit_endorsement' => 'pdf.business-permit',
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
        $certificate = IssuedCertificate::find($id);

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found'
            ], 404);
        }

        // Check if PDF exists, regenerate if needed
        if (!$certificate->pdf_path || !Storage::disk('public')->exists($certificate->pdf_path)) {
            $pdfPath = $this->generateCertificatePdf($certificate);
            if (!$pdfPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate PDF'
                ], 500);
            }
            $certificate->pdf_path = $pdfPath;
            $certificate->save();
        }

        // Serve from storage
        $filePath = Storage::disk('public')->path($certificate->pdf_path);
        $filename = basename($certificate->pdf_path);

        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }

    /**
     * Preview certificate PDF in browser
     */
    public function previewCertificate($id)
    {
        $certificate = IssuedCertificate::find($id);

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found'
            ], 404);
        }

        // Check if PDF exists, regenerate if needed
        if (!$certificate->pdf_path || !Storage::disk('public')->exists($certificate->pdf_path)) {
            $pdfPath = $this->generateCertificatePdf($certificate);
            if (!$pdfPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate PDF'
                ], 500);
            }
            $certificate->pdf_path = $pdfPath;
            $certificate->save();
        }

        // Serve from storage
        $filePath = Storage::disk('public')->path($certificate->pdf_path);
        $filename = basename($certificate->pdf_path);

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"'
        ]);
    }
}
