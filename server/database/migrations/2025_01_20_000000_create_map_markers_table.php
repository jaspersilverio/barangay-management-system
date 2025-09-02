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
        Schema::create('map_markers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // household, building, infra, school, etc.
            $table->text('description')->nullable();
            $table->float('x_position');
            $table->float('y_position');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Index for better performance
            $table->index(['type', 'created_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('map_markers');
    }
};
