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
        $now = now();
        $barangays = Barangay::all();
        
        foreach ($barangays as $bIndex => $barangay) {
            $budgets = Budget::where('barangay_id', $barangay->id)->get();
            $user = BarangayUser::where('barangay_id', $barangay->id)->first();
            
            if (!$budgets->count() || !$user) continue;
            
            foreach ($budgets as $budgetIndex => $budget) {
                // Get existing appropriations for this budget
                $existingAppropriations = TranAppropriation::where('barangay_id', $barangay->id)
                    ->where('budget_id', $budget->id)
                    ->where('status', 'committed')
                    ->where('amount', '>', 0)
                    ->get();
                
                if ($existingAppropriations->count() < 2) continue; // Need at least 2 appropriations for transfers
                
                // Create 1-3 augmentations per budget
                $numAugmentations = min(3, $existingAppropriations->count() - 1);
                
                for ($i = 1; $i <= $numAugmentations; $i++) {
                    $this->createAugmentation($barangay, $budget, $user, $existingAppropriations, $i);
                }
            }
        }
    }

    private function createAugmentation($barangay, $budget, $user, $existingAppropriations, $index)
    {
        // Generate augmentation date (within the last 6 months)
        $augmentationDate = now()->subDays(rand(1, 180));
        
        // Create budget augmentation
        $augmentation = BudgetAugmentation::create([
            'barangay_id' => $barangay->id,
            'budget_id' => $budget->id,
            'ref_number' => 'AUG-' . $augmentationDate->format('y') . '-' . $augmentationDate->format('m') . '-' . str_pad($budget->id, 2, '0', STR_PAD_LEFT) . '-' . str_pad($index, 3, '0', STR_PAD_LEFT),
            'augmentation_date' => $augmentationDate->format('Y-m-d'),
            'total_amount' => 0, // Will be calculated from details
            'remarks' => $this->generateRemarks($budget->description ?? 'Budget', $index),
            'user_id' => $user->id
        ]);

        // Create augmentation details with actual transfers
        $totalAmount = 0;
        $usedAppropriationIds = collect();
        $maxDetails = min(3, $existingAppropriations->count() - 1);
        $detailsCreated = 0;
        
        for ($j = 1; $j <= $maxDetails && $detailsCreated < 3; $j++) {
            // Refresh appropriations from database to get current amounts
            $currentAppropriations = TranAppropriation::where('barangay_id', $barangay->id)
                ->where('budget_id', $budget->id)
                ->where('status', 'committed')
                ->where('amount', '>', 1000)
                ->whereNotIn('id', $usedAppropriationIds->toArray())
                ->get();
            
            if ($currentAppropriations->count() < 2) break; // Need at least 2 for transfer
            
            $fromAppropriation = $currentAppropriations->random();
            $usedAppropriationIds->push($fromAppropriation->id);
            
            // Find a different appropriation to transfer to (refresh again to exclude the FROM appropriation)
            $transferToAppropriations = TranAppropriation::where('barangay_id', $barangay->id)
                ->where('budget_id', $budget->id)
                ->where('status', 'committed')
                ->where('amount', '>', 0)
                ->whereNotIn('id', $usedAppropriationIds->toArray())
                ->where(function($query) use ($fromAppropriation) {
                    $query->where('expense_class_id', '!=', $fromAppropriation->expense_class_id)
                          ->orWhere('expense_type_id', '!=', $fromAppropriation->expense_type_id)
                          ->orWhere('expense_item_id', '!=', $fromAppropriation->expense_item_id);
                })
                ->get();
            
            if ($transferToAppropriations->isEmpty()) {
                // If no different appropriation found, try to find any unused appropriation
                $transferToAppropriations = TranAppropriation::where('barangay_id', $barangay->id)
                    ->where('budget_id', $budget->id)
                    ->where('status', 'committed')
                    ->where('amount', '>', 0)
                    ->whereNotIn('id', $usedAppropriationIds->toArray())
                    ->get();
            }
            
            if ($transferToAppropriations->isEmpty()) continue;
            
            $toAppropriation = $transferToAppropriations->random();
            $usedAppropriationIds->push($toAppropriation->id);
            
            // Refresh both appropriations to get current amounts
            $fromAppropriation->refresh();
            $toAppropriation->refresh();
            
            // Calculate transfer amount (not exceeding available amount, minimum 500)
            $maxTransferAmount = min($fromAppropriation->amount * 0.3, 3000); // Max 30% of source amount or 3000
            $transferAmount = max(500, min(rand(500, 2000), $maxTransferAmount));
            
            if ($transferAmount > $fromAppropriation->amount) continue; // Skip if insufficient funds
            
            try {
                // Perform the actual transfer
                $fromAppropriation->decrement('amount', $transferAmount);
                $toAppropriation->increment('amount', $transferAmount);
                
                $totalAmount += $transferAmount;

                // Create augmentation detail
                $detailData = [
                    'budget_augmentation_id' => $augmentation->id,
                    'from_expense_class_id' => $fromAppropriation->expense_class_id,
                    'from_expense_type_id' => $fromAppropriation->expense_type_id,
                    'from_expense_item_id' => $fromAppropriation->expense_item_id,
                    'transfer_to_expense_class_id' => $toAppropriation->expense_class_id,
                    'transfer_to_expense_type_id' => $toAppropriation->expense_type_id,
                    'transfer_to_expense_item_id' => $toAppropriation->expense_item_id,
                    'amount' => $transferAmount,
                    'particulars' => "Transfer from " . $this->getExpenseDescription($fromAppropriation) . " to " . $this->getExpenseDescription($toAppropriation) . " (₱" . number_format($transferAmount, 2) . ")"
                ];

                BudgetAugmentationDetail::create($detailData);
                $detailsCreated++;
                
            } catch (\Exception $e) {
                // Log error and continue with next iteration
                \Log::warning('Failed to create augmentation detail: ' . $e->getMessage());
                continue;
            }
        }

        // Only proceed if we created at least 1 detail with positive amount
        if ($totalAmount > 0 && $detailsCreated >= 1) {
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

    private function getExpenseDescription($appropriation)
    {
        $parts = [];
        
        if ($appropriation->expenseClass && $appropriation->expenseClass->name) {
            $parts[] = $appropriation->expenseClass->name;
        }
        
        if ($appropriation->expenseType && $appropriation->expenseType->name) {
            $parts[] = $appropriation->expenseType->name;
        }
        
        if ($appropriation->expenseItem && $appropriation->expenseItem->name) {
            $parts[] = $appropriation->expenseItem->name;
        }
        
        return implode(' > ', $parts);
    }
} 