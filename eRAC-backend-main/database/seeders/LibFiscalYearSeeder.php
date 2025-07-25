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
        LibFiscalYear::updateOrCreate(
            [
                'barangay_id' => $barangay->id,
                'year' => '2025', // Set specific year instead of using now()
            ],
            [
                'is_active' => true,
            ]
        );
    }
}
