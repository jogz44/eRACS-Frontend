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

            // All available expense classes for this barangay
            $expenseClasses = LibExpenseClass::where('barangay_id', $barangay->id)->get();

            if ($expenseClasses->isEmpty()) {
                \Log::warning("Skipping Barangay {$barangay->id} (no expense classes found)");
                continue;
            }

            foreach ($budgets as $budget) {
                $remaining = $budget->original_amount;
                $totalAllocated = 0;

                // Make several appropriations per budget
                $numAppropriations = $faker->numberBetween(3, 8);

                for ($i = 0; $i < $numAppropriations; $i++) {
                    if ($remaining <= 0) break;

                    $expenseClass = $expenseClasses->random();
                    $expenseType = LibExpenseType::where('expense_class_id', $expenseClass->id)
                        ->inRandomOrder()->first();
                    if (!$expenseType) continue;

                    $expenseItem = LibExpenseItem::where('expense_type_id', $expenseType->id)
                        ->inRandomOrder()->first();

                    // Random allocation between 5%–25% of remaining, but max 200k
                    $allocationAmount = min(
                        $faker->numberBetween((int)($remaining * 0.05), (int)($remaining * 0.25)),
                        200000
                    );

                    if ($allocationAmount > 0) {
                        TranAppropriation::create([
                            'barangay_id'      => $barangay->id,
                            'budget_id'        => $budget->id,
                            'expense_class_id' => $expenseClass->id,
                            'expense_type_id'  => $expenseType->id,
                            'expense_item_id'  => $expenseItem?->id, // nullable
                            'amount'           => $allocationAmount,
                            'transaction_date' => $faker->dateTimeBetween($now->startOfYear(), $now->endOfYear()),
                            'status'           => $faker->randomElement(['draft', 'committed', 'reverted']),
                            'user_id'          => $user->id,
                        ]);

                        $remaining -= $allocationAmount;
                        $totalAllocated += $allocationAmount;
                    }
                }

                // Update budget
                if ($totalAllocated > 0) {
                    $budget->current_amount = max(0, $budget->original_amount - $totalAllocated);
                    $budget->save();

                    \Log::info("Barangay {$barangay->id} | Budget {$budget->id} updated", [
                        'original_amount'    => $budget->original_amount,
                        'total_allocated'    => $totalAllocated,
                        'new_current_amount' => $budget->current_amount,
                    ]);
                }
            }
        }
    }
}
