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
        if (Schema::hasTable('issued_certificates')) {
            return;
        }

        Schema::create('issued_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('resident_id')->constrained()->onDelete('cascade');
            $table->foreignId('issued_by')->constrained('users')->onDelete('cascade');

            // Certificate details
            $table->enum('certificate_type', [
                'barangay_clearance',
                'indigency',
                'residency',
                'business_permit_endorsement'
            ]);
            $table->string('certificate_number')->unique();
            $table->text('purpose');

            // Document details
            $table->string('pdf_path')->nullable();
            $table->string('qr_code')->nullable();

            // Validity
            $table->date('valid_from');
            $table->date('valid_until');
            $table->boolean('is_valid')->default(true);

            // Digital signature
            $table->string('signed_by')->nullable();
            $table->string('signature_position')->nullable();
            $table->timestamp('signed_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['resident_id', 'certificate_type']);
            $table->index(['certificate_number']);
            $table->index(['valid_from', 'valid_until']);
            $table->index('is_valid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issued_certificates');
    }
};
