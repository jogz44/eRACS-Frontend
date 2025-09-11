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
        // For SQL Server, drop and recreate the constraint to include 'Edit Requested'
        if (DB::getDriverName() === 'sqlsrv') {
            // Drop the existing constraint
            DB::statement("ALTER TABLE disbursements DROP CONSTRAINT CK__disbursem__statu__1CD2EB5D");
            
            // Add the new constraint with 'Edit Requested' status
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK__disbursem__statu__1CD2EB5D CHECK (status IN ('Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale', 'Edit Requested'))");
        } else {
            // For MySQL/PostgreSQL, modify the enum
            DB::statement("ALTER TABLE disbursements MODIFY COLUMN status ENUM('Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale', 'Edit Requested') DEFAULT 'Unliquidated'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original constraint
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement("ALTER TABLE disbursements DROP CONSTRAINT CK__disbursem__statu__1CD2EB5D");
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK__disbursem__statu__1CD2EB5D CHECK (status IN ('Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale'))");
        } else {
            DB::statement("ALTER TABLE disbursements MODIFY COLUMN status ENUM('Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale') DEFAULT 'Unliquidated'");
        }
    }
};
