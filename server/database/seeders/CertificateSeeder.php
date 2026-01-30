<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CertificateRequest;
use App\Models\IssuedCertificate;
use App\Models\Resident;
use App\Models\User;
use Carbon\Carbon;

class CertificateSeeder extends Seeder
{
    public function run(): void
    {
        // Get some residents and users for sample data
        $residents = Resident::take(5)->get();
        $users = User::take(3)->get();

        if ($residents->isEmpty() || $users->isEmpty()) {
            $this->command->info('No residents or users found. Please run ResidentSeeder and UserSeeder first.');
            return;
        }

        // Create sample certificate requests
        $certificateTypes = ['barangay_clearance', 'indigency', 'residency', 'business_permit_endorsement'];
        $statuses = ['pending', 'approved', 'released', 'rejected'];
        $purposes = [
            'For employment application',
            'For business permit renewal',
            'For scholarship application',
            'For government transaction',
            'For travel requirements',
            'For school enrollment',
            'For loan application',
            'For legal documentation'
        ];

        foreach ($residents as $resident) {
            // Create 2-4 requests per resident
            $numRequests = rand(2, 4);

            for ($i = 0; $i < $numRequests; $i++) {
                $status = $statuses[array_rand($statuses)];
                $certificateType = $certificateTypes[array_rand($certificateTypes)];
                $purpose = $purposes[array_rand($purposes)];

                $request = CertificateRequest::create([
                    'resident_id' => $resident->id,
                    'requested_by' => $users->random()->id,
                    'certificate_type' => $certificateType,
                    'purpose' => $purpose,
                    'additional_requirements' => rand(0, 1) ? 'Additional documents may be required.' : null,
                    'status' => $status,
                    'remarks' => $status === 'rejected' ? 'Incomplete requirements' : null,
                    'requested_at' => Carbon::now()->subDays(rand(1, 30)),
                    'approved_at' => $status === 'approved' || $status === 'released' ? Carbon::now()->subDays(rand(1, 15)) : null,
                    'released_at' => $status === 'released' ? Carbon::now()->subDays(rand(1, 7)) : null,
                    'rejected_at' => $status === 'rejected' ? Carbon::now()->subDays(rand(1, 10)) : null,
                ]);

                // If request is approved or released, create an issued certificate
                if ($status === 'approved' || $status === 'released') {
                    $validFrom = Carbon::now()->subDays(rand(1, 10));
                    $validUntil = $validFrom->copy()->addMonths(rand(3, 12));

                    $certificate = IssuedCertificate::create([
                        'certificate_request_id' => $request->id,
                        'resident_id' => $resident->id,
                        'issued_by' => $users->random()->id,
                        'certificate_type' => $certificateType,
                        'certificate_number' => '', // Will be generated
                        'purpose' => $purpose,
                        'valid_from' => $validFrom,
                        'valid_until' => $validUntil,
                        'is_valid' => $validUntil->isFuture(),
                        'signed_by' => $users->random()->name,
                        'signature_position' => 'Punong Barangay',
                        'signed_at' => $validFrom,
                    ]);

                    // Generate certificate number and QR code
                    $certificate->certificate_number = $certificate->generateCertificateNumber();
                    $certificate->qr_code = $certificate->generateQrCode();
                    $certificate->save();
                }
            }
        }

        $this->command->info('Certificate sample data created successfully!');
    }
}
