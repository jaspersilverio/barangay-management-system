<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Purok;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DevController extends Controller
{
    public function seed()
    {
        // Create a default admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => Hash::make('password'), 'role' => 'admin']
        );

        // Create sample puroks
        $p1 = Purok::firstOrCreate(['code' => 'P1'], ['name' => 'Purok 1']);
        $p2 = Purok::firstOrCreate(['code' => 'P2'], ['name' => 'Purok 2']);

        // Create households
        $h1 = Household::firstOrCreate(
            ['household_code' => 'HH-000001'],
            [
                'purok_id' => $p1->id,
                'head_name' => 'Juan Dela Cruz',
                'address' => 'Blk 1 Lot 2',
                'created_by' => $admin->id,
            ]
        );
        $h2 = Household::firstOrCreate(
            ['household_code' => 'HH-000002'],
            [
                'purok_id' => $p2->id,
                'head_name' => 'Maria Santos',
                'address' => 'Sitio Riverside',
                'created_by' => $admin->id,
            ]
        );

        // Add a few residents
        Resident::firstOrCreate([
            'household_id' => $h1->id,
            'first_name' => 'Pedro',
            'last_name' => 'Dela Cruz',
            'sex' => 'male',
            'birthdate' => '1980-01-01',
            'relationship_to_head' => 'Spouse',
            'occupation_status' => 'employed',
        ]);

        Resident::firstOrCreate([
            'household_id' => $h1->id,
            'first_name' => 'Ana',
            'last_name' => 'Dela Cruz',
            'sex' => 'female',
            'birthdate' => '2015-05-10',
            'relationship_to_head' => 'Child',
            'occupation_status' => 'student',
        ]);

        Resident::firstOrCreate([
            'household_id' => $h2->id,
            'first_name' => 'Jose',
            'last_name' => 'Santos',
            'sex' => 'male',
            'birthdate' => '1955-07-07',
            'relationship_to_head' => 'Parent',
            'occupation_status' => 'retired',
            'is_pwd' => true,
        ]);

        return $this->respondSuccess([
            'admin_user' => $admin->only(['id', 'email', 'role']),
            'puroks' => Purok::count(),
            'households' => Household::count(),
            'residents' => Resident::count(),
        ], 'Dev data seeded');
    }
}
