<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseType;
use App\Models\LibExpenseItem;

class LibExpenseItemSeeder extends Seeder
{
    public function run()
    {
        // Only create 1 item for two specific classes, for their first type
        $targetClasses = ['MOOE', 'CAPITAL OUTLAY'];
        foreach ($targetClasses as $className) {
            $type = LibExpenseType::whereHas('expenseClass', function($q) use ($className) {
                $q->where('name', $className);
            })->first();
            if ($type) {
                LibExpenseItem::firstOrCreate([
                    'expense_type_id' => $type->id,
                    'name' => 'Sample Item',
                ], [
                    'order' => 0,
                ]);
            }
        }
    }
} 