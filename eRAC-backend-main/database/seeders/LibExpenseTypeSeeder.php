<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseType;
use App\Models\LibExpenseClass;

class LibExpenseTypeSeeder extends Seeder
{
    public function run()
    {
        $expenseClasses = LibExpenseClass::take(2)->get(); // Use first two classes for demonstration
        $types = [
            ['name' => 'Cash Gift', 'order' => 0],
            ['name' => 'Office Supplies Expenses', 'order' => 0],
            ['name' => 'Other MOE', 'order' => 0],
            ['name' => 'Furniture and fixture', 'order' => 0],
            ['name' => '70% Pre & Post Disaster Fund', 'order' => 0],
            ['name' => 'MAintenance of Child Development Center', 'order' => 0],
            ['name' => 'Honorarium', 'order' => 1],
            ['name' => 'Computer Equipment', 'order' => 1],
            ['name' => 'Building Improvements', 'order' => 2],
        ];
        foreach ($expenseClasses as $expenseClass) {
            foreach ($types as $type) {
                LibExpenseType::firstOrCreate([
                    'expense_class_id' => $expenseClass->id,
                    'name' => $type['name'],
                    'order' => $type['order'],
                ]);
            }
        }
    }
} 