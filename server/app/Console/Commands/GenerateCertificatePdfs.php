<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\IssuedCertificate;
use App\Http\Controllers\CertificatePdfController;

class GenerateCertificatePdfs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'certificates:generate-pdfs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate PDFs for all certificates that do not have PDFs yet';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting PDF generation for certificates...');

        // Get certificates without PDFs
        $certificates = IssuedCertificate::whereNull('pdf_path')->get();

        if ($certificates->isEmpty()) {
            $this->info('No certificates found without PDFs.');
            return;
        }

        $this->info("Found {$certificates->count()} certificates without PDFs.");

        $pdfController = new CertificatePdfController();
        $successCount = 0;
        $errorCount = 0;

        foreach ($certificates as $certificate) {
            try {
                $this->info("Generating PDF for certificate: {$certificate->certificate_number}");

                $pdfPath = $pdfController->generateCertificatePdf($certificate);

                if ($pdfPath) {
                    $certificate->pdf_path = $pdfPath;
                    $certificate->save();
                    $successCount++;
                    $this->info("✓ PDF generated successfully for {$certificate->certificate_number}");
                } else {
                    $errorCount++;
                    $this->error("✗ Failed to generate PDF for {$certificate->certificate_number}");
                }
            } catch (\Exception $e) {
                $errorCount++;
                $this->error("✗ Error generating PDF for {$certificate->certificate_number}: {$e->getMessage()}");
            }
        }

        $this->info("\nPDF generation completed!");
        $this->info("Successfully generated: {$successCount} PDFs");
        $this->info("Errors: {$errorCount} PDFs");
    }
}
