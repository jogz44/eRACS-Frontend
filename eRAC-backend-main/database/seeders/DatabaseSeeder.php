<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BarangayUserSeeder::class,
            LibFiscalYearSeeder::class,
            LibExpenseClassAndTypeSeeder::class,
            LibExpenseItemSeeder::class,
            BudgetSeeder::class,
            TranAppropriationSeeder::class,
            DisbursementSeeder::class,
        ]);

        // Recalculate current_amount for all budgets
        \App\Models\Budget::all()->each(function($budget) {
            $itemAllocated = $budget->tranAppropriations()->whereNotNull('expense_item_id')->sum('amount');
            $budget->current_amount = $budget->original_amount - $itemAllocated;
            $budget->save();
        });
    }
}
