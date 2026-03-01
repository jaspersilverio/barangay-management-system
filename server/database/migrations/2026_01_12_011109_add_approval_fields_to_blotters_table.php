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
        Schema::table('blotters', function (Blueprint $table) {
            if (!Schema::hasColumn('blotters', 'assigned_official_name')) {
                $table->string('assigned_official_name')->nullable()->after('official_id');
            }

            // Add approval fields
            if (!Schema::hasColumn('blotters', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('updated_by')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('blotters', 'rejected_by')) {
                $table->foreignId('rejected_by')->nullable()->after('approved_by')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('blotters', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('rejected_by');
            }
            if (!Schema::hasColumn('blotters', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('blotters', 'rejection_remarks')) {
                $table->text('rejection_remarks')->nullable()->after('rejected_at');
            }
            if (!Schema::hasColumn('blotters', 'resolved_by')) {
                $table->foreignId('resolved_by')->nullable()->after('rejection_remarks')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('blotters', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('resolved_by');
            }
        });

        // Enforce blotter workflow statuses
        DB::statement("ALTER TABLE blotters MODIFY COLUMN status ENUM('ongoing', 'resolved') DEFAULT 'ongoing'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blotters', function (Blueprint $table) {
            if (Schema::hasColumn('blotters', 'assigned_official_name')) {
                $table->dropColumn('assigned_official_name');
            }
            if (Schema::hasColumn('blotters', 'approved_by')) {
                $table->dropForeign(['approved_by']);
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('blotters', 'rejected_by')) {
                $table->dropForeign(['rejected_by']);
                $table->dropColumn('rejected_by');
            }
            if (Schema::hasColumn('blotters', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('blotters', 'rejected_at')) {
                $table->dropColumn('rejected_at');
            }
            if (Schema::hasColumn('blotters', 'rejection_remarks')) {
                $table->dropColumn('rejection_remarks');
            }
            if (Schema::hasColumn('blotters', 'resolved_by')) {
                $table->dropForeign(['resolved_by']);
                $table->dropColumn('resolved_by');
            }
            if (Schema::hasColumn('blotters', 'resolved_at')) {
                $table->dropColumn('resolved_at');
            }
        });

        // Revert status enum
        DB::statement("ALTER TABLE blotters MODIFY COLUMN status ENUM('ongoing', 'resolved') DEFAULT 'ongoing'");
    }
};
