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
        Schema::create('solo_parents', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('id');
            $table->unsignedBigInteger('resident_id')->unique();
            $table->enum('eligibility_reason', [
                'death_of_spouse',
                'abandonment',
                'legally_separated',
                'unmarried_parent',
                'spouse_incapacitated'
            ]);
            $table->date('date_declared');
            $table->date('valid_until');
            $table->date('verification_date')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('resident_id');
            $table->index('date_declared');
            $table->index('valid_until');
            $table->index('verification_date');

            $table->foreign('resident_id')
                ->references('id')
                ->on('residents')
                ->onDelete('cascade');

            $table->foreign('verified_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solo_parents');
    }
};
