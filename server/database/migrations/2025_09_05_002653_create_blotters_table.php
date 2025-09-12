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
        Schema::create('blotters', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->foreignId('complainant_id')->nullable()->constrained('residents')->onDelete('cascade');
            $table->foreignId('respondent_id')->nullable()->constrained('residents')->onDelete('cascade');
            $table->foreignId('official_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('incident_date');
            $table->time('incident_time');
            $table->string('incident_location', 255);
            $table->text('description');
            $table->enum('status', ['Open', 'Ongoing', 'Resolved'])->default('Open');
            $table->text('resolution')->nullable();
            $table->json('attachments')->nullable();
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
        Schema::dropIfExists('blotters');
    }
};
