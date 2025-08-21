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
        // Make the code field nullable
        DB::statement('ALTER TABLE puroks MODIFY code VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make code field required again
        DB::statement('ALTER TABLE puroks MODIFY code VARCHAR(255) NOT NULL');
    }
};
