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
        // For SQL Server, we need to drop and recreate the CHECK constraint
        if (DB::getDriverName() === 'sqlsrv') {
            // Drop the existing CHECK constraint
            DB::statement("ALTER TABLE disbursements DROP CONSTRAINT CK__disbursem__statu__24B338F0");
            
            // Add the new CHECK constraint with updated values
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK_disbursements_status CHECK (status IN ('Pending', 'Liquidated', 'Partial', 'Void Requested', 'Voided'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            // Drop the new constraint
            DB::statement("ALTER TABLE disbursements DROP CONSTRAINT CK_disbursements_status");
            
            // Restore the original constraint
            DB::statement("ALTER TABLE disbursements ADD CONSTRAINT CK__disbursem__statu__24B338F0 CHECK (status IN ('Pending', 'Liquidated', 'Partial'))");
        }
    }
};
