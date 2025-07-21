<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseType;
use App\Models\LibExpenseClass;

class LibExpenseTypeSeeder extends Seeder
{
    public function run()
    {
        $class1 = LibExpenseClass::where('name', 'Personnel Services')->first();
        $class2 = LibExpenseClass::where('name', 'Maintenance and Other Operating Expenses')->first();
        LibExpenseType::create([
            'expense_class_id' => $class1->id,
            'name' => 'Salaries and Wages',
            'order' => 1,
        ]);
        LibExpenseType::create([
            'expense_class_id' => $class1->id,
            'name' => 'Other Compensation',
            'order' => 2,
        ]);
        LibExpenseType::create([
            'expense_class_id' => $class2->id,
            'name' => 'Utilities',
            'order' => 1,
        ]);
        LibExpenseType::create([
            'expense_class_id' => $class2->id,
            'name' => 'Supplies and Materials',
            'order' => 2,
        ]);
    }
} 