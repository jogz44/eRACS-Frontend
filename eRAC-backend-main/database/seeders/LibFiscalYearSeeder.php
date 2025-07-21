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
        LibFiscalYear::create([
            'barangay_id' => $barangay->id,
            'year' => now()->year,
            'is_active' => true,
        ]);
    }
} 