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
        // Modify enum to include 'captain' role
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'purok_leader', 'staff', 'viewer', 'captain') DEFAULT 'viewer'");

        // Add signature_path column for storing captain signature
        Schema::table('users', function (Blueprint $table) {
            $table->string('signature_path', 500)->nullable()->after('assigned_purok_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('signature_path');
        });

        // Revert enum to original values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'purok_leader', 'staff', 'viewer') DEFAULT 'viewer'");
    }
};
