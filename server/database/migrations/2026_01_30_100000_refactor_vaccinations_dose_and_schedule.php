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
            $table->dropUnique('unique_vaccination_per_resident_per_date');
        });

        Schema::table('vaccinations', function (Blueprint $table) {
            $table->enum('vaccination_type', ['fixed_dose', 'booster', 'annual', 'as_needed'])->nullable()->after('resident_id');
            $table->unsignedTinyInteger('required_doses')->nullable()->after('vaccination_type');
            $table->unsignedInteger('completed_doses')->default(0)->after('required_doses');
            $table->date('schedule_date')->nullable()->after('completed_doses');
        });

        // Make old columns nullable (raw to avoid doctrine/dbal)
        DB::statement('ALTER TABLE vaccinations MODIFY vaccine_name VARCHAR(255) NULL');
        DB::statement('ALTER TABLE vaccinations MODIFY dose_number VARCHAR(50) NULL');
        DB::statement('ALTER TABLE vaccinations MODIFY date_administered DATE NULL');

        // Backfill: incomplete rows (no completed_at)
        DB::table('vaccinations')
            ->whereNull('completed_at')
            ->update([
                'vaccination_type' => 'fixed_dose',
                'required_doses' => 1,
                'completed_doses' => 0,
                'schedule_date' => DB::raw('date_administered'),
            ]);

        // Backfill: completed rows
        DB::table('vaccinations')
            ->whereNotNull('completed_at')
            ->update([
                'vaccination_type' => 'fixed_dose',
                'required_doses' => 1,
                'completed_doses' => 1,
                'schedule_date' => null,
            ]);

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropColumn(['vaccination_type', 'required_doses', 'completed_doses', 'schedule_date']);
        });

        DB::statement('ALTER TABLE vaccinations MODIFY vaccine_name VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE vaccinations MODIFY dose_number VARCHAR(50) NOT NULL');
        DB::statement('ALTER TABLE vaccinations MODIFY date_administered DATE NOT NULL');

        Schema::table('vaccinations', function (Blueprint $table) {
            $table->unique(['resident_id', 'vaccine_name', 'date_administered'], 'unique_vaccination_per_resident_per_date');
        });
    }
};
