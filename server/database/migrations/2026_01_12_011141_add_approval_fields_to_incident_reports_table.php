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
        Schema::table('incident_reports', function (Blueprint $table) {
            // Add approval fields
            $table->foreignId('approved_by')->nullable()->after('updated_by')->constrained('users')->onDelete('set null');
            $table->foreignId('rejected_by')->nullable()->after('approved_by')->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable()->after('rejected_by');
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
            $table->text('rejection_remarks')->nullable()->after('rejected_at');
        });

        // Update status enum to include pending, approved, rejected
        DB::statement("ALTER TABLE incident_reports MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'Recorded', 'Monitoring', 'Resolved') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_reports', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropColumn([
                'approved_by',
                'rejected_by',
                'approved_at',
                'rejected_at',
                'rejection_remarks'
            ]);
        });

        // Revert status enum
        DB::statement("ALTER TABLE incident_reports MODIFY COLUMN status ENUM('Recorded', 'Monitoring', 'Resolved') DEFAULT 'Recorded'");
    }
};
