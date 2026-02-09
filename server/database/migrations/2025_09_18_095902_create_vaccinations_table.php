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
        if (Schema::hasTable('vaccinations')) {
            return;
        }

        Schema::create('vaccinations', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->foreignId('resident_id')->constrained('residents')->onDelete('cascade');
            $table->string('vaccine_name');
            $table->string('dose_number');
            $table->date('date_administered');
            $table->date('next_due_date')->nullable();
            $table->enum('status', ['Completed', 'Pending', 'Scheduled'])->default('Completed');
            $table->string('administered_by')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index('resident_id');
            $table->index('vaccine_name');
            $table->index('date_administered');
            $table->index('status');

            // Prevent duplicate vaccine entry for same resident on same date + same vaccine
            $table->unique(['resident_id', 'vaccine_name', 'date_administered'], 'unique_vaccination_per_resident_per_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vaccinations');
    }
};
