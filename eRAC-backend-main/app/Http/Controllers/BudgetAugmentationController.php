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
     * Display a listing of budget augmentations
     */
    public function index(Request $request)
    {
        $query = BudgetAugmentation::with(['budget', 'details.expenseClass', 'details.expenseType', 'details.expenseItem'])
            ->forBarangay($request->user()->barangay_id);

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
                    'budget_description' => $augmentation->budget->description ?? '',
                    'details' => $augmentation->details->map(function($detail) {
                        return [
                            'id' => $detail->id,
                            'account' => ($detail->expenseClass->name ?? '') . ' > ' . ($detail->expenseType->name ?? '') . ' > ' . ($detail->expenseItem->name ?? ''),
                            'expense_class' => $detail->expenseClass->name ?? '',
                            'expense_type' => $detail->expenseType->name ?? '',
                            'expense_item' => $detail->expenseItem->name ?? '',
                            'amount' => (float)$detail->amount,
                            'particulars' => $detail->particulars
                        ];
                    })
                ];
            })
        ]);
    }

    /**
     * Store a newly created budget augmentation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'budget_id' => 'required|exists:budgets,id',
            'augmentation_date' => 'required|date',
            'remarks' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.expense_item_id' => 'required|exists:lib_expense_items,id',
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

            // Create budget augmentation
            $augmentation = BudgetAugmentation::create([
                'barangay_id' => $request->user()->barangay_id,
                'budget_id' => $request->budget_id,
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
                    'expense_class_id' => $detail['expense_class_id'],
                    'expense_type_id' => $detail['expense_type_id'],
                    'expense_item_id' => $detail['expense_item_id'],
                    'amount' => $detail['amount'],
                    'particulars' => $detail['particulars'] ?? null
                ]);
            }

            // Update budget augmentation amount
            $budget = Budget::find($request->budget_id);
            $budget->increment('augmentation', $totalAmount);
            $budget->increment('current_amount', $totalAmount);

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
        $augmentation = BudgetAugmentation::with(['budget', 'details.expenseClass', 'details.expenseType', 'details.expenseItem'])
            ->findOrFail($id);

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
                    return [
                        'id' => $detail->id,
                        'account' => ($detail->expenseClass->name ?? '') . ' > ' . ($detail->expenseType->name ?? '') . ' > ' . ($detail->expenseItem->name ?? ''),
                        'expense_class_id' => $detail->expense_class_id,
                        'expense_type_id' => $detail->expense_type_id,
                        'expense_item_id' => $detail->expense_item_id,
                        'expense_class' => $detail->expenseClass->name ?? '',
                        'expense_type' => $detail->expenseType->name ?? '',
                        'expense_item' => $detail->expenseItem->name ?? '',
                        'amount' => (float)$detail->amount,
                        'particulars' => $detail->particulars
                    ];
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
            'details.*.expense_class_id' => 'required|exists:lib_expense_classes,id',
            'details.*.expense_type_id' => 'required|exists:lib_expense_types,id',
            'details.*.expense_item_id' => 'required|exists:lib_expense_items,id',
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
                    'expense_class_id' => $detail['expense_class_id'],
                    'expense_type_id' => $detail['expense_type_id'],
                    'expense_item_id' => $detail['expense_item_id'],
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

    /**
     * Get available budgets for augmentation
     */
    public function getAvailableBudgets(Request $request)
    {
        $budgets = Budget::where('barangay_id', $request->user()->barangay_id)
            ->where('current_amount', '>', 0)
            ->get()
            ->map(function($budget) {
                return [
                    'id' => $budget->id,
                    'description' => $budget->description,
                    'current_amount' => (float)$budget->current_amount,
                    'fiscal_year' => $budget->fiscalYear->year ?? ''
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $budgets
        ]);
    }
} 