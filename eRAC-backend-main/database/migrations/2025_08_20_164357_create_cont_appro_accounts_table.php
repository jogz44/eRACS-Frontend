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
        Schema::create('cont_appro_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contAppropriation_id');
            $table->unsignedBigInteger('tranAppropriation_id');
            $table->decimal('remainingBalance', 15, 2);
            $table->string('continuingYear', 4);
            $table->timestamps();

            $table->foreign('contAppropriation_id')->references('id')->on('cont_appropriations')->onDelete('cascade');
            $table->foreign('tranAppropriation_id')->references('id')->on('tran_appropriations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cont_appro_accounts');
    }
};
