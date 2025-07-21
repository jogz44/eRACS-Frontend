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
        $barangay = Barangay::first();
        $fiscalYear = LibFiscalYear::first();
        $user = BarangayUser::first();
        Budget::create([
            'barangay_id' => $barangay->id,
            'fiscal_year_id' => $fiscalYear->id,
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'description' => 'Annual Budget',
            'original_amount' => 1000000,
            'current_amount' => 1000000,
            'augmentation' => 0,
            'return_amount' => 0,
            'user_id' => $user->id,
        ]);
    }
} 