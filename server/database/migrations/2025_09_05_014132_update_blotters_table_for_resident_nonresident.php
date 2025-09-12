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
        Schema::table('blotters', function (Blueprint $table) {
            // Add new fields for resident/non-resident handling
            $table->boolean('complainant_is_resident')->default(true)->after('complainant_id');
            $table->string('complainant_full_name')->nullable()->after('complainant_is_resident');
            $table->integer('complainant_age')->nullable()->after('complainant_full_name');
            $table->text('complainant_address')->nullable()->after('complainant_age');
            $table->string('complainant_contact')->nullable()->after('complainant_address');

            $table->boolean('respondent_is_resident')->default(true)->after('respondent_id');
            $table->string('respondent_full_name')->nullable()->after('respondent_is_resident');
            $table->integer('respondent_age')->nullable()->after('respondent_full_name');
            $table->text('respondent_address')->nullable()->after('respondent_age');
            $table->string('respondent_contact')->nullable()->after('respondent_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blotters', function (Blueprint $table) {
            // Remove the added fields
            $table->dropColumn([
                'complainant_is_resident',
                'complainant_full_name',
                'complainant_age',
                'complainant_address',
                'complainant_contact',
                'respondent_is_resident',
                'respondent_full_name',
                'respondent_age',
                'respondent_address',
                'respondent_contact'
            ]);
        });
    }
};
