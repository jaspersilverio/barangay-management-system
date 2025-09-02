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
        Schema::create('certificate_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained()->onDelete('cascade');
            $table->foreignId('requested_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('released_by')->nullable()->constrained('users')->onDelete('set null');

            // Certificate details
            $table->enum('certificate_type', [
                'barangay_clearance',
                'indigency',
                'residency',
                'business_permit_endorsement'
            ]);
            $table->text('purpose');
            $table->text('additional_requirements')->nullable();

            // Status tracking
            $table->enum('status', ['pending', 'approved', 'released', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();

            // Timestamps
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['resident_id', 'status']);
            $table->index(['certificate_type', 'status']);
            $table->index('requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_requests');
    }
};
