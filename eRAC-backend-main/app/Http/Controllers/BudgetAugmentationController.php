<?php

namespace App\Http\Controllers;

use App\Models\BudgetAugmentation;
use App\Models\BudgetAugmentationDetail;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\TranAppropriation; // Added this import

class BudgetAugmentationController extends Controller
{
    /**
     * Helper method to build account names without extra separators
     */
    private function buildAccountName($expenseClass, $expenseType, $expenseItem)
    {
        $parts = [];
        if ($expenseClass && $expenseClass->name) $parts[] = $expenseClass->name;
        if ($expenseType && $expenseType->name) $parts[] = $expenseType->name;
        if ($expenseItem && $expenseItem->name) $parts[] = $expenseItem->name;
        return implode(' > ', $parts);
    }

    /**
     * Helper method to map detail to response format
     */
    private function mapDetailToResponse($detail)
    {
        return [
            'id' => $detail->id,
            'from_appropriation_id' => $detail->from_appropriation_id,
            'to_appropriation_id' => $detail->to_appropriation_id,
            'from_account' => $this->buildAccountName(
                $detail->fromAppropriation->expenseClass,
                $detail->fromAppropriation->expenseType,
                $detail->fromAppropriation->expenseItem
            ),
            'to_account' => $this->buildAccountName(
                $detail->toAppropriation->expenseClass,
                $detail->toAppropriation->expenseType,
                $detail->toAppropriation->expenseItem
            ),
            'amount' => (float)$detail->amount,
            'particulars' => $detail->particulars
        ];
    }



