<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibFiscalYear;
use App\Models\Barangay;

class LibFiscalYearSeeder extends Seeder
{
    public function run()
    {
        $barangay = Barangay::first();

        // Use updateOrCreate instead of create to handle existing records
        $currentYear = date('Y');
        LibFiscalYear::updateOrCreate(
            [
                'barangay_id' => $barangay->id,
                'year' => $currentYear, // Use current year
            ],
            [
                'is_active' => true,
            ]
        );
    }
}
