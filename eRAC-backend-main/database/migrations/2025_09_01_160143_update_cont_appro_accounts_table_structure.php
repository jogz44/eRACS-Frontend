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
        Schema::table('cont_appro_accounts', function (Blueprint $table) {
            // Add missing columns
            $table->enum('status', ['active', 'inactive'])->default('active')->after('continuingYear');
            $table->foreignId('user_id')->after('status')->constrained('barangay_users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cont_appro_accounts', function (Blueprint $table) {
            // Remove added columns
            $table->dropForeign(['user_id']);
            $table->dropColumn(['status', 'user_id']);
        });
    }
};
