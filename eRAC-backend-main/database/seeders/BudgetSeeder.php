<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Budget;
use App\Models\Barangay;
use App\Models\LibFiscalYear;
use App\Models\BarangayUser;

class BudgetSeeder extends Seeder
{
    public function run()
    {
        $fiscalYear = LibFiscalYear::first();
        $barangays = Barangay::all();
        foreach ($barangays as $barangay) {
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            if (!$user) continue;
            // Annual Budget
            Budget::firstOrCreate([
                'barangay_id' => $barangay->id,
                'fiscal_year_id' => $fiscalYear->id,
                'description' => 'Annual Budget',
            ], [
                'start_date' => now()->startOfYear(),
                'end_date' => now()->endOfYear(),
                'original_amount' => 1000000,
                'current_amount' => 1000000,
                'augmentation' => 0,
                'return_amount' => 0,
                'user_id' => $user->id,
            ]);
            // Supplemental Budget
            Budget::firstOrCreate([
                'barangay_id' => $barangay->id,
                'fiscal_year_id' => $fiscalYear->id,
                'description' => 'Supplemental Budget',
            ], [
                'start_date' => now()->addMonths(6)->startOfMonth(),
                'end_date' => now()->addMonths(11)->endOfMonth(),
                'original_amount' => 500000,
                'current_amount' => 500000,
                'augmentation' => 0,
                'return_amount' => 0,
                'user_id' => $user->id,
            ]);
        }
    }
} 