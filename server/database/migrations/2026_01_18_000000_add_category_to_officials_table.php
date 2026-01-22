<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only add category column if it doesn't already exist (for existing databases that ran create migration before it included category)
        if (!Schema::hasColumn('officials', 'category')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('category', 50)->default('official')->after('name');
                $table->index('category');
            });

            // Update existing records to have category = 'official'
            DB::table('officials')->update(['category' => 'official']);
        }

        // Add enhanced personal information fields if they don't exist (for existing databases)
        if (!Schema::hasColumn('officials', 'first_name')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('first_name')->nullable()->after('category');
            });
        }
        if (!Schema::hasColumn('officials', 'middle_name')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('middle_name')->nullable()->after('first_name');
            });
        }
        if (!Schema::hasColumn('officials', 'last_name')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('last_name')->nullable()->after('middle_name');
            });
        }
        if (!Schema::hasColumn('officials', 'suffix')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('suffix')->nullable()->after('last_name');
            });
        }
        if (!Schema::hasColumn('officials', 'sex')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('sex', 10)->nullable()->after('suffix');
            });
        }
        if (!Schema::hasColumn('officials', 'birthdate')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->date('birthdate')->nullable()->after('sex');
            });
        }
        if (!Schema::hasColumn('officials', 'email')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('email')->nullable()->after('contact');
            });
        }
        if (!Schema::hasColumn('officials', 'address')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->string('address')->nullable()->after('email');
            });
        }
        if (!Schema::hasColumn('officials', 'purok_id')) {
            Schema::table('officials', function (Blueprint $table) {
                $table->foreignId('purok_id')->nullable()->after('address')->constrained('puroks')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('officials', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }
};
