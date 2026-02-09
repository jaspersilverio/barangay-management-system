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
        if (Schema::hasTable('residents')) {
            return;
        }

        Schema::create('residents', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->bigIncrements('id');
            $table->unsignedBigInteger('household_id');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('sex', ['male', 'female', 'other']);
            $table->date('birthdate');
            $table->enum('civil_status', ['single', 'married', 'widowed', 'divorced', 'separated'])->default('single');
            $table->string('relationship_to_head');
            $table->enum('occupation_status', ['employed', 'unemployed', 'student', 'retired', 'other']);
            $table->boolean('is_pwd')->default(false);
            $table->boolean('is_pregnant')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('household_id');
            $table->index('last_name');
            $table->index('sex');
            $table->index('occupation_status');
            $table->index('is_pwd');

            $table->foreign('household_id')
                ->references('id')
                ->on('households')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};