    /**
     * Helper method to perform money transfer between appropriations
     * Handles grouped appropriations by finding all matching appropriations with the same expense hierarchy
     */
    private function performTransfer($fromAppropriation, $toAppropriation, $amount)
    {
        if (!$fromAppropriation || !$toAppropriation) {
            throw new \Exception('Source or destination appropriation not found');
        }

        // Find all appropriations with the same expense hierarchy as the source appropriation
        $sourceAppropriations = TranAppropriation::where('barangay_id', $fromAppropriation->barangay_id)
            ->where('status', 'committed')
            ->where('expense_class_id', $fromAppropriation->expense_class_id)
            ->where('expense_type_id', $fromAppropriation->expense_type_id)
            ->where('expense_item_id', $fromAppropriation->expense_item_id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Calculate total available balance across all source appropriations
        $totalAvailableBalance = $sourceAppropriations->sum('amount');
        
        if ($totalAvailableBalance < $amount) {
            throw new \Exception('Insufficient amount in source appropriation group. Available: ' . $totalAvailableBalance . ', Requested: ' . $amount);
        }

        // Find all appropriations with the same expense hierarchy as the destination appropriation
        $destinationAppropriations = TranAppropriation::where('barangay_id', $toAppropriation->barangay_id)
            ->where('status', 'committed')
            ->where('expense_class_id', $toAppropriation->expense_class_id)
            ->where('expense_type_id', $toAppropriation->expense_type_id)
            ->where('expense_item_id', $toAppropriation->expense_item_id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Distribute the deduction across source appropriations (FIFO order)
        $remainingAmount = $amount;
        foreach ($sourceAppropriations as $sourceApp) {
            if ($remainingAmount <= 0) break;
            
            $availableInSource = $sourceApp->amount;
            $amountToDeduct = min($remainingAmount, $availableInSource);
            
            $sourceApp->decrement('amount', $amountToDeduct);
            $remainingAmount -= $amountToDeduct;
        }

        // Add to the first destination appropriation (or distribute if needed)
        $firstDestination = $destinationAppropriations->first();
        $firstDestination->increment('amount', $amount);

        return [
            'from_appropriation_id' => $fromAppropriation->id,
            'to_appropriation_id' => $toAppropriation->id,
            'amount_transferred' => $amount,
            'source_appropriations_used' => $sourceAppropriations->pluck('id')->toArray(),
            'destination_appropriation_used' => $firstDestination->id
        ];
    }

    /**
     * Display a listing of budget augmentations
     */
    public function index(Request $request)
    {
        try {
            $query = BudgetAugmentation::with([
                'budget', 
                'details.fromAppropriation', 
                'details.toAppropriation'
            ])->forBarangay($request->user()->barangay_id);

            // Apply filters
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('ref_number', 'like', "%{$search}%")
                      ->orWhere('remarks', 'like', "%{$search}%");
                });
            }

            if ($request->filled('date_from')) {
                $query->where('augmentation_date', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->where('augmentation_date', '<=', $request->date_to);
            }

            $augmentations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'status' => true,
                'data' => $augmentations->map(function($augmentation) {
                    return [
                        'id' => $augmentation->id,
                        'ref_number' => $augmentation->ref_number,
                        'augmentation_date' => $augmentation->augmentation_date->format('Y-m-d'),
                        'total_amount' => (float)$augmentation->total_amount,
                        'remarks' => $augmentation->remarks,
                        'details' => $augmentation->details->map(function($detail) {
                            return $this->mapDetailToResponse($detail);
                        })
                    ];
                })
            ]);
        } catch (\Exception $e) {
            \Log::error('BudgetAugmentation index error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'status' => false,
                'message' => 'An error occurred while fetching augmentations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created budget augmentation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'augmentation_date' => 'required|date',
            'remarks' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.from_appropriation_id' => 'required|exists:tran_appropriations,id',
            'details.*.to_appropriation_id' => 'required|exists:tran_appropriations,id',
            'details.*.amount' => 'required|numeric|min:0',
            'details.*.particulars' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            // Generate reference number
            $refNumber = 'AUG-' . date('y') . '-' . date('m') . '-' . str_pad(BudgetAugmentation::count() + 1, 3, '0', STR_PAD_LEFT);

            // Calculate total amount
            $totalAmount = collect($request->details)->sum('amount');

            // Find the first appropriation to determine the budget
            $firstDetail = $request->details[0];
            $firstFromAppropriation = TranAppropriation::find($firstDetail['from_appropriation_id']);

            if (!$firstFromAppropriation) {
                throw new \Exception('Source appropriation not found with ID: ' . $firstDetail['from_appropriation_id']);
            }

            // Get the budget from the first appropriation
            $correctBudget = $firstFromAppropriation->budget;

            // Create budget augmentation
            $augmentation = BudgetAugmentation::create([
                'barangay_id' => $request->user()->barangay_id,
                'budget_id' => $correctBudget->id,
                'ref_number' => $refNumber,
                'augmentation_date' => $request->augmentation_date,
                'total_amount' => $totalAmount,
                'remarks' => $request->remarks,
                'user_id' => $request->user()->id
            ]);

            // Create augmentation details and perform transfers
            foreach ($request->details as $detail) {
                // Find source appropriation (FROM)
                $fromAppropriation = TranAppropriation::find($detail['from_appropriation_id']);

                // Find destination appropriation (TO)
                $toAppropriation = TranAppropriation::find($detail['to_appropriation_id']);

                if (!$fromAppropriation) {
                    throw new \Exception('Source appropriation not found with ID: ' . $detail['from_appropriation_id']);
                }

                if (!$toAppropriation) {
                    throw new \Exception('Destination appropriation not found with ID: ' . $detail['to_appropriation_id']);
                }

                // Perform the actual money transfer
                $transferResult = $this->performTransfer($fromAppropriation, $toAppropriation, $detail['amount']);

                // Adjust budgets if transfer crosses budgets
                $fromBudgetId = $fromAppropriation->budget_id;
                $toBudgetId = $toAppropriation->budget_id;
                if ($fromBudgetId !== $toBudgetId) {
                    // Deduct from source budget's augmentation (money moved out)
                    $fromBudget = \App\Models\Budget::find($fromBudgetId);
                    if ($fromBudget) {
                        $fromBudget->decrement('augmentation', $detail['amount']);
                    }
                    // Add to destination budget's augmentation (money moved in)
                    $toBudget = \App\Models\Budget::find($toBudgetId);
                    if ($toBudget) {
                        $toBudget->increment('augmentation', $detail['amount']);
                    }
                }

                // Create augmentation detail record
                BudgetAugmentationDetail::create([
                    'budget_augmentation_id' => $augmentation->id,
                    'from_appropriation_id' => $fromAppropriation->id,
                    'to_appropriation_id' => $toAppropriation->id,
                    'amount' => $detail['amount'],
                    'particulars' => $detail['particulars'] ?? null
                ]);
            }

            // Note: Budget augmentation per budget was adjusted per-detail when crossing budgets.
            // No aggregate adjustment here to avoid double counting.
            


            return response()->json([
                'status' => true,
                'message' => 'Budget augmentation created successfully',
                'data' => $augmentation->load('details')
            ], 201);
        });
    }

    /**
     * Display the specified budget augmentation
     */
    public function show($id)
    {
        $augmentation = BudgetAugmentation::with([
            'budget', 
            'details.fromAppropriation', 
            'details.toAppropriation'
        ])->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $augmentation->id,
                'ref_number' => $augmentation->ref_number,
                'augmentation_date' => $augmentation->augmentation_date->format('Y-m-d'),
                'total_amount' => (float)$augmentation->total_amount,
                'remarks' => $augmentation->remarks,
                'budget_id' => $augmentation->budget_id,
                'budget_description' => $augmentation->budget->description ?? '',
                'details' => $augmentation->details->map(function($detail) {
                    return $this->mapDetailToResponse($detail);
                })
            ]
        ]);
    }

    /**
     * Update the specified budget augmentation
     */
    public function update(Request $request, $id)
    {
        $augmentation = BudgetAugmentation::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'augmentation_date' => 'required|date',
            'remarks' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.from_appropriation_id' => 'required|exists:tran_appropriations,id',
            'details.*.to_appropriation_id' => 'required|exists:tran_appropriations,id',
            'details.*.amount' => 'required|numeric|min:0',
            'details.*.particulars' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request, $augmentation) {
            // Calculate new total amount
            $newTotalAmount = collect($request->details)->sum('amount');
            $oldTotalAmount = $augmentation->total_amount;

            // Find the first appropriation to determine the new budget
            $firstDetail = $request->details[0];
            $firstFromAppropriation = TranAppropriation::find($firstDetail['from_appropriation_id']);

            if (!$firstFromAppropriation) {
                throw new \Exception('Source appropriation not found with ID: ' . $firstDetail['from_appropriation_id']);
            }

            // Get the new budget from the first appropriation
            $newBudget = $firstFromAppropriation->budget;

            // Update budget augmentation
            $augmentation->update([
                'budget_id' => $newBudget->id,
                'augmentation_date' => $request->augmentation_date,
                'total_amount' => $newTotalAmount,
                'remarks' => $request->remarks
            ]);

            // First, reverse the old transfers by adding back to FROM appropriations and deducting from TO appropriations
            foreach ($augmentation->details as $oldDetail) {
                $oldFromAppropriation = TranAppropriation::find($oldDetail->from_appropriation_id);
                $oldToAppropriation = TranAppropriation::find($oldDetail->to_appropriation_id);

                if ($oldFromAppropriation && $oldToAppropriation) {
                    // Reverse the old transfer
                    $oldFromAppropriation->increment('amount', $oldDetail->amount);
                    $oldToAppropriation->decrement('amount', $oldDetail->amount);

                    // Reverse budget augmentation effects if transfer crossed budgets
                    if ($oldFromAppropriation->budget_id !== $oldToAppropriation->budget_id) {
                        $fromBudget = \App\Models\Budget::find($oldFromAppropriation->budget_id);
                        $toBudget = \App\Models\Budget::find($oldToAppropriation->budget_id);
                        if ($fromBudget) {
                            // Money returns to source budget: augmentation increases back
                            $fromBudget->increment('augmentation', $oldDetail->amount);
                        }
                        if ($toBudget) {
                            // Money removed from destination budget: augmentation decreases
                            $toBudget->decrement('augmentation', $oldDetail->amount);
                        }
                    }
                }
            }

            // Delete old details
            $augmentation->details()->delete();

            // Create new details and perform new transfers
            foreach ($request->details as $detail) {
                // Find source appropriation (FROM)
                $fromAppropriation = TranAppropriation::find($detail['from_appropriation_id']);

                // Find destination appropriation (TO)
                $toAppropriation = TranAppropriation::find($detail['to_appropriation_id']);

                if (!$fromAppropriation) {
                    throw new \Exception('Source appropriation not found with ID: ' . $detail['from_appropriation_id']);
                }

                if (!$toAppropriation) {
                    throw new \Exception('Destination appropriation not found with ID: ' . $detail['to_appropriation_id']);
                }

                // Perform the actual money transfer
                $transferResult = $this->performTransfer($fromAppropriation, $toAppropriation, $detail['amount']);

                // Adjust budgets if transfer crosses budgets
                if ($fromAppropriation->budget_id !== $toAppropriation->budget_id) {
                    $fromBudget = \App\Models\Budget::find($fromAppropriation->budget_id);
                    $toBudget = \App\Models\Budget::find($toAppropriation->budget_id);
                    if ($fromBudget) {
                        $fromBudget->decrement('augmentation', $detail['amount']);
                    }
                    if ($toBudget) {
                        $toBudget->increment('augmentation', $detail['amount']);
                    }
                }

                // Create augmentation detail record
                BudgetAugmentationDetail::create([
                    'budget_augmentation_id' => $augmentation->id,
                    'from_appropriation_id' => $fromAppropriation->id,
                    'to_appropriation_id' => $toAppropriation->id,
                    'amount' => $detail['amount'],
                    'particulars' => $detail['particulars'] ?? null
                ]);
            }

            // Budget augmentation values were adjusted per-detail above to reflect cross-budget transfers.

            return response()->json([
                'status' => true,
                'message' => 'Budget augmentation updated successfully',
                'data' => $augmentation->load('details')
            ]);
        });
    }

    /**
     * Remove the specified budget augmentation
     */
    public function destroy($id)
    {
        $augmentation = BudgetAugmentation::findOrFail($id);

        return DB::transaction(function () use ($augmentation) {
            // Reverse all transfers by adding back to FROM appropriations and deducting from TO appropriations
            foreach ($augmentation->details as $detail) {
                $fromAppropriation = TranAppropriation::find($detail->from_appropriation_id);
                $toAppropriation = TranAppropriation::find($detail->to_appropriation_id);

                if ($fromAppropriation && $toAppropriation) {
                    // Reverse the transfer
                    $fromAppropriation->increment('amount', $detail->amount);
                    $toAppropriation->decrement('amount', $detail->amount);

                    // Reverse budget augmentation effects if transfer crossed budgets
                    if ($fromAppropriation->budget_id !== $toAppropriation->budget_id) {
                        $fromBudget = \App\Models\Budget::find($fromAppropriation->budget_id);
                        $toBudget = \App\Models\Budget::find($toAppropriation->budget_id);
                        if ($fromBudget) {
                            $fromBudget->increment('augmentation', $detail->amount);
                        }
                        if ($toBudget) {
                            $toBudget->decrement('augmentation', $detail->amount);
                        }
                    }
                }
            }

            // Budget augmentation values were previously adjusted per-detail; no aggregate change here

            // Delete augmentation and details
            $augmentation->delete();

            return response()->json([
                'status' => true,
                'message' => 'Budget augmentation deleted successfully'
            ]);
        });
    }
} 