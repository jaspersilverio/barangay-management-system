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
        // Add composite indexes for residents table
        Schema::table('residents', function (Blueprint $table) {
            // Composite index for purok-based queries (through household)
            $table->index(['household_id', 'sex'], 'idx_residents_household_sex');
            $table->index(['household_id', 'occupation_status'], 'idx_residents_household_occupation');
            $table->index(['household_id', 'is_pwd'], 'idx_residents_household_pwd');
            $table->index(['birthdate', 'is_pwd'], 'idx_residents_birthdate_pwd');
            $table->index(['sex', 'occupation_status'], 'idx_residents_sex_occupation');
        });

        // Add composite indexes for households table
        Schema::table('households', function (Blueprint $table) {
            // Composite index for purok-based queries
            $table->index(['purok_id', 'property_type'], 'idx_households_purok_property');
            $table->index(['purok_id', 'created_at'], 'idx_households_purok_created');
        });

        // Add composite indexes for blotters table
        Schema::table('blotters', function (Blueprint $table) {
            // Composite indexes for blotter queries
            $table->index(['complainant_id', 'status'], 'idx_blotters_complainant_status');
            $table->index(['respondent_id', 'status'], 'idx_blotters_respondent_status');
            $table->index(['official_id', 'status'], 'idx_blotters_official_status');
            $table->index(['incident_date', 'status'], 'idx_blotters_incident_status');
            $table->index(['created_by', 'created_at'], 'idx_blotters_creator_created');
        });

        // Add composite indexes for vaccinations table
        Schema::table('vaccinations', function (Blueprint $table) {
            // Composite indexes for vaccination queries
            $table->index(['resident_id', 'vaccine_name'], 'idx_vaccinations_resident_vaccine');
            $table->index(['resident_id', 'status'], 'idx_vaccinations_resident_status');
            $table->index(['vaccine_name', 'status'], 'idx_vaccinations_vaccine_status');
            $table->index(['date_administered', 'status'], 'idx_vaccinations_date_status');
        });

        // Add composite indexes for issued_certificates table
        Schema::table('issued_certificates', function (Blueprint $table) {
            // Composite indexes for certificate queries
            $table->index(['resident_id', 'certificate_type', 'is_valid'], 'idx_certificates_resident_type_valid');
            $table->index(['certificate_type', 'is_valid'], 'idx_certificates_type_valid');
            $table->index(['issued_by', 'created_at'], 'idx_certificates_issuer_created');
            $table->index(['valid_from', 'valid_until'], 'idx_certificates_validity_range');
        });

        // Add composite indexes for users table (for role-based queries)
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'assigned_purok_id'], 'idx_users_role_purok');
            $table->index(['role', 'created_at'], 'idx_users_role_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop composite indexes for residents table
        Schema::table('residents', function (Blueprint $table) {
            $table->dropIndex('idx_residents_household_sex');
            $table->dropIndex('idx_residents_household_occupation');
            $table->dropIndex('idx_residents_household_pwd');
            $table->dropIndex('idx_residents_birthdate_pwd');
            $table->dropIndex('idx_residents_sex_occupation');
        });

        // Drop composite indexes for households table
        Schema::table('households', function (Blueprint $table) {
            $table->dropIndex('idx_households_purok_property');
            $table->dropIndex('idx_households_purok_created');
        });

        // Drop composite indexes for blotters table
        Schema::table('blotters', function (Blueprint $table) {
            $table->dropIndex('idx_blotters_complainant_status');
            $table->dropIndex('idx_blotters_respondent_status');
            $table->dropIndex('idx_blotters_official_status');
            $table->dropIndex('idx_blotters_incident_status');
            $table->dropIndex('idx_blotters_creator_created');
        });

        // Drop composite indexes for vaccinations table
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropIndex('idx_vaccinations_resident_vaccine');
            $table->dropIndex('idx_vaccinations_resident_status');
            $table->dropIndex('idx_vaccinations_vaccine_status');
            $table->dropIndex('idx_vaccinations_date_status');
        });

        // Drop composite indexes for issued_certificates table
        Schema::table('issued_certificates', function (Blueprint $table) {
            $table->dropIndex('idx_certificates_resident_type_valid');
            $table->dropIndex('idx_certificates_type_valid');
            $table->dropIndex('idx_certificates_issuer_created');
            $table->dropIndex('idx_certificates_validity_range');
        });

        // Drop composite indexes for users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_purok');
            $table->dropIndex('idx_users_role_created');
        });
    }
};
