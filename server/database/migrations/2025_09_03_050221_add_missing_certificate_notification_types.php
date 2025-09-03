<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop the existing enum column
            $table->dropColumn('type');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // Recreate the enum column with all certificate types used in the code
            $table->enum('type', [
                'info',
                'event',
                'system',
                'household',
                'resident',
                'certificate_request',
                'certificate_approved',
                'certificate_rejected',
                'certificate_released',
                'certificate_issued',
                'certificate_invalidated'
            ])->default('info')->after('message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop the expanded enum column
            $table->dropColumn('type');
        });

        Schema::table('notifications', function (Blueprint $table) {
            // Restore the previous enum column
            $table->enum('type', [
                'info',
                'event',
                'system',
                'household',
                'resident',
                'certificate_issued',
                'certificate_released',
                'certificate_expired',
                'certificate_requested'
            ])->default('info')->after('message');
        });
    }
};
