<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Budget;
use App\Models\Barangay;
use App\Models\LibFiscalYear;
use App\Models\BarangayUser;
use Faker\Factory as Faker;

class BudgetSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        $barangays = Barangay::all();

        foreach ($barangays as $barangay) {
            // Get all fiscal years for this barangay
            $fiscalYears = LibFiscalYear::where('barangay_id', $barangay->id)->get();

            // Find a user for this barangay
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            if (!$user) continue;

            foreach ($fiscalYears as $fiscalYear) {
                $year = (int) $fiscalYear->year;

                // Annual Budget
                Budget::updateOrCreate([
                    'barangay_id'    => $barangay->id,
                    'fiscal_year_id' => $fiscalYear->id,
                    'description'    => 'Annual Budget',
                ], [
                    'start_date'      => now()->copy()->setYear($year)->startOfYear(),
                    'end_date'        => now()->copy()->setYear($year)->endOfYear(),
                    'original_amount' => 2000000,
                    'current_amount'  => 0,
                    'augmentation'    => 0,
                    'return_amount'   => 0,
                    'user_id'         => $user->id,
                ]);

                // Supplemental Budget
                Budget::updateOrCreate([
                    'barangay_id'    => $barangay->id,
                    'fiscal_year_id' => $fiscalYear->id,
                    'description'    => 'Supplemental Budget',
                ], [
                    'start_date'      => now()->copy()->setYear($year)->addMonths(6)->startOfMonth(),
                    'end_date'        => now()->copy()->setYear($year)->addMonths(11)->endOfMonth(),
                    'original_amount' => $faker->numberBetween(200000, 1000000),
                    'current_amount'  => $faker->numberBetween(200000, 1000000),
                    'augmentation'    => $faker->numberBetween(0, 100000),
                    'return_amount'   => $faker->numberBetween(0, 50000),
                    'user_id'         => $user->id,
                ]);
            }

        }
    }
}
