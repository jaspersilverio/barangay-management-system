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
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->date('completed_at')->nullable()->after('status');
        });

        // Backfill: records with status 'Completed' get completed_at = date_administered
        DB::table('vaccinations')
            ->where('status', 'Completed')
            ->update(['completed_at' => DB::raw('date_administered')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropColumn('completed_at');
        });
    }
};
