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
        Schema::create('four_ps_beneficiaries', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('id');
            $table->unsignedBigInteger('household_id')->unique();
            $table->string('four_ps_number')->unique();
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('active');
            $table->date('date_registered');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('household_id');
            $table->index('four_ps_number');
            $table->index('status');
            $table->index('date_registered');

            $table->foreign('household_id')
                ->references('id')
                ->on('households')
                ->onDelete('cascade');

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
        Schema::dropIfExists('four_ps_beneficiaries');
    }
};

