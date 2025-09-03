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
        Schema::table('lib_cheque', function (Blueprint $table) {
            $table->unsignedBigInteger('disbursement_id')->nullable()->after('status');
            $table->foreign('disbursement_id')->references('id')->on('disbursements')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lib_cheque', function (Blueprint $table) {
            $table->dropForeign(['disbursement_id']);
            $table->dropColumn('disbursement_id');
        });
    }
};
