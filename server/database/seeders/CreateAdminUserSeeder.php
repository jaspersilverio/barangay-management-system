<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CreateAdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $user = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123!'),
            'role' => 'admin',
        ]);

        // Create token
        $token = $user->createToken('API Token')->plainTextToken;

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@example.com');
        $this->command->info('Password: admin123!');
        $this->command->info('Token: ' . $token);
        $this->command->info('Copy this token and use it in your frontend!');
    }
}
