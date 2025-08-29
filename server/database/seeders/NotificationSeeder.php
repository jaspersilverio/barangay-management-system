<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin users
        $adminUsers = User::where('role', 'admin')->get();
        $purokLeaders = User::where('role', 'purok_leader')->get();

        // Sample notifications
        $notifications = [
            [
                'title' => 'Welcome to Barangay Management System',
                'message' => 'Welcome! The barangay management system is now fully operational. You can start managing households, residents, and events.',
                'type' => 'system',
                'user_id' => null, // System-wide
                'is_read' => false,
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => 'New Household Registration',
                'message' => 'A new household has been registered: Santos Family at 123 Main Street, Purok 1',
                'type' => 'household',
                'user_id' => null, // Will be assigned to admins
                'is_read' => false,
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Upcoming Barangay Assembly',
                'message' => 'Barangay Assembly scheduled for next week. All residents are encouraged to attend.',
                'type' => 'event',
                'user_id' => null, // System-wide
                'is_read' => false,
                'created_at' => now()->subHours(6),
            ],
            [
                'title' => 'New Resident Added',
                'message' => 'Maria Santos has been added as a new resident in Purok 1',
                'type' => 'resident',
                'user_id' => null, // Will be assigned to relevant users
                'is_read' => false,
                'created_at' => now()->subHours(3),
            ],
            [
                'title' => 'System Maintenance Notice',
                'message' => 'Scheduled maintenance will be performed tonight from 10 PM to 2 AM. The system may be temporarily unavailable.',
                'type' => 'system',
                'user_id' => null, // System-wide
                'is_read' => true,
                'created_at' => now()->subDays(3),
            ],
        ];

        // Create system-wide notifications
        foreach ($notifications as $notificationData) {
            if ($notificationData['user_id'] === null) {
                // System-wide notification - create for all users
                $allUsers = User::all();
                foreach ($allUsers as $user) {
                    Notification::create([
                        'title' => $notificationData['title'],
                        'message' => $notificationData['message'],
                        'type' => $notificationData['type'],
                        'user_id' => $user->id,
                        'is_read' => $notificationData['is_read'],
                        'created_at' => $notificationData['created_at'],
                    ]);
                }
            }
        }

        // Create specific notifications for admin users
        foreach ($adminUsers as $admin) {
            Notification::create([
                'title' => 'Admin Dashboard Updated',
                'message' => 'New features have been added to the admin dashboard. Check out the latest updates.',
                'type' => 'system',
                'user_id' => $admin->id,
                'is_read' => false,
                'created_at' => now()->subHours(1),
            ]);
        }

        // Create specific notifications for purok leaders
        foreach ($purokLeaders as $leader) {
            Notification::create([
                'title' => 'Purok Leader Assignment',
                'message' => "You have been assigned to manage Purok {$leader->assigned_purok_id}. Please review your assigned area.",
                'type' => 'system',
                'user_id' => $leader->id,
                'is_read' => false,
                'created_at' => now()->subHours(2),
            ]);
        }

        $this->command->info('Sample notifications created successfully!');
    }
}
