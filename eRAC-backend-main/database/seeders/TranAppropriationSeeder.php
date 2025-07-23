<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TranAppropriation;
use App\Models\Budget;
use App\Models\Barangay;
use App\Models\BarangayUser;
use App\Models\LibExpenseItem;

class TranAppropriationSeeder extends Seeder
{
    public function run()
    {
        $now = now();
        $barangays = Barangay::all();
        foreach ($barangays as $bIndex => $barangay) {
            $budgets = Budget::where('barangay_id', $barangay->id)->get();
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            if (!$budgets->count() || !$user) continue;
            $items = LibExpenseItem::all();
            foreach ($budgets as $budgetIndex => $budget) {
                foreach ($items as $iIndex => $item) {
                    TranAppropriation::firstOrCreate([
                        'barangay_id' => $barangay->id,
                        'budget_id' => $budget->id,
                        'expense_item_id' => $item->id,
                    ], [
                        'amount' => 1000 + ($bIndex * 500) + ($budgetIndex * 200) + ($iIndex * 100), // Vary by barangay, budget, and item
                        'transaction_date' => $now,
                        'status' => 'committed',
                        'user_id' => $user->id,
                    ]);
                }
            }
        }
    }
} 