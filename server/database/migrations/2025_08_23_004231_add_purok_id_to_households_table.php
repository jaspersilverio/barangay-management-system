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
        Schema::table('households', function (Blueprint $table) {
            $table->unsignedBigInteger('purok_id')->nullable()->after('contact');
            $table->foreign('purok_id')->references('id')->on('puroks')->onDelete('set null');
            $table->index('purok_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropForeign(['purok_id']);
            $table->dropIndex(['purok_id']);
            $table->dropColumn('purok_id');
        });
    }
};
