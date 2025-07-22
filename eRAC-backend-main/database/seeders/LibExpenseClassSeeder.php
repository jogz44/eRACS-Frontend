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
        $classes = [
            ['name' => 'PERSONAL SERVICES', 'order' => 0],
            ['name' => 'MOOE', 'order' => 1],
            ['name' => 'LOCALLY FUNDED PROJECTS', 'order' => 2],
            ['name' => 'CAPITAL OUTLAY', 'order' => 3],
            ['name' => '5% (BDRRMF)', 'order' => 4],
            ['name' => '20% Development Fund', 'order' => 5],
            ['name' => '10% SK FUND', 'order' => 6],
        ];
        foreach ($classes as $class) {
            LibExpenseClass::firstOrCreate([
                'barangay_id' => $barangay->id,
                'fiscal_year_id' => $fiscalYear->id,
                'name' => $class['name'],
                'order' => $class['order'],
            ]);
        }
    }
} 