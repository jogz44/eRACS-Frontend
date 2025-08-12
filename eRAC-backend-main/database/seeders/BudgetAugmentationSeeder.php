<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BudgetAugmentation;
use App\Models\BudgetAugmentationDetail;
use App\Models\Budget;
use App\Models\LibExpenseClass;
use App\Models\LibExpenseType;
use App\Models\LibExpenseItem;
use App\Models\BarangayUser;
use App\Models\Barangay;
use App\Models\LibFiscalYear;
use App\Models\TranAppropriation;
use Carbon\Carbon;

class BudgetAugmentationSeeder extends Seeder
{
    public function run()
    {
        $fiscalYear = LibFiscalYear::first();
        $barangays = Barangay::all();
        
        if (!$fiscalYear || $barangays->isEmpty()) {
            return;
        }

        foreach ($barangays as $barangay) {
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            if (!$user) {
                continue;
            }

            // Get budgets for this barangay
            $budgets = Budget::where('barangay_id', $barangay->id)
                           ->where('fiscal_year_id', $fiscalYear->id)
                           ->get();

            foreach ($budgets as $budget) {
                // Create 1-2 augmentations per budget
                $numAugmentations = rand(1, 2);
                
                for ($i = 1; $i <= $numAugmentations; $i++) {
                    $this->createAugmentation($budget, $user, $i);
                }
            }
        }
    }

    private function createAugmentation($budget, $user, $index)
    {
        // Get appropriations for this budget that can be augmented
        $appropriations = TranAppropriation::where('budget_id', $budget->id)
                                         ->where('status', 'committed')
                                         ->get();

        if ($appropriations->isEmpty()) {
            return;
        }

        // Filter appropriations that can be augmented (have positive available amount)
        $augmentableAppropriations = $appropriations->filter(function($appropriation) use ($budget) {
            $availableAmount = $this->calculateAvailableAmountForAppropriation($appropriation, $budget);
            return $availableAmount > 0;
        });

        if ($augmentableAppropriations->isEmpty()) {
            return;
        }

        // Create augmentation
        $refNumber = 'AUG-' . date('y') . '-' . str_pad($budget->id, 2, '0', STR_PAD_LEFT) . '-' . str_pad($index, 3, '0', STR_PAD_LEFT);
        $augmentationDate = Carbon::now()->subDays(rand(1, 90));

        $augmentation = BudgetAugmentation::create([
            'barangay_id' => $budget->barangay_id,
            'budget_id' => $budget->id,
            'ref_number' => $refNumber,
            'augmentation_date' => $augmentationDate->format('Y-m-d'),
            'total_amount' => 0, // Will be calculated from details
            'remarks' => $this->generateRemarks($budget->description ?? 'Budget', $index),
            'user_id' => $user->id
        ]);

        // Create augmentation details
        $totalAmount = 0;
        $usedAppropriations = collect(); // Track used appropriations to avoid duplicates
        $maxDetails = min(4, $augmentableAppropriations->count()); // Maximum 4 details per augmentation
        $detailsCreated = 0;
        
        // Try to create 2-4 details, but only if there's available amount
        for ($j = 1; $j <= $maxDetails && $detailsCreated < 4; $j++) {
            // Get available appropriations that haven't been used yet and have positive available amount
            $availableAppropriations = $augmentableAppropriations->filter(function($appropriation) use ($budget, $usedAppropriations) {
                if ($usedAppropriations->contains('id', $appropriation->id)) {
                    return false; // Skip if already used
                }
                
                $availableAmount = $this->calculateAvailableAmountForAppropriation($appropriation, $budget);
                return $availableAmount > 0; // Only include appropriations with positive available amount
            });
            
            if ($availableAppropriations->isEmpty()) {
                break; // No more appropriations with available amount
            }
            
            $appropriation = $availableAppropriations->random();
            $usedAppropriations->push($appropriation);
            
            // Calculate available amount for this appropriation
            $availableAmount = $this->calculateAvailableAmountForAppropriation($appropriation, $budget);
            
            // Set augmentation amount (not exceeding available amount, minimum 1000)
            $augmentationAmount = max(1000, min(rand(1000, 5000), $availableAmount));
            $totalAmount += $augmentationAmount;

            // Create augmentation detail
            $detailData = [
                'budget_augmentation_id' => $augmentation->id,
                'from_expense_class_id' => $appropriation->expense_class_id,
                'from_expense_type_id' => $appropriation->expense_type_id,
                'amount' => $augmentationAmount,
                'particulars' => $this->generateParticularsForAppropriation($appropriation, $j, $augmentationAmount)
            ];

            // Only set from_expense_item_id if it exists
            if ($appropriation->expense_item_id) {
                $detailData['from_expense_item_id'] = $appropriation->expense_item_id;
            }

            // All augmentations are transfers - find a different appropriation to transfer to
            $transferToAppropriation = $augmentableAppropriations->filter(function($app) use ($appropriation) {
                // Must be different from the current appropriation
                return $app->id !== $appropriation->id &&
                       // Must have different expense structure
                       ($app->expense_class_id !== $appropriation->expense_class_id ||
                        $app->expense_type_id !== $appropriation->expense_type_id ||
                        $app->expense_item_id !== $appropriation->expense_item_id);
            })->first();
            
            // Only create augmentation if we found a different appropriation to transfer to
            if ($transferToAppropriation) {
                $detailData['transfer_to_expense_class_id'] = $transferToAppropriation->expense_class_id;
                $detailData['transfer_to_expense_type_id'] = $transferToAppropriation->expense_type_id;
                
                if ($transferToAppropriation->expense_item_id) {
                    $detailData['transfer_to_expense_item_id'] = $transferToAppropriation->expense_item_id;
                }
                
                // Update particulars to indicate it's a transfer
                $detailData['particulars'] = "Transfer from " . $this->getExpenseDescription($appropriation) . " to " . $this->getExpenseDescription($transferToAppropriation) . " (₱" . number_format($augmentationAmount, 2) . ")";
                
                // Create the augmentation detail
                BudgetAugmentationDetail::create($detailData);
                $detailsCreated++;
            }
            // If no different appropriation found, skip creating this augmentation
        }

        // Only proceed if we created at least 2 details with positive amount
        if ($totalAmount > 0 && $detailsCreated >= 2) {
            // Update augmentation total amount
            $augmentation->update(['total_amount' => $totalAmount]);

            // Update budget augmentation and current amount
            $budget->increment('augmentation', $totalAmount);
            $budget->increment('current_amount', $totalAmount);
        } else {
            // If no details were created or total amount is 0, delete the augmentation
            $augmentation->delete();
        }
    }

