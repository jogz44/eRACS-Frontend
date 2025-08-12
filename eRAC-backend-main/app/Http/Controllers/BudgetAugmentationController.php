<?php

namespace App\Http\Controllers;

use App\Models\BudgetAugmentation;
use App\Models\BudgetAugmentationDetail;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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
            'account' => $this->buildAccountName($detail->fromExpenseClass, $detail->fromExpenseType, $detail->fromExpenseItem),
            'expense_class_id' => $detail->from_expense_class_id,
            'expense_type_id' => $detail->from_expense_type_id,
            'expense_item_id' => $detail->from_expense_item_id,
            'expense_class' => $detail->fromExpenseClass ? $detail->fromExpenseClass->name : '',
            'expense_type' => $detail->fromExpenseType ? $detail->fromExpenseType->name : '',
            'expense_item' => $detail->fromExpenseItem ? $detail->fromExpenseItem->name : '',
            'transfer_to_expense_class_id' => $detail->transfer_to_expense_class_id,
            'transfer_to_expense_type_id' => $detail->transfer_to_expense_type_id,
            'transfer_to_expense_item_id' => $detail->transfer_to_expense_item_id,
            'transfer_to_expense_class' => $detail->transferToExpenseClass ? $detail->transferToExpenseClass->name : '',
            'transfer_to_expense_type' => $detail->transferToExpenseType ? $detail->transferToExpenseType->name : '',
            'transfer_to_expense_item' => $detail->transferToExpenseItem ? $detail->transferToExpenseItem->name : '',
            'amount' => (float)$detail->amount,
            'particulars' => $detail->particulars
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
                'details.fromExpenseClass', 
                'details.fromExpenseType', 
                'details.fromExpenseItem',
                'details.transferToExpenseClass',
                'details.transferToExpenseType',
                'details.transferToExpenseItem'
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
            'details.*.from_expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.from_expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.from_expense_item_id' => 'nullable|exists:lib_expense_items,id',
            'details.*.transfer_to_expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.transfer_to_expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.transfer_to_expense_item_id' => 'nullable|exists:lib_expense_items,id',
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

            // Get the default budget for the barangay (first available budget)
            $defaultBudget = Budget::where('barangay_id', $request->user()->barangay_id)
                ->where('current_amount', '>', 0)
                ->first();

            if (!$defaultBudget) {
                return response()->json([
                    'status' => false,
                    'message' => 'No available budget found for augmentation'
                ], 422);
            }

            // Create budget augmentation
            $augmentation = BudgetAugmentation::create([
                'barangay_id' => $request->user()->barangay_id,
                'budget_id' => $defaultBudget->id,
                'ref_number' => $refNumber,
                'augmentation_date' => $request->augmentation_date,
                'total_amount' => $totalAmount,
                'remarks' => $request->remarks,
                'user_id' => $request->user()->id
            ]);

            // Create augmentation details
            foreach ($request->details as $detail) {
                BudgetAugmentationDetail::create([
                    'budget_augmentation_id' => $augmentation->id,
                    'from_expense_class_id' => $detail['from_expense_class_id'],
                    'from_expense_type_id' => $detail['from_expense_type_id'],
                    'from_expense_item_id' => $detail['from_expense_item_id'] ?? null,
                    'transfer_to_expense_class_id' => $detail['transfer_to_expense_class_id'],
                    'transfer_to_expense_type_id' => $detail['transfer_to_expense_type_id'],
                    'transfer_to_expense_item_id' => $detail['transfer_to_expense_item_id'] ?? null,
                    'amount' => $detail['amount'],
                    'particulars' => $detail['particulars'] ?? null
                ]);
            }

            // Update budget augmentation amount
            $defaultBudget->increment('augmentation', $totalAmount);
            $defaultBudget->increment('current_amount', $totalAmount);

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
            'details.fromExpenseClass', 
            'details.fromExpenseType', 
            'details.fromExpenseItem',
            'details.transferToExpenseClass',
            'details.transferToExpenseType',
            'details.transferToExpenseItem'
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
            'details.*.from_expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.from_expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.from_expense_item_id' => 'nullable|exists:lib_expense_items,id',
            'details.*.transfer_to_expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.transfer_to_expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.transfer_to_expense_item_id' => 'nullable|exists:lib_expense_items,id',
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

            // Update budget augmentation
            $augmentation->update([
                'augmentation_date' => $request->augmentation_date,
                'total_amount' => $newTotalAmount,
                'remarks' => $request->remarks
            ]);

            // Delete old details
            $augmentation->details()->delete();

            // Create new details
            foreach ($request->details as $detail) {
                BudgetAugmentationDetail::create([
                    'budget_augmentation_id' => $augmentation->id,
                    'from_expense_class_id' => $detail['from_expense_class_id'],
                    'from_expense_type_id' => $detail['from_expense_type_id'],
                    'from_expense_item_id' => $detail['from_expense_item_id'] ?? null,
                    'transfer_to_expense_class_id' => $detail['transfer_to_expense_class_id'],
                    'transfer_to_expense_type_id' => $detail['transfer_to_expense_type_id'],
                    'transfer_to_expense_item_id' => $detail['transfer_to_expense_item_id'] ?? null,
                    'amount' => $detail['amount'],
                    'particulars' => $detail['particulars'] ?? null
                ]);
            }

            // Update budget amounts
            $budget = $augmentation->budget;
            $budget->decrement('augmentation', $oldTotalAmount);
            $budget->decrement('current_amount', $oldTotalAmount);
            $budget->increment('augmentation', $newTotalAmount);
            $budget->increment('current_amount', $newTotalAmount);

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
            // Update budget amounts
            $budget = $augmentation->budget;
            $budget->decrement('augmentation', $augmentation->total_amount);
            $budget->decrement('current_amount', $augmentation->total_amount);

            // Delete augmentation and details
            $augmentation->delete();

            return response()->json([
                'status' => true,
                'message' => 'Budget augmentation deleted successfully'
            ]);
        });
    }
} 