<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseItem;
use App\Models\LibExpenseType;

class LibExpenseItemSeeder extends Seeder
{
    public function run()
    {
        $type1 = LibExpenseType::where('name', 'Salaries and Wages')->first();
        $type2 = LibExpenseType::where('name', 'Other Compensation')->first();
        $type3 = LibExpenseType::where('name', 'Utilities')->first();
        $type4 = LibExpenseType::where('name', 'Supplies and Materials')->first();
        LibExpenseItem::create([
            'expense_type_id' => $type1->id,
            'name' => 'Regular Pay',
            'order' => 1,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type1->id,
            'name' => 'Overtime Pay',
            'order' => 2,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type2->id,
            'name' => 'Year-End Bonus',
            'order' => 1,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type2->id,
            'name' => 'Cash Gift',
            'order' => 2,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type3->id,
            'name' => 'Electricity',
            'order' => 1,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type3->id,
            'name' => 'Water',
            'order' => 2,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type4->id,
            'name' => 'Office Supplies',
            'order' => 1,
        ]);
        LibExpenseItem::create([
            'expense_type_id' => $type4->id,
            'name' => 'Janitorial Supplies',
            'order' => 2,
        ]);
    }
} 