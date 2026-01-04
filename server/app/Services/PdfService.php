<?php

namespace App\Services;

use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Centralized PDF Generation Service
 *
 * This service provides a unified, production-ready PDF generation system
 * for all modules in the Barangay Management System.
 *
 * Features:
 * - Centralized barangay information from settings
 * - Reusable layout templates
 * - Automatic headers, footers, and page numbers
 * - Memory-safe rendering for large datasets
 * - Secure file handling
 */
class PdfService
{
    /**
     * Get barangay information from settings
     */
    public function getBarangayInfo(): array
    {
        $setting = Setting::where('key', 'barangay_info')->first();

        if (!$setting || !$setting->value) {
            // Return defaults if settings not configured
            return [
                'name' => 'Barangay',
                'address' => 'Municipality, Province',
                'contact' => '',
                'logo_path' => null,
            ];
        }

        $info = $setting->value;

        return [
            'name' => $info['name'] ?? 'Barangay',
            'address' => $info['address'] ?? 'Municipality, Province',
            'contact' => $info['contact'] ?? '',
            'logo_path' => $info['logo_path'] ?? null,
        ];
    }

    /**
     * Generate PDF from HTML view with standard layout
     *
     * @param string $view Blade view path
     * @param array $data Data to pass to view
     * @param array $options PDF options (paper size, orientation, etc.)
     * @return \Barryvdh\DomPDF\PDF
     */
    public function generateFromView(string $view, array $data = [], array $options = [])
    {
        // Merge barangay info into data
        $data['barangay_info'] = $this->getBarangayInfo();
        $data['generated_at'] = Carbon::now()->format('F d, Y h:i A');
        $data['generated_date'] = Carbon::now()->format('F d, Y');
        $data['generated_time'] = Carbon::now()->format('h:i A');

        // Default options
        $defaultOptions = [
            'paper' => $options['paper'] ?? 'A4',
            'orientation' => $options['orientation'] ?? 'portrait',
            'margin' => $options['margin'] ?? [
                'top' => 20,
                'right' => 15,
                'bottom' => 20,
                'left' => 15,
            ],
        ];

        $mergedOptions = array_merge($defaultOptions, $options);

        // Render HTML
        $html = view($view, $data)->render();

        // Generate PDF
        $pdf = Pdf::loadHTML($html)
            ->setPaper($mergedOptions['paper'], $mergedOptions['orientation'])
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'Arial',
                'margin-top' => $mergedOptions['margin']['top'] ?? 20,
                'margin-right' => $mergedOptions['margin']['right'] ?? 15,
                'margin-bottom' => $mergedOptions['margin']['bottom'] ?? 20,
                'margin-left' => $mergedOptions['margin']['left'] ?? 15,
                'enable-local-file-access' => true,
                'enable-javascript' => false,
            ]);

        return $pdf;
    }

    /**
     * Generate PDF and return as download response
     *
     * @param string $view Blade view path
     * @param array $data Data to pass to view
     * @param string $filename Download filename
     * @param array $options PDF options
     * @return \Illuminate\Http\Response
     */
    public function download(string $view, array $data = [], string $filename = 'document.pdf', array $options = [])
    {
        try {
            $pdf = $this->generateFromView($view, $data, $options);

            return response($pdf->output(), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=0, must-revalidate')
                ->header('Pragma', 'public');
        } catch (\Exception $e) {
            Log::error('PDF download generation failed: ' . $e->getMessage(), [
                'view' => $view,
                'filename' => $filename,
                'exception' => $e
            ]);

            throw $e;
        }
    }

    /**
     * Generate PDF and return as inline response (for preview)
     *
     * @param string $view Blade view path
     * @param array $data Data to pass to view
     * @param string $filename Filename for preview
     * @param array $options PDF options
     * @return \Illuminate\Http\Response
     */
    public function preview(string $view, array $data = [], string $filename = 'document.pdf', array $options = [])
    {
        try {
            $pdf = $this->generateFromView($view, $data, $options);

            return response($pdf->output(), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=0, must-revalidate')
                ->header('Pragma', 'public');
        } catch (\Exception $e) {
            Log::error('PDF preview generation failed: ' . $e->getMessage(), [
                'view' => $view,
                'filename' => $filename,
                'exception' => $e
            ]);

            throw $e;
        }
    }

    /**
     * Generate PDF and save to storage
     *
     * @param string $view Blade view path
     * @param array $data Data to pass to view
     * @param string $storagePath Storage path (e.g., 'certificates/cert_123.pdf')
     * @param array $options PDF options
     * @return string|null Storage path if successful, null on failure
     */
    public function saveToStorage(string $view, array $data = [], string $storagePath = 'pdfs/document.pdf', array $options = [])
    {
        try {
            $pdf = $this->generateFromView($view, $data, $options);

            // Ensure directory exists
            $directory = dirname($storagePath);
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            // Save PDF
            Storage::disk('public')->put($storagePath, $pdf->output());

            return $storagePath;
        } catch (\Exception $e) {
            Log::error('PDF storage generation failed: ' . $e->getMessage(), [
                'view' => $view,
                'storage_path' => $storagePath,
                'exception' => $e
            ]);

            return null;
        }
    }

    /**
     * Generate PDF for reports (supports large datasets with pagination)
     *
     * @param string $view Blade view path
     * @param array $data Data to pass to view
     * @param string $filename Download filename
     * @param array $options PDF options
     * @return \Illuminate\Http\Response
     */
    public function generateReport(string $view, array $data = [], string $filename = 'report.pdf', array $options = [])
    {
        // For reports, use landscape if specified, otherwise portrait
        $options['orientation'] = $options['orientation'] ?? 'portrait';

        // Add report-specific data
        $data['is_report'] = true;
        $data['report_title'] = $data['report_title'] ?? 'Report';

        return $this->download($view, $data, $filename, $options);
    }
}
