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
        if (Schema::hasTable('incident_reports')) {
            return;
        }

        Schema::create('incident_reports', function (Blueprint $table) {
            $table->id();
            $table->string('incident_title', 255);
            $table->text('description');
            $table->date('incident_date');
            $table->time('incident_time');
            $table->string('location', 255);
            $table->text('persons_involved')->nullable(); // JSON or text field for persons involved
            $table->foreignId('reporting_officer_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['Recorded', 'Monitoring', 'Resolved'])->default('Recorded');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_reports');
    }
};
