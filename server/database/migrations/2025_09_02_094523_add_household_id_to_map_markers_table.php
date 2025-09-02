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
        Schema::table('map_markers', function (Blueprint $table) {
            $table->foreignId('household_id')->nullable()->after('created_by')->constrained('households')->onDelete('set null');
            $table->index('household_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('map_markers', function (Blueprint $table) {
            $table->dropForeign(['household_id']);
            $table->dropIndex(['household_id']);
            $table->dropColumn('household_id');
        });
    }
};
