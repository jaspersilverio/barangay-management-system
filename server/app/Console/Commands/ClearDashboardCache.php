<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearDashboardCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:dashboard {--user= : Clear cache for specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear dashboard cache for all users or a specific user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user');

        if ($userId) {
            // Clear cache for specific user
            $this->clearUserCache($userId);
            $this->info("Dashboard cache cleared for user ID: {$userId}");
        } else {
            // Clear all dashboard cache
            $this->clearAllDashboardCache();
            $this->info('All dashboard cache cleared');
        }
    }

    private function clearUserCache($userId)
    {
        $cacheKeys = [
            "dashboard_summary_{$userId}_admin",
            "dashboard_analytics_{$userId}_admin",
            "dashboard_vaccination_summary_{$userId}_admin",
            "dashboard_blotter_summary_{$userId}_admin",
        ];

        // Also clear for purok leaders (we don't know their purok_id, so we'll use a pattern)
        $pattern = "dashboard_*_{$userId}_*";

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }

        // Clear cache with pattern (if supported by cache driver)
        if (method_exists(Cache::getStore(), 'flush')) {
            // This is a simplified approach - in production you might want to use Redis SCAN
            $this->warn('Note: Pattern-based cache clearing may not work with all cache drivers');
        }
    }

    private function clearAllDashboardCache()
    {
        $cacheKeys = [
            'dashboard_monthly_registrations',
            'dashboard_vulnerable_trends',
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }

        // Clear all cache (be careful in production!)
        if ($this->confirm('This will clear ALL cache. Are you sure?')) {
            Cache::flush();
            $this->info('All cache cleared');
        }
    }
}
