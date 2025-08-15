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
            TranExpenseDetailSeeder::class,
            BudgetAugmentationSeeder::class,
            BookletAndChequeSeeder::class
        ]);
    }
}
