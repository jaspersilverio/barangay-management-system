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
            // Drop the foreign key constraint first (required before modifying the column)
            $table->dropForeign(['household_id']);
            
            // Make household_id nullable (for unassigned residents)
            $table->unsignedBigInteger('household_id')->nullable()->change();
            
            // Make relationship_to_head nullable (for unassigned residents)
            $table->string('relationship_to_head')->nullable()->change();
            
            // Recreate the foreign key constraint with nullable support
            $table->foreign('household_id')
                ->references('id')
                ->on('households')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // A. Personal Information - Additional fields
            $table->string('suffix', 10)->nullable()->after('last_name');
            $table->string('place_of_birth', 255)->nullable()->after('birthdate');
            $table->string('nationality', 100)->nullable()->default('Filipino')->after('place_of_birth');
            $table->string('religion', 100)->nullable()->after('nationality');
            
            // B. Contact & Identity
            $table->string('contact_number', 20)->nullable()->after('religion');
            $table->string('email', 255)->nullable()->after('contact_number');
            $table->string('valid_id_type', 50)->nullable()->after('email');
            $table->string('valid_id_number', 100)->nullable()->after('valid_id_type');
            
            // D. Relationship & Socio-Economic Info - Additional fields
            $table->string('employer_workplace', 255)->nullable()->after('occupation_status');
            $table->string('educational_attainment', 100)->nullable()->after('employer_workplace');
            
            // F. Resident Status & Notes
            $table->enum('resident_status', ['active', 'deceased', 'transferred', 'inactive'])->default('active')->after('is_pregnant');
            $table->text('remarks')->nullable()->after('resident_status');
            
            // Photo/Image
            $table->string('photo_path', 500)->nullable()->after('remarks');
            
            // Add indexes for commonly queried fields
            $table->index('resident_status');
            $table->index('nationality');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex(['resident_status']);
            $table->dropIndex(['nationality']);
            $table->dropIndex(['email']);
            
            // Drop columns
            $table->dropColumn([
                'suffix',
                'place_of_birth',
                'nationality',
                'religion',
                'contact_number',
                'email',
                'valid_id_type',
                'valid_id_number',
                'employer_workplace',
                'educational_attainment',
                'resident_status',
                'remarks',
                'photo_path'
            ]);
            
            // Drop foreign key before reverting
            $table->dropForeign(['household_id']);
            
            // Revert household_id to not nullable (if needed)
            // Note: This might fail if there are unassigned residents
            // $table->unsignedBigInteger('household_id')->nullable(false)->change();
            // $table->string('relationship_to_head')->nullable(false)->change();
            
            // Recreate original foreign key
            // $table->foreign('household_id')
            //     ->references('id')
            //     ->on('households')
            //     ->cascadeOnDelete()
            //     ->cascadeOnUpdate();
        });
    }
};
