<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TranAppropriation;
use App\Models\Budget;
use App\Models\Barangay;
use App\Models\BarangayUser;
use App\Models\LibExpenseItem;
use App\Models\LibExpenseType;
use App\Models\LibExpenseClass;

class TranAppropriationSeeder extends Seeder
{
    public function run()
    {
        $now = now();
        $barangays = Barangay::all();

        foreach ($barangays as $barangay) {
            $budgets = Budget::where('barangay_id', $barangay->id)->get();
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();

            if ($budgets->isEmpty() || !$user) {
                \Log::warning("Skipping Barangay {$barangay->id} (no budgets or user found)");
                continue;
            }

            // All available expense classes for this barangay
            $expenseClasses = LibExpenseClass::where('barangay_id', $barangay->id)->get();

            if ($expenseClasses->isEmpty()) {
                \Log::warning("Skipping Barangay {$barangay->id} (no expense classes found)");
                continue;
            }

            foreach ($budgets as $budgetIndex => $budget) {
                $remaining = $budget->original_amount;
                $totalAllocated = 0;

                // Rotate through expense classes for fairness
                $expenseClass = $expenseClasses->get($budgetIndex % $expenseClasses->count());

                if (!$expenseClass) continue;

                // Get a random expense type for this class
                $expenseType = LibExpenseType::where('expense_class_id', $expenseClass->id)->inRandomOrder()->first();

                if (!$expenseType) {
                    \Log::warning("Expense class {$expenseClass->id} has no types, skipping");
                    continue;
                }

                // Try to get random expense item
                $expenseItem = LibExpenseItem::where('expense_type_id', $expenseType->id)->inRandomOrder()->first();

                $allocationAmount = min(50000, max(1000, $remaining * 0.4)); // 40% but not less than 1000

                if ($allocationAmount > 0 && $remaining > 0) {
                    TranAppropriation::create([
                        'barangay_id'      => $barangay->id,
                        'budget_id'        => $budget->id,
                        'expense_class_id' => $expenseClass->id,
                        'expense_type_id'  => $expenseType->id,
                        'expense_item_id'  => $expenseItem?->id, // nullable
                        'amount'           => $allocationAmount,
                        'transaction_date' => $now,
                        'status'           => 'committed',
                        'user_id'          => $user->id,
                    ]);

                    $remaining -= $allocationAmount;
                    $totalAllocated += $allocationAmount;
                }

                // Update budget
                if ($totalAllocated > 0) {
                    $budget->current_amount = max(0, $budget->original_amount - $totalAllocated);
                    $budget->save();

                    \Log::info("Barangay {$barangay->id} | Budget {$budget->id} updated", [
                        'original_amount'   => $budget->original_amount,
                        'total_allocated'   => $totalAllocated,
                        'new_current_amount'=> $budget->current_amount,
                    ]);
                }
            }
        }
    }
}
