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
        Schema::table('residents', function (Blueprint $table) {
            // Make relationship_to_head nullable (for unassigned residents)
            $table->string('relationship_to_head')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            // Revert relationship_to_head to not nullable
            // Note: This might fail if there are unassigned residents with null relationship_to_head
            $table->string('relationship_to_head')->nullable(false)->change();
        });
    }
};
