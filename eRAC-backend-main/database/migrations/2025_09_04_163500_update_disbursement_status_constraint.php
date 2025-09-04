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
        // Drop all existing check constraints on status column
        try {
            DB::statement('ALTER TABLE disbursements DROP CONSTRAINT CK__disbursem__statu__057A84B9');
        } catch (\Exception $e) {
            // Constraint might not exist or have different name
        }
        
        try {
            DB::statement('ALTER TABLE disbursements DROP CONSTRAINT CK_disbursements_status');
        } catch (\Exception $e) {
            // Constraint might not exist
        }
        
        // Update all 'Pending' statuses to 'Unliquidated' using raw SQL
        DB::statement("UPDATE disbursements SET status = 'Unliquidated' WHERE status = 'Pending'");
        
        // Add new check constraint that includes 'Unliquidated'
        DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK_disbursement_status 
            CHECK (status IN ('Unliquidated', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new constraint
        DB::statement('ALTER TABLE disbursements DROP CONSTRAINT CK_disbursement_status');
        
        // Restore the original constraint (assuming it was for 'Pending', 'Partial', 'Liquidated', etc.)
        DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK__disbursem__statu__057A84B9 
            CHECK (status IN ('Pending', 'Partial', 'Liquidated', 'Void Requested', 'Voided', 'Stale'))");
    }
};
