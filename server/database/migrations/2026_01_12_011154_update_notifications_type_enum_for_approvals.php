<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update notifications type enum to include approval-related types
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('info', 'event', 'system', 'household', 'resident', 'certificate_request', 'certificate_approved', 'certificate_rejected', 'certificate_released', 'certificate_issued', 'certificate_invalidated', 'blotter', 'blotter_pending', 'blotter_approved', 'blotter_rejected', 'incident_pending', 'incident_approved', 'incident_rejected', 'approval_required') DEFAULT 'info'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('info', 'event', 'system', 'household', 'resident', 'certificate_request', 'certificate_approved', 'certificate_rejected', 'certificate_released', 'certificate_issued', 'certificate_invalidated', 'blotter') DEFAULT 'info'");
    }
};
