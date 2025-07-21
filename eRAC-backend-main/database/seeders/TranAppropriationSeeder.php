<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TranAppropriation;
use App\Models\Budget;
use App\Models\Barangay;
use App\Models\BarangayUser;
use App\Models\LibExpenseClass;
use App\Models\LibExpenseType;
use App\Models\LibExpenseItem;

class TranAppropriationSeeder extends Seeder
{
    public function run()
    {
        $barangay = Barangay::first();
        $budget = Budget::first();
        $user = BarangayUser::first();
        $now = now();
        // Allocate to each class
        foreach (LibExpenseClass::all() as $class) {
            TranAppropriation::create([
                'barangay_id' => $barangay->id,
                'budget_id' => $budget->id,
                'expense_class_id' => $class->id,
                'amount' => 10000,
                'transaction_date' => $now,
                'status' => 'committed',
                'user_id' => $user->id,
            ]);
        }
        // Allocate to each type
        foreach (LibExpenseType::all() as $type) {
            TranAppropriation::create([
                'barangay_id' => $barangay->id,
                'budget_id' => $budget->id,
                'expense_type_id' => $type->id,
                'amount' => 5000,
                'transaction_date' => $now,
                'status' => 'committed',
                'user_id' => $user->id,
            ]);
        }
        // Allocate to each item
        foreach (LibExpenseItem::all() as $item) {
            TranAppropriation::create([
                'barangay_id' => $barangay->id,
                'budget_id' => $budget->id,
                'expense_item_id' => $item->id,
                'amount' => 2000,
                'transaction_date' => $now,
                'status' => 'committed',
                'user_id' => $user->id,
            ]);
        }
    }
} 