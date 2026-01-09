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
            // Add head_resident_id to link household head to a resident record
            $table->unsignedBigInteger('head_resident_id')->nullable()->after('head_name');
            
            // Add foreign key constraint
            $table->foreign('head_resident_id')
                ->references('id')
                ->on('residents')
                ->onDelete('set null')
                ->cascadeOnUpdate();
            
            // Add index for performance
            $table->index('head_resident_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->dropForeign(['head_resident_id']);
            $table->dropIndex(['head_resident_id']);
            $table->dropColumn('head_resident_id');
        });
    }
};
