<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'barangay_info',
                'value' => [
                    'name' => 'Barangay Poblacion Sur',
                    'address' => 'Poblacion Sur, Municipality, Province',
                    'contact' => '+63 912 345 6789',
                    'logo_path' => null,
                ],
            ],
            [
                'key' => 'system_preferences',
                'value' => [
                    'theme' => 'light',
                    'per_page' => 10,
                    'date_format' => 'YYYY-MM-DD',
                ],
            ],
            [
                'key' => 'emergency',
                'value' => [
                    'contact_numbers' => [
                        ['name' => 'Police Station', 'number' => '911'],
                        ['name' => 'Fire Station', 'number' => '912'],
                        ['name' => 'Hospital', 'number' => '913'],
                    ],
                    'evacuation_centers' => [
                        [
                            'name' => 'Barangay Hall',
                            'address' => 'Poblacion Sur, Municipality',
                            'capacity' => 500,
                        ],
                        [
                            'name' => 'Elementary School',
                            'address' => 'School Street, Municipality',
                            'capacity' => 1000,
                        ],
                    ],
                ],
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }
    }
}
