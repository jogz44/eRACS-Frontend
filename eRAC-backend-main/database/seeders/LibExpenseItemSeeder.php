<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibExpenseItem;
use App\Models\LibExpenseType;

class LibExpenseItemSeeder extends Seeder
{
    public function run()
    {
        $types = LibExpenseType::all();
        $itemsByType = [
            'Cash Gift' => ['Regular Cash Gift', 'Special Cash Gift'],
            'Office Supplies Expenses' => ['Paper', 'Ink'],
            'Other MOE' => ['Miscellaneous', 'Contingency'],
            'Furniture and fixture' => ['Chair', 'Table'],
            '70% Pre & Post Disaster Fund' => ['Relief Goods', 'Evacuation Supplies'],
            'Maintenance of Child Development Center' => ['Repair', 'Supplies'],
            'Honorarium' => ['Monthly Honorarium', 'Quarterly Honorarium'],
            'Computer Equipment' => ['Desktop', 'Printer'],
            'Building Improvements' => ['Roof Repair', 'Painting'],
        ];
        foreach ($types as $type) {
            $items = $itemsByType[$type->name] ?? ['Item 1', 'Item 2'];
            foreach ($items as $idx => $itemName) {
                LibExpenseItem::firstOrCreate([
                    'expense_type_id' => $type->id,
                    'name' => $itemName,
                    'order' => $idx + 1,
                ]);
            }
        }
    }
} 