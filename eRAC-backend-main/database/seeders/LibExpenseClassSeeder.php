<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseClass;
use App\Models\LibFiscalYear;
use App\Models\Barangay;

class LibExpenseClassSeeder extends Seeder
{
    public function run()
    {
        $barangay = Barangay::first();
        $fiscalYear = LibFiscalYear::first();
        LibExpenseClass::create([
            'barangay_id' => $barangay->id,
            'fiscal_year_id' => $fiscalYear->id,
            'name' => 'Personnel Services',
            'order' => 1,
        ]);
        LibExpenseClass::create([
            'barangay_id' => $barangay->id,
            'fiscal_year_id' => $fiscalYear->id,
            'name' => 'Maintenance and Other Operating Expenses',
            'order' => 2,
        ]);
    }
} 