<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\BarangayInfo;
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
     * Get barangay information from BarangayInfo model (singleton - id = 1)
     */
    public function getBarangayInfo(): array
    {
        $barangayInfo = BarangayInfo::find(1);

        if (!$barangayInfo) {
            // Return defaults if not configured
            return [
                'barangay_name' => 'Barangay',
                'municipality' => 'Municipality',
                'province' => 'Province',
                'region' => 'Region',
                'address' => '',
                'contact_number' => '',
                'email' => '',
                'captain_name' => '',
                'logo_path' => null,
                'logo_base64' => null,
            ];
        }

        // Convert logo to base64 for PDF generation (DomPDF can't load URLs)
        $logoBase64 = null;
        
        if ($barangayInfo->logo_path) {
            try {
                if (Storage::disk('public')->exists($barangayInfo->logo_path)) {
                    $logoPath = Storage::disk('public')->path($barangayInfo->logo_path);
                    if (file_exists($logoPath) && is_readable($logoPath)) {
                        $imageData = @file_get_contents($logoPath);
                        if ($imageData !== false) {
                            // Determine MIME type from file extension (works without GD)
                            $mimeType = $this->getMimeTypeFromExtension($barangayInfo->logo_path);
                            
                            // If GD is available, try to get more accurate MIME type
                            if (extension_loaded('gd')) {
                                $imageInfo = @getimagesizefromstring($imageData);
                                if ($imageInfo !== false && isset($imageInfo['mime'])) {
                                    $mimeType = $imageInfo['mime'];
                                }
                            }
                            
                            if ($mimeType) {
                                $logoBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to load logo for PDF', [
                    'error' => $e->getMessage(),
                    'logo_path' => $barangayInfo->logo_path
                ]);
            }
        }

        // Return both new and legacy field names for backward compatibility with PDF templates
        return [
            // New structure
            'barangay_name' => $barangayInfo->barangay_name ?? 'Barangay',
            'municipality' => $barangayInfo->municipality ?? 'Municipality',
            'province' => $barangayInfo->province ?? 'Province',
            'region' => $barangayInfo->region ?? 'Region',
            'address' => $barangayInfo->address ?? '',
            'contact_number' => $barangayInfo->contact_number ?? '',
            'email' => $barangayInfo->email ?? '',
            'captain_name' => $barangayInfo->captain_name ?? '',
            'secretary_name' => $barangayInfo->secretary_name ?? null,
            'treasurer_name' => $barangayInfo->treasurer_name ?? null,
            'logo_path' => $barangayInfo->logo_path,
            'logo_base64' => $logoBase64, // Base64 encoded logo for PDF
            // Legacy field names for backward compatibility with existing PDF templates
            'name' => $barangayInfo->barangay_name ?? 'Barangay',
            'contact' => $barangayInfo->contact_number ?? '',
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

        // Render HTML with error handling
        try {
            $html = view($view, $data)->render();
        } catch (\Exception $e) {
            Log::error('Failed to render PDF view', [
                'view' => $view,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to render PDF template: ' . $e->getMessage());
        }

        // Generate PDF with timeout protection
        try {
            // Increase memory and execution time limits for PDF generation
            $originalMemoryLimit = ini_get('memory_limit');
            $originalMaxExecutionTime = ini_get('max_execution_time');
            
            ini_set('memory_limit', '256M');
            set_time_limit(60); // 60 second timeout for PDF generation
            
            Log::info('Loading HTML into PDF', ['html_length' => strlen($html)]);
            
            $pdf = Pdf::loadHTML($html)
                ->setPaper($mergedOptions['paper'], $mergedOptions['orientation'])
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => false, // Disable remote URLs to prevent hanging
                    'defaultFont' => 'Arial',
                    'margin-top' => $mergedOptions['margin']['top'] ?? 20,
                    'margin-right' => $mergedOptions['margin']['right'] ?? 15,
                    'margin-bottom' => $mergedOptions['margin']['bottom'] ?? 20,
                    'margin-left' => $mergedOptions['margin']['left'] ?? 15,
                    'enable-local-file-access' => true,
                    'enable-javascript' => false,
                    'chroot' => realpath(base_path()),
                    'dpi' => 96,
                    'fontHeightRatio' => 1.1,
                ]);

            Log::info('PDF object created successfully');

            // Restore original limits
            if ($originalMemoryLimit) {
                ini_set('memory_limit', $originalMemoryLimit);
            }
            if ($originalMaxExecutionTime) {
                set_time_limit($originalMaxExecutionTime);
            }

            return $pdf;
        } catch (\Exception $e) {
            Log::error('Failed to generate PDF', [
                'view' => $view,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('PDF generation failed: ' . $e->getMessage());
        }
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
            Log::info('Starting PDF download generation', ['view' => $view, 'filename' => $filename]);
            
            $pdf = $this->generateFromView($view, $data, $options);

            Log::info('PDF generated, outputting...', ['view' => $view]);
            
            // Output PDF with error handling
            $output = $pdf->output();
            
            Log::info('PDF output completed', ['view' => $view, 'size' => strlen($output)]);

            return response($output, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=0, must-revalidate')
                ->header('Pragma', 'public');
        } catch (\Exception $e) {
            Log::error('PDF download generation failed', [
                'view' => $view,
                'filename' => $filename,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
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
            Log::info('Starting PDF preview generation', ['view' => $view, 'filename' => $filename]);
            
            $pdf = $this->generateFromView($view, $data, $options);

            Log::info('PDF generated, outputting...', ['view' => $view]);
            
            // Output PDF with error handling
            $output = $pdf->output();
            
            Log::info('PDF output completed', ['view' => $view, 'size' => strlen($output)]);

            return response($output, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=0, must-revalidate')
                ->header('Pragma', 'public');
        } catch (\Exception $e) {
            Log::error('PDF preview generation failed', [
                'view' => $view,
                'filename' => $filename,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
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
}
