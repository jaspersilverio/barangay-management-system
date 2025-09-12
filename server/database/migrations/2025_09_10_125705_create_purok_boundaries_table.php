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
        Schema::create('purok_boundaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purok_id')->nullable()->constrained('puroks')->onDelete('set null');
            $table->json('points'); // Array of {x, y} coordinates as percentages
            $table->decimal('centroid_x', 8, 4)->nullable(); // Centroid X as percentage
            $table->decimal('centroid_y', 8, 4)->nullable(); // Centroid Y as percentage
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['purok_id']);
            $table->index(['created_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purok_boundaries');
    }
};
