<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Added missing import for DB facade

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('puroks', function (Blueprint $table) {
            // Add new fields
            $table->string('captain')->nullable()->after('description');
            $table->string('contact')->nullable()->after('captain');
        });

        // Make code field nullable in a separate operation
        DB::statement('ALTER TABLE puroks MODIFY code VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('puroks', function (Blueprint $table) {
            $table->dropColumn(['captain', 'contact']);
        });

        // Make code field required again
        DB::statement('ALTER TABLE puroks MODIFY code VARCHAR(255) NOT NULL');
    }
};
