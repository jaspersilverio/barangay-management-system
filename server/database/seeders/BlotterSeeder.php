<?php

namespace Database\Seeders;

use App\Models\Blotter;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class BlotterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Log::info('Starting BlotterSeeder...');

        // Get some residents and users for the blotter cases
        $residents = Resident::all();
        $users = User::all();

        if ($residents->count() < 2 || $users->count() < 1) {
            Log::warning('Not enough residents or users found. Please run ResidentSeeder and UserSeeder first.');
            return;
        }

        Log::info("Found {$residents->count()} residents and {$users->count()} users");

        // Sample non-resident data
        $nonResidents = [
            [
                'name' => 'Juan Dela Cruz',
                'age' => 35,
                'address' => '123 Main Street, Quezon City',
                'contact' => '09123456789'
            ],
            [
                'name' => 'Maria Santos',
                'age' => 28,
                'address' => '456 Oak Avenue, Manila',
                'contact' => '09234567890'
            ],
            [
                'name' => 'Pedro Rodriguez',
                'age' => 42,
                'address' => '789 Pine Street, Makati',
                'contact' => '09345678901'
            ],
            [
                'name' => 'Ana Garcia',
                'age' => 31,
                'address' => '321 Elm Street, Taguig',
                'contact' => '09456789012'
            ],
            [
                'name' => 'Carlos Martinez',
                'age' => 38,
                'address' => '654 Maple Avenue, Pasig',
                'contact' => '09567890123'
            ]
        ];

        $blotterCases = [
            // Case 1: Resident vs Resident
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => true,
                'respondent_id' => $residents->random()->id,
                'respondent_full_name' => null,
                'respondent_age' => null,
                'respondent_address' => null,
                'respondent_contact' => null,
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 30))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(6, 22), rand(0, 59)),
                'incident_location' => 'Barangay Hall - Main Street',
                'description' => 'Noise complaint regarding loud music during late hours. The complainant reported that their neighbor was playing music at high volume past 10 PM, disturbing the peace and quiet of the neighborhood.',
                'status' => 'Resolved',
                'resolution' => 'Spoke with the respondent about the noise ordinance. They agreed to lower the volume and respect quiet hours. No further incidents reported.',
                'created_by' => $users->random()->id,
            ],
            // Case 2: Resident vs Non-Resident
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => false,
                'respondent_id' => null,
                'respondent_full_name' => $nonResidents[0]['name'],
                'respondent_age' => $nonResidents[0]['age'],
                'respondent_address' => $nonResidents[0]['address'],
                'respondent_contact' => $nonResidents[0]['contact'],
                'official_id' => $users->where('role', 'purok_leader')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 15))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(8, 18), rand(0, 59)),
                'incident_location' => 'Public Market - Commercial Area',
                'description' => 'Dispute over parking space. The complainant alleges that a non-resident visitor parked their vehicle in a designated resident parking area without permission.',
                'status' => 'Ongoing',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 3: Non-Resident vs Resident
            [
                'complainant_is_resident' => false,
                'complainant_id' => null,
                'complainant_full_name' => $nonResidents[1]['name'],
                'complainant_age' => $nonResidents[1]['age'],
                'complainant_address' => $nonResidents[1]['address'],
                'complainant_contact' => $nonResidents[1]['contact'],
                'respondent_is_resident' => true,
                'respondent_id' => $residents->random()->id,
                'respondent_full_name' => null,
                'respondent_age' => null,
                'respondent_address' => null,
                'respondent_contact' => null,
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 20))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(10, 16), rand(0, 59)),
                'incident_location' => 'Community Center - Sports Area',
                'description' => 'Altercation during basketball game. The complainant (visitor) claims that a resident player was being overly aggressive and used inappropriate language.',
                'status' => 'Open',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 4: Non-Resident vs Non-Resident
            [
                'complainant_is_resident' => false,
                'complainant_id' => null,
                'complainant_full_name' => $nonResidents[2]['name'],
                'complainant_age' => $nonResidents[2]['age'],
                'complainant_address' => $nonResidents[2]['address'],
                'complainant_contact' => $nonResidents[2]['contact'],
                'respondent_is_resident' => false,
                'respondent_id' => null,
                'respondent_full_name' => $nonResidents[3]['name'],
                'respondent_age' => $nonResidents[3]['age'],
                'respondent_address' => $nonResidents[3]['address'],
                'respondent_contact' => $nonResidents[3]['contact'],
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 10))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(14, 20), rand(0, 59)),
                'incident_location' => 'Public Park - Playground Area',
                'description' => 'Dispute between two visitors over playground equipment usage. Both parties claim the other was being unreasonable about sharing the facilities.',
                'status' => 'Resolved',
                'resolution' => 'Mediated discussion between both parties. Established clear guidelines for playground usage and both agreed to be more considerate of others.',
                'created_by' => $users->random()->id,
            ],
            // Case 5: Resident vs Resident (Property dispute)
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => true,
                'respondent_id' => $residents->random()->id,
                'respondent_full_name' => null,
                'respondent_age' => null,
                'respondent_address' => null,
                'respondent_contact' => null,
                'official_id' => $users->where('role', 'purok_leader')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 25))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(9, 17), rand(0, 59)),
                'incident_location' => 'Residential Area - Boundary Dispute',
                'description' => 'Boundary dispute between neighboring properties. The complainant alleges that the respondent has encroached on their property line by extending their fence.',
                'status' => 'Ongoing',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 6: Resident vs Non-Resident (Traffic incident)
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => false,
                'respondent_id' => null,
                'respondent_full_name' => $nonResidents[4]['name'],
                'respondent_age' => $nonResidents[4]['age'],
                'respondent_address' => $nonResidents[4]['address'],
                'respondent_contact' => $nonResidents[4]['contact'],
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 12))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(7, 9), rand(0, 59)),
                'incident_location' => 'Main Road - School Zone',
                'description' => 'Traffic incident involving speeding vehicle. The complainant reports that a non-resident driver was speeding through the school zone during morning hours, endangering children.',
                'status' => 'Open',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 7: Non-Resident vs Resident (Business dispute)
            [
                'complainant_is_resident' => false,
                'complainant_id' => null,
                'complainant_full_name' => 'Roberto Silva',
                'complainant_age' => 45,
                'complainant_address' => '987 Business District, Ortigas',
                'complainant_contact' => '09678901234',
                'respondent_is_resident' => true,
                'respondent_id' => $residents->random()->id,
                'respondent_full_name' => null,
                'respondent_age' => null,
                'respondent_address' => null,
                'respondent_contact' => null,
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 18))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(11, 15), rand(0, 59)),
                'incident_location' => 'Local Sari-Sari Store',
                'description' => 'Business transaction dispute. The complainant (supplier) claims that a resident store owner has not paid for delivered goods as agreed.',
                'status' => 'Resolved',
                'resolution' => 'Payment plan established. The respondent agreed to pay in installments over the next three months.',
                'created_by' => $users->random()->id,
            ],
            // Case 8: Resident vs Resident (Animal complaint)
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => true,
                'respondent_id' => $residents->random()->id,
                'respondent_full_name' => null,
                'respondent_age' => null,
                'respondent_address' => null,
                'respondent_contact' => null,
                'official_id' => $users->where('role', 'purok_leader')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 22))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(6, 8), rand(0, 59)),
                'incident_location' => 'Residential Area - Pet Owner\'s Property',
                'description' => 'Complaint about loose dog. The complainant reports that their neighbor\'s dog frequently escapes and causes disturbance in the neighborhood.',
                'status' => 'Ongoing',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 9: Non-Resident vs Non-Resident (Accident)
            [
                'complainant_is_resident' => false,
                'complainant_id' => null,
                'complainant_full_name' => 'Luis Fernandez',
                'complainant_age' => 33,
                'complainant_address' => '555 Industrial Road, Caloocan',
                'complainant_contact' => '09789012345',
                'respondent_is_resident' => false,
                'respondent_id' => null,
                'respondent_full_name' => 'Isabel Torres',
                'respondent_age' => 29,
                'respondent_address' => '777 Commercial Street, Marikina',
                'respondent_contact' => '09890123456',
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 8))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(16, 18), rand(0, 59)),
                'incident_location' => 'Public Road - Intersection',
                'description' => 'Minor vehicular accident between two non-residents. Both parties claim the other was at fault for the collision.',
                'status' => 'Open',
                'resolution' => null,
                'created_by' => $users->random()->id,
            ],
            // Case 10: Resident vs Non-Resident (Environmental)
            [
                'complainant_is_resident' => true,
                'complainant_id' => $residents->random()->id,
                'complainant_full_name' => null,
                'complainant_age' => null,
                'complainant_address' => null,
                'complainant_contact' => null,
                'respondent_is_resident' => false,
                'respondent_id' => null,
                'respondent_full_name' => 'Miguel Ramos',
                'respondent_age' => 40,
                'respondent_address' => '888 Construction Site, Mandaluyong',
                'respondent_contact' => '09901234567',
                'official_id' => $users->where('role', 'admin')->first()?->id,
                'incident_date' => now()->subDays(rand(1, 5))->format('Y-m-d'),
                'incident_time' => sprintf('%02d:%02d', rand(7, 12), rand(0, 59)),
                'incident_location' => 'Construction Site - Adjacent to Residential Area',
                'description' => 'Environmental complaint about construction noise and dust. The complainant reports that ongoing construction work is causing excessive noise and air pollution.',
                'status' => 'Resolved',
                'resolution' => 'Construction company agreed to implement noise reduction measures and dust control protocols during work hours.',
                'created_by' => $users->random()->id,
            ]
        ];

        foreach ($blotterCases as $index => $caseData) {
            try {
                // Generate case number
                $caseData['case_number'] = Blotter::generateCaseNumber();

                $blotter = Blotter::create($caseData);
                Log::info("Created blotter case: {$blotter->case_number}");

                // Add some random attachments for some cases
                if (rand(1, 3) === 1) {
                    $attachments = [
                        [
                            'filename' => 'incident_photo_' . ($index + 1) . '.jpg',
                            'path' => 'blotter-attachments/sample_photo_' . ($index + 1) . '.jpg',
                            'size' => rand(50000, 200000),
                            'mime_type' => 'image/jpeg'
                        ]
                    ];

                    if (rand(1, 2) === 1) {
                        $attachments[] = [
                            'filename' => 'witness_statement_' . ($index + 1) . '.pdf',
                            'path' => 'blotter-attachments/sample_statement_' . ($index + 1) . '.pdf',
                            'size' => rand(100000, 500000),
                            'mime_type' => 'application/pdf'
                        ];
                    }

                    $blotter->update(['attachments' => $attachments]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to create blotter case {$index}: " . $e->getMessage());
            }
        }

        Log::info('BlotterSeeder completed successfully!');
    }
}
