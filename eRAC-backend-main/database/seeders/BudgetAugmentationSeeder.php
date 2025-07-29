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
            if (!$user) continue;

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
        // Get expense items that have appropriations for this budget
        $expenseItems = LibExpenseItem::whereHas('expenseType.expenseClass', function($query) use ($budget) {
            $query->where('barangay_id', $budget->barangay_id);
        })->with(['expenseType.expenseClass'])->get();

        // Filter items that have appropriations for this budget
        $expenseItemsWithAppropriations = $expenseItems->filter(function($item) use ($budget) {
            return TranAppropriation::where('budget_id', $budget->id)
                                  ->where('expense_item_id', $item->id)
                                  ->exists();
        });

        if ($expenseItemsWithAppropriations->isEmpty()) {
            return;
        }

        // Create augmentation
        $refNumber = 'AUG-' . date('y') . '-' . str_pad($budget->id, 2, '0', STR_PAD_LEFT) . '-' . str_pad($index, 3, '0', STR_PAD_LEFT);
        $augmentationDate = Carbon::now()->subDays(rand(1, 90));

            $augmentation = BudgetAugmentation::firstOrCreate([
            'ref_number' => $refNumber
            ], [
            'barangay_id' => $budget->barangay_id,
            'budget_id' => $budget->id,
            'augmentation_date' => $augmentationDate->format('Y-m-d'),
            'total_amount' => 0, // Will be calculated from details
            'remarks' => $this->generateRemarks($budget->description, $index),
            'user_id' => $user->id
            ]);

        // Create augmentation details
        $totalAmount = 0;
        $usedExpenseItems = collect(); // Track used expense items to avoid duplicates
        $maxDetails = min(4, $expenseItemsWithAppropriations->count()); // Maximum 4 expense items per augmentation
        $detailsCreated = 0;
        
        // Try to create 2-4 details, but only if there's available amount
        for ($j = 1; $j <= $maxDetails && $detailsCreated < 4; $j++) {
            // Get available expense items that haven't been used yet and have positive available amount
            $availableExpenseItems = $expenseItemsWithAppropriations->filter(function($item) use ($budget, $usedExpenseItems) {
                if ($usedExpenseItems->contains('id', $item->id)) {
                    return false; // Skip if already used
                }
                
                $availableAmount = $this->calculateAvailableAmount($item, $budget);
                return $availableAmount > 0; // Only include items with positive available amount
            });
            
            if ($availableExpenseItems->isEmpty()) {
                break; // No more items with available amount
            }
            
            $expenseItem = $availableExpenseItems->random();
            $usedExpenseItems->push($expenseItem);
            
            // Calculate available amount for this expense item
            $availableAmount = $this->calculateAvailableAmount($expenseItem, $budget);
            
            // Set augmentation amount (not exceeding available amount, minimum 1000)
            $augmentationAmount = max(1000, min(rand(1000, 5000), $availableAmount));
            $totalAmount += $augmentationAmount;

            BudgetAugmentationDetail::firstOrCreate([
                'budget_augmentation_id' => $augmentation->id,
                'expense_item_id' => $expenseItem->id
            ], [
                'expense_class_id' => $expenseItem->expenseType->expenseClass->id,
                'expense_type_id' => $expenseItem->expenseType->id,
                'amount' => $augmentationAmount,
                'particulars' => $this->generateParticulars($expenseItem, $j, $augmentationAmount)
            ]);
            
            $detailsCreated++;
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

    private function calculateAvailableAmount($expenseItem, $budget)
    {
        // Get the original appropriation amount for this expense item and budget
        $appropriation = TranAppropriation::where('budget_id', $budget->id)
                                        ->where('expense_item_id', $expenseItem->id)
                                        ->first();
        
        if (!$appropriation) {
            return 0; // No appropriation exists
        }
        
        $originalAmount = $appropriation->amount;
        
        // Get total existing augmentations for this expense item and budget
        $existingAugmentations = BudgetAugmentationDetail::whereHas('budgetAugmentation', function($query) use ($budget) {
            $query->where('budget_id', $budget->id);
        })->where('expense_item_id', $expenseItem->id)->sum('amount');
        
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

    private function generateParticulars($expenseItem, $index, $amount)
    {
        $particulars = [
            "Additional allocation for {$expenseItem->name} (₱" . number_format($amount, 2) . ")",
            "Supplementary funding for {$expenseItem->name} activities (₱" . number_format($amount, 2) . ")",
            "Emergency budget for {$expenseItem->name} (₱" . number_format($amount, 2) . ")",
            "Additional {$expenseItem->name} expenses (₱" . number_format($amount, 2) . ")",
            "Extra allocation for {$expenseItem->name} projects (₱" . number_format($amount, 2) . ")"
        ];
        
        return $particulars[array_rand($particulars)];
    }
} 