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
        Schema::table('tran_appropriations', function (Blueprint $table) {
            $table->foreignId('cont_appropriation_id')->nullable()->after('budget_id')->constrained('cont_appropriations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tran_appropriations', function (Blueprint $table) {
            $table->dropForeign(['cont_appropriation_id']);
            $table->dropColumn('cont_appropriation_id');
        });
    }
};
