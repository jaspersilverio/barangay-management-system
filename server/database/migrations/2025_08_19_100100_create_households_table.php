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
        Schema::create('households', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('id');
            $table->string('address');
            $table->string('property_type');
            $table->string('head_name');
            $table->string('contact');
            $table->unsignedBigInteger('purok_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('head_name');
            $table->index('address');
            $table->index('purok_id');

            $table->foreign('purok_id')
                ->references('id')
                ->on('puroks')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('households');
    }
};
