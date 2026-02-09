<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('barangay_infos', 'captain_signature_path')) {
            Schema::table('barangay_infos', function (Blueprint $table) {
                $table->string('captain_signature_path')->nullable()->after('logo_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('barangay_infos', 'captain_signature_path')) {
            Schema::table('barangay_infos', function (Blueprint $table) {
                $table->dropColumn('captain_signature_path');
            });
        }
    }
};