    private function calculateAvailableAmountForAppropriation($appropriation, $budget)
    {
        $originalAmount = $appropriation->amount;
        
        // Get total existing augmentations for this appropriation
        $existingAugmentations = BudgetAugmentationDetail::whereHas('budgetAugmentation', function($query) use ($budget) {
            $query->where('budget_id', $budget->id);
        })->where(function($query) use ($appropriation) {
            $query->where('from_expense_class_id', $appropriation->expense_class_id)
                  ->where('from_expense_type_id', $appropriation->expense_type_id);
            
            // If appropriation has an expense item, also check by expense item
            if ($appropriation->expense_item_id) {
                $query->orWhere('from_expense_item_id', $appropriation->expense_item_id);
            }
        })->sum('amount');
        
        // Return remaining available amount
        return max(0, $originalAmount - $existingAugmentations);
    }

    private function generateRemarks($budgetDescription, $index)
    {
        $remarks = [
            "Additional funding for {$budgetDescription} - Quarter " . ceil($index / 2),
            "Emergency augmentation for {$budgetDescription}",
            "Supplementary budget allocation for {$budgetDescription}",
            "Additional allocation for {$budgetDescription} projects",
            "Budget adjustment for {$budgetDescription} activities"
        ];
        
        return $remarks[array_rand($remarks)];
    }

    private function generateParticularsForAppropriation($appropriation, $index, $amount)
    {
        $expenseClass = $appropriation->expenseClass;
        $expenseType = $appropriation->expenseType;
        $expenseItem = $appropriation->expenseItem;
        
        $description = '';
        if ($expenseItem) {
            $description = $expenseItem->name;
        } elseif ($expenseType) {
            $description = $expenseType->name;
        } elseif ($expenseClass) {
            $description = $expenseClass->name;
        } else {
            $description = 'Budget Item';
        }
        
        $particulars = [
            "Additional allocation for {$description} (₱" . number_format($amount, 2) . ")",
            "Supplementary funding for {$description} activities (₱" . number_format($amount, 2) . ")",
            "Emergency budget for {$description} (₱" . number_format($amount, 2) . ")",
            "Additional {$description} expenses (₱" . number_format($amount, 2) . ")",
            "Extra allocation for {$description} projects (₱" . number_format($amount, 2) . ")"
        ];
        
        return $particulars[array_rand($particulars)];
    }

    private function getExpenseDescription($appropriation)
    {
        $expenseClass = $appropriation->expenseClass;
        $expenseType = $appropriation->expenseType;
        $expenseItem = $appropriation->expenseItem;

        if ($expenseItem && $expenseItem->name) {
            return $expenseItem->name;
        } elseif ($expenseType && $expenseType->name) {
            return $expenseType->name;
        } elseif ($expenseClass && $expenseClass->name) {
            return $expenseClass->name;
        } else {
            return 'Budget Item';
        }
    }
} 