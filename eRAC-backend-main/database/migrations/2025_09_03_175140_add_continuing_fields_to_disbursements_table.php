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
        Schema::table('disbursements', function (Blueprint $table) {
            $table->boolean('is_continuing')->default(false)->after('status');
            $table->unsignedBigInteger('user_id')->nullable()->after('is_continuing');
            $table->foreign('user_id')->references('id')->on('barangay_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['is_continuing', 'user_id']);
        });
    }
};
