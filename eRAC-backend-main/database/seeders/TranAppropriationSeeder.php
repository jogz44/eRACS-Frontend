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
        
        foreach ($barangays as $bIndex => $barangay) {
            $budgets = Budget::where('barangay_id', $barangay->id)->get();
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            
            if (!$budgets->count() || !$user) continue;
            
            // Get only 2 expense classes for this barangay
            $expenseClasses = LibExpenseClass::where('barangay_id', $barangay->id)->take(2)->get();
            
            foreach ($budgets as $budgetIndex => $budget) {
                $remaining = $budget->original_amount;
                $totalAllocated = 0; // Track total allocated for this budget
                
                foreach ($expenseClasses as $classIndex => $expenseClass) {
                    $types = LibExpenseType::where('expense_class_id', $expenseClass->id)->get();
                    
                    foreach ($types as $typeIndex => $expenseType) {
                        // Check if this type has items
                        $items = LibExpenseItem::where('expense_type_id', $expenseType->id)->get();
                        
                        if ($items->count() > 0) {
                            // Type has items - create item-level appropriations only
                            foreach ($items as $itemIndex => $item) {
                                // Calculate item-level allocation (distributed among items)
                                $itemAmount = min(
                                    (500 + ($bIndex * 100) + ($budgetIndex * 50) + ($classIndex * 30) + ($typeIndex * 20) + ($itemIndex * 10)),
                                    $remaining * 0.8 / max($items->count(), 1) // 80% of remaining budget for items
                                );
                                
                                if ($itemAmount > 0 && $remaining > 0) {
                                    TranAppropriation::firstOrCreate([
                                        'barangay_id' => $barangay->id,
                                        'budget_id' => $budget->id,
                                        'expense_class_id' => $expenseClass->id,
                                        'expense_type_id' => $expenseType->id,
                                        'expense_item_id' => $item->id,
                                    ], [
                                        'amount' => $itemAmount,
                                        'transaction_date' => $now,
                                        'status' => 'committed',
                                        'user_id' => $user->id,
                                    ]);
                                    
                                    $remaining -= $itemAmount;
                                    $totalAllocated += $itemAmount; // Track allocated amount
                                }
                                
                                if ($remaining <= 0) break; // Stop if budget is fully appropriated
                            }
                        } else {
                            // Type has no items - create type-level appropriation
                            $typeAmount = min(
                                (1000 + ($bIndex * 300) + ($budgetIndex * 150) + ($classIndex * 100) + ($typeIndex * 50)),
                                $remaining * 0.6 // 60% of remaining budget for type-level
                            );
                            
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
                                $totalAllocated += $typeAmount; // Track allocated amount
                            }
                        }
                        
                        if ($remaining <= 0) break; // Stop if budget is fully appropriated
                    }
                    
                    if ($remaining <= 0) break; // Stop if budget is fully appropriated
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