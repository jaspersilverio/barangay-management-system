<?php

namespace App\Http\Controllers;

use App\Models\IssuedCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class CertificatePdfController extends Controller
{
    public function generateCertificatePdf(IssuedCertificate $certificate): ?string
    {
        try {
            // Load the certificate with relationships
            $certificate->load(['resident', 'issuedBy', 'certificateRequest']);

            // Get barangay settings
            $barangayName = 'Barangay Poblacion Sur';
            $barangayAddress = 'Iloilo City, Philippines';
            $barangayContact = '+63 33 123 4567';

            // Prepare data for PDF
            $data = [
                'certificate' => $certificate,
                'resident' => $certificate->resident,
                'barangay_name' => $barangayName,
                'barangay_address' => $barangayAddress,
                'barangay_contact' => $barangayContact,
                'current_date' => Carbon::now()->format('F d, Y'),
                'valid_from_formatted' => Carbon::parse($certificate->valid_from)->format('F d, Y'),
                'valid_until_formatted' => Carbon::parse($certificate->valid_until)->format('F d, Y'),
                'issued_date_formatted' => Carbon::parse($certificate->created_at)->format('F d, Y'),
                'qr_code_data' => $certificate->qr_code
            ];

            // Generate PDF based on certificate type
            $pdf = match ($certificate->certificate_type) {
                'barangay_clearance' => $this->generateBarangayClearancePdf($data),
                'indigency' => $this->generateIndigencyPdf($data),
                'residency' => $this->generateResidencyPdf($data),
                'business_permit_endorsement' => $this->generateBusinessPermitPdf($data),
                default => $this->generateGenericCertificatePdf($data)
            };

            // Generate filename
            $filename = sprintf(
                'certificates/%s_%s_%s.pdf',
                $certificate->certificate_type,
                $certificate->certificate_number,
                Carbon::now()->format('Y-m-d_H-i-s')
            );

            // Save PDF to storage
            Storage::disk('public')->put($filename, $pdf->output());

            return $filename;
        } catch (\Exception $e) {
            Log::error('PDF generation failed: ' . $e->getMessage());
            return null;
        }
    }

    private function generateBarangayClearancePdf(array $data)
    {
        $html = view('pdf.barangay-clearance', $data)->render();

        return Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial'
            ]);
    }

    private function generateIndigencyPdf(array $data)
    {
        $html = view('pdf.indigency', $data)->render();

        return Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial'
            ]);
    }

    private function generateResidencyPdf(array $data)
    {
        $html = view('pdf.residency', $data)->render();

        return Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial'
            ]);
    }

    private function generateBusinessPermitPdf(array $data)
    {
        $html = view('pdf.business-permit', $data)->render();

        return Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial'
            ]);
    }

    private function generateGenericCertificatePdf(array $data)
    {
        $html = view('pdf.generic-certificate', $data)->render();

        return Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial'
            ]);
    }

    public function downloadCertificate(IssuedCertificate $certificate)
    {
        if (!$certificate->pdf_path) {
            return response()->json([
                'success' => false,
                'message' => 'PDF not found'
            ], 404);
        }

        if (!Storage::disk('public')->exists($certificate->pdf_path)) {
            // Regenerate PDF if file doesn't exist
            $pdfPath = $this->generateCertificatePdf($certificate);
            if (!$pdfPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate PDF'
                ], 500);
            }
        }

        $url = asset('storage/' . $certificate->pdf_path);
        $filename = basename($certificate->pdf_path);

        return response()->json([
            'success' => true,
            'data' => [
                'download_url' => $url,
                'filename' => $filename
            ]
        ]);
    }

    public function previewCertificate(IssuedCertificate $certificate)
    {
        if (!$certificate->pdf_path) {
            return response()->json([
                'success' => false,
                'message' => 'PDF not found'
            ], 404);
        }

        if (!Storage::disk('public')->exists($certificate->pdf_path)) {
            // Regenerate PDF if file doesn't exist
            $pdfPath = $this->generateCertificatePdf($certificate);
            if (!$pdfPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate PDF'
                ], 500);
            }
        }

        $url = asset('storage/' . $certificate->pdf_path);

        return response()->json([
            'success' => true,
            'data' => [
                'preview_url' => $url,
                'download_url' => $url
            ]
        ]);
    }
}
