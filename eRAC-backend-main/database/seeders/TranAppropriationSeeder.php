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
use App\Models\LibFiscalYear;
use Faker\Factory as Faker;

class TranAppropriationSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();
        $now = now();
        $barangays = Barangay::all();

        foreach ($barangays as $barangay) {
            $budgets = Budget::where('barangay_id', $barangay->id)->get();
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();

            if ($budgets->isEmpty() || !$user) {
                \Log::warning("Skipping Barangay {$barangay->id} (no budgets or user found)");
                continue;
            }

            foreach ($budgets as $budget) {
                $remaining = $budget->original_amount;
                $totalAllocated = 0;

                $expenseClasses = LibExpenseClass::where('barangay_id', $barangay->id)
                    ->where('fiscal_year_id', $budget->fiscal_year_id)
                    ->inRandomOrder()
                    ->take(3)
                    ->get();
                foreach ($expenseClasses as $expenseClass) {
                    
                    if (!$expenseClass) {
                        \Log::warning("Skipping Budget {$budget->id} (no expense class found)");
                        continue;
                    }

                    $expenseTypes = LibExpenseType::where('expense_class_id', $expenseClass->id)
                        ->inRandomOrder()
                        ->take(6)
                        ->get();
                    foreach ($expenseTypes as $expenseType) {
                        
                        if($remaining <= 0) {
                            \Log::info("Budget {$budget->id} fully allocated.");
                            continue 2; // exit both loops
                        }elseif($remaining < 200000) {
                            $allocationAmount=$remaining;
                        }else{
                            $allocationAmount = min(
                                $faker->numberBetween(
                                    (int) ($remaining * 0.05),
                                    (int) ($remaining * 0.07)
                                ),
                                $faker->numberBetween(
                                    (int) ($remaining * 0.05),
                                    (int) ($remaining * 0.07)
                                )
                            );
                            if($remaining < 200000) {
                                $allocationAmount+=$remaining;
                            }
                        }
                        
                        if (!$expenseType) {
                            \Log::warning("Skipping ExpenseClass {$expenseClass->id} (no expense type found)");
                            continue;
                        }

                        $fiscalYear = LibFiscalYear::where('barangay_id', $barangay->id)
                            ->where('id', $budget->fiscal_year_id)
                            ->first();

                        if (!$fiscalYear) {
                            \Log::warning("Skipping Budget {$budget->id} (no fiscal year found)");
                            continue;
                        }

                        $year = (int) $fiscalYear->year; // ✅ ensure integer


                        TranAppropriation::create([
                            'barangay_id'      => $barangay->id,
                            'budget_id'        => $budget->id,
                            'expense_class_id' => $expenseClass->id,
                            'expense_type_id'  => $expenseType->id,
                            'expense_item_id'  => null, // nullable
                            'amount'           => $allocationAmount,
                            'transaction_date' => $faker->dateTimeBetween(
                                $now->copy()->setYear($year)->startOfYear(),
                                $now->copy()->setYear($year)->endOfYear()
                            ),
                            'status'           => 'committed',
                            'user_id'          => $user->id,
                        ]);

                        // Update budget (this looks unused since $totalAllocated is always 0)
                        if ($allocationAmount > 0) {
                            $budget->current_amount = max(0, $budget->current_amount - $allocationAmount);
                            $budget->save();

                            \Log::info("Barangay {$barangay->id} | Budget {$budget->id} updated", [
                                'original_amount'    => $budget->original_amount,
                                'allocation'         => $allocationAmount,
                                'new_current_amount' => $budget->current_amount,
                            ]);
                        }
                    }
    
                }

                
            }
        }
    }
}
