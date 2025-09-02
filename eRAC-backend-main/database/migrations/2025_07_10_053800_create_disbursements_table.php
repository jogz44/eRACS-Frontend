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
        Schema::create('disbursements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('barangay_id');
            $table->date('date');
            $table->string('dv_number')->unique();
            $table->string('cheque_number');
            $table->unsignedBigInteger('bank_id');
            $table->string('payee');
            $table->decimal('dv_amount', 15, 2);
            $table->decimal('liquidated_amount', 15, 2)->nullable();
            // For MySQL/Postgres enum works fine
            $table->enum('status', ['Pending', 'Liquidated', 'Partial', 'Void Requested', 'Voided'])->default('Pending');
            $table->timestamp('liquidated_at')->nullable();
            $table->text('remarks')->nullable();
            $table->text('rejection_remarks')->nullable();
            $table->timestamps();

            $table->foreign('barangay_id')->references('id')->on('barangays')->onDelete('cascade');
            $table->foreign('bank_id')->references('id')->on('lib_banks')->onDelete('NO ACTION');
        });

        // Handle SQL Server CHECK constraint separately
        if (DB::getDriverName() === 'sqlsrv') {
            // SQL Server does not support ENUM, so we enforce it via CHECK constraint
            DB::statement("
                ALTER TABLE disbursements 
                ADD CONSTRAINT CK_disbursements_status 
                CHECK (status IN ('Pending', 'Liquidated', 'Partial', 'Void Requested', 'Voided'))
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            // Drop SQL Server constraint first
            DB::statement("ALTER TABLE disbursements DROP CONSTRAINT CK_disbursements_status");
        }

        Schema::dropIfExists('disbursements');
    }
};
