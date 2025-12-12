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
        // Add foreign key constraint (column already exists in create_map_markers_table)
        Schema::table('map_markers', function (Blueprint $table) {
            $table->foreign('household_id')
                ->references('id')
                ->on('households')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('map_markers', function (Blueprint $table) {
            $table->dropForeign(['household_id']);
        });
    }
};
