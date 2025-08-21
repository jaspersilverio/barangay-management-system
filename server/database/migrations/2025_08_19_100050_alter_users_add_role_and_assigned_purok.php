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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'purok_leader', 'staff', 'viewer'])->default('viewer')->after('password');
            $table->unsignedBigInteger('assigned_purok_id')->nullable()->after('role');

            $table->index('role');
            $table->index('assigned_purok_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('assigned_purok_id')
                ->references('id')
                ->on('puroks')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['assigned_purok_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['assigned_purok_id']);
            $table->dropColumn(['role', 'assigned_purok_id']);
        });
    }
};
