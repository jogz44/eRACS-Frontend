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
            
            if (!$budgets->count() || !$user) continue;
            
            // Get all available expense classes for this barangay
            $allExpenseClasses = LibExpenseClass::where('barangay_id', $barangay->id)->get();
            
            if ($allExpenseClasses->count() < 2) {
                \Log::warning("Barangay {$barangay->id} doesn't have enough expense classes for appropriation seeding");
                continue;
            }
            
            foreach ($budgets as $budgetIndex => $budget) {
                $remaining = $budget->original_amount;
                $totalAllocated = 0;
                
                // Each budget gets a different expense class
                // Budget 1 gets the first expense class, Budget 2 gets the second expense class
                $expenseClass = $allExpenseClasses->get($budgetIndex % $allExpenseClasses->count());
                
                if (!$expenseClass) {
                    \Log::warning("No expense class found for budget {$budget->id}");
                    continue;
                }
                
                // Get the first expense type for this class
                $expenseType = LibExpenseType::where('expense_class_id', $expenseClass->id)->first();
                
                if (!$expenseType) {
                    \Log::warning("Expense class {$expenseClass->id} doesn't have any expense types");
                    continue;
                }
                
                // Check if this type has items
                $expenseItem = LibExpenseItem::where('expense_type_id', $expenseType->id)->first();
                
                if ($expenseItem) {
                    // Create item-level appropriation
                    $itemAmount = min(50000, $remaining * 0.4); // 40% of remaining budget
                    
                    if ($itemAmount > 0 && $remaining > 0) {
                        TranAppropriation::firstOrCreate([
                            'barangay_id' => $barangay->id,
                            'budget_id' => $budget->id,
                            'expense_class_id' => $expenseClass->id,
                            'expense_type_id' => $expenseType->id,
                            'expense_item_id' => $expenseItem->id,
                        ], [
                            'amount' => $itemAmount,
                            'transaction_date' => $now,
                            'status' => 'committed',
                            'user_id' => $user->id,
                        ]);
                        
                        $remaining -= $itemAmount;
                        $totalAllocated += $itemAmount;
                    }
                } else {
                    // Create type-level appropriation
                    $typeAmount = min(50000, $remaining * 0.4); // 40% of remaining budget
                    
                    if ($typeAmount > 0 && $remaining > 0) {
                        TranAppropriation::firstOrCreate([
                            'barangay_id' => $barangay->id,
                            'budget_id' => $budget->id,
                            'expense_class_id' => $expenseClass->id,
                            'expense_type_id' => $expenseType->id,
                            'expense_item_id' => null,
                        ], [
                            'amount' => $typeAmount,
                            'transaction_date' => $now,
                            'status' => 'committed',
                            'user_id' => $user->id,
                        ]);
                        
                        $remaining -= $typeAmount;
                        $totalAllocated += $typeAmount;
                    }
                }
                
                // Update the budget's current_amount after all appropriations
                if ($totalAllocated > 0) {
                    $budget->current_amount = $budget->original_amount - $totalAllocated;
                    $budget->save();
                    
                    \Log::info('Budget updated by seeder', [
                        'budget_id' => $budget->id,
                        'original_amount' => $budget->original_amount,
                        'total_allocated' => $totalAllocated,
                        'new_current_amount' => $budget->current_amount
                    ]);
                }
            }
        }
    }
} 