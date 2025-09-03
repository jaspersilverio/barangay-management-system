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
            // Recreate the enum column with additional certificate types
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
            // Restore the original enum column
            $table->enum('type', ['info', 'event', 'system', 'household', 'resident'])->default('info')->after('message');
        });
    }
};
