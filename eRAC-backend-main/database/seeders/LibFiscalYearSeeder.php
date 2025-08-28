<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibFiscalYear;
use App\Models\Barangay;

class LibFiscalYearSeeder extends Seeder
{
    public function run()
    {
        $years = [2023, 2024, 2025];
        $activeYear = 2025; // set 2025 as active

        foreach (Barangay::all() as $barangay) {
            foreach ($years as $year) {
                LibFiscalYear::updateOrCreate(
                    [
                        'barangay_id' => $barangay->id,
                        'year' => $year,
                    ],
                    [
                        'is_active' => $year == $activeYear,
                    ]
                );
            }
        }
    }
}
