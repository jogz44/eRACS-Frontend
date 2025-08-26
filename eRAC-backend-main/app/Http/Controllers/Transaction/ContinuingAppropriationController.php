<?php
namespace App\Http\Controllers\Transaction;

use App\Http\Controllers\Controller;
use App\Http\Controllers\AdminAuthController;
use App\Models\Budget;
use App\Models\TranAppropriation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContinuingAppropriationController extends Controller
{
    public function index(Request $request)
    {
        // Log user activity
        if ($request->user()) {
            AdminAuthController::logUserAction($request->user(),'Visited Appropriation Page' ,'Visited Appropriation Page');
        }

        $request->validate([
            'year' => 'nullable|integer',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from'
        ]);

        // Get base query
        $query = Budget::with(['tranAppropriations.expenseType', 'fiscalYear'])
            ->where('barangay_id', $request->user()->barangay_id);

        // Apply year filter
        if ($request->year) {
            $query->whereHas('fiscalYear', function($q) use ($request) {
                $q->where('year', $request->year);
            });
        }

        // Apply other filters
        if ($request->search) {
            $query->where('description', 'like', '%'.$request->search.'%');
        }

        if ($request->date_from) {
            $query->where('start_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('end_date', '<=', $request->date_to);
        }

        // Get budgets with their total appropriations
        $budgets = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function($budget) {
                $hasAllocations = $budget->tranAppropriations->isNotEmpty();
                
                // Calculate total available budget (original + augmentation)
                $totalAvailable = (float)$budget->original_amount + (float)$budget->augmentation;
                
                // Calculate total appropriated amount
                $totalAppropriated = $budget->tranAppropriations->sum('amount');
                
                // Calculate unappropriated amount
                $unappropriated = $totalAvailable - $totalAppropriated;
                


                return [
                    'id' => $budget->id,
                    'date' => $budget->created_at->format('Y-m-d'),
                    'description' => $budget->description,
                    'amount' => $totalAvailable,
                    'unappropriated' => $unappropriated,
                    'fiscal_year' => $budget->fiscalYear->year,
                    'allocations' => $budget->tranAppropriations->map(function($tranAppropriations) {
                        return [
                            'id' => $tranAppropriations->id,
                            'amount' => (float)$tranAppropriations->amount,
                            'expense_type' => $tranAppropriations->expenseType->name ?? null
                        ];
                    })
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $budgets,
            'total_available' => (float)Budget::where('barangay_id', $request->user()->barangay_id)
                                        ->get()
                                        ->sum(function($budget) {
                                            return (float)$budget->original_amount + (float)$budget->augmentation;
                                        })
        ]);
    }

    /**
     * Create a new budget without initial appropriations
     */
    public function storeBudget(Request $request)
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:lib_fiscal_years,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'required|string|max:255',
            'original_amount' => 'required|numeric|min:0'
        ]);

        $budget = Budget::create([
            'barangay_id' => $request->user()->barangay_id,
            'fiscal_year_id' => $validated['fiscal_year_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'description' => $validated['description'],
            'original_amount' => $validated['original_amount'],
            'current_amount' => $validated['original_amount'], // Initialize with full amount
            'augmentation' => 0, // Initialize augmentation to 0
            'user_id' => $request->user()->id
        ]);

        // Log the budget creation
        AdminAuthController::logUserAction(
            $request->user(),
            'Created Budget',
            "Created new budget with amount ₱" . number_format($validated['original_amount'], 2) . " - " . $validated['description']
        );

        return response()->json($budget, 201);
    }

    // Get expense hierarchy for allocation
    public function getExpenseHierarchy(Request $request)
    {
        $request->validate([
            'fiscal_year_id' => 'required|exists:lib_fiscal_years,id',
            'budget_id' => 'nullable|exists:budgets,id'
        ]);

        $barangayId = $request->user()->barangay_id;
        $budgetId = $request->budget_id;

        $classes = LibExpenseClass::with(['types.items'])
            ->where('fiscal_year_id', $request->fiscal_year_id)
            ->get()
            ->map(function($class) use ($barangayId, $budgetId) {
                // Calculate allocated amount for this expense class
                $classQuery = TranAppropriation::where('barangay_id', $barangayId)
                    ->where('expense_class_id', $class->id)
                    ->where('status', 'committed');

                if ($budgetId) {
                    $classQuery->where('budget_id', $budgetId);
                }

                $classAllocatedAmount = $classQuery->sum('amount');

                return [
                    'id' => $class->id,
                    'name' => $class->name,
                    'isMainCategory' => true,
                    'amount' => (float) $classAllocatedAmount,
                    'children' => $class->types->map(function($type) use ($barangayId, $budgetId) {
                        // Calculate allocated amount for this expense type
                        $typeQuery = TranAppropriation::where('barangay_id', $barangayId)
                            ->where('expense_type_id', $type->id)
                            ->where('status', 'committed');

                        if ($budgetId) {
                            $typeQuery->where('budget_id', $budgetId);
                        }

                        $typeAllocatedAmount = $typeQuery->sum('amount');

                        return [
                            'id' => $type->id,
                            'name' => $type->name,
                            'isMainCategory' => false,
                            'amount' => (float) $typeAllocatedAmount,
                            'children' => $type->items->map(function($item) use ($barangayId, $budgetId) {
                                // Get the allocated amount for this expense item
                                $query = TranAppropriation::where('barangay_id', $barangayId)
                                    ->where('expense_item_id', $item->id)
                                    ->where('status', 'committed');

                                // If budget_id is provided, filter by that specific budget
                                if ($budgetId) {
                                    $query->where('budget_id', $budgetId);
                                }

                                $allocatedAmount = $query->sum('amount');

                                return [
                                    'id' => $item->id,
                                    'name' => $item->name,
                                    'isMainCategory' => false,
                                    'amount' => (float) $allocatedAmount
                                ];
                            })
                        ];
                    })
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $classes
        ]);
    }

    // FIXED: Save allocation from modal - this is the key fix
    public function saveAllocation(Request $request, Budget $budget)
    {
       $validated = $request->validate([
        'allocations' => 'required|array',
        'allocations.*.id' => 'required',
        'allocations.*.type' => 'required|in:class,type,item',
        'allocations.*.amount' => 'required|numeric|min:0',
        'allocations.*.expense_class_id' => 'nullable|integer|exists:lib_expense_classes,id',
        'allocations.*.expense_type_id' => 'nullable|integer|exists:lib_expense_types,id',
        'allocations.*.expense_item_id' => 'nullable|integer|exists:lib_expense_items,id'
    ]);

    // Get existing allocations for this budget
    $existingAllocations = TranAppropriation::where('budget_id', $budget->id)
        ->where('barangay_id', $request->user()->barangay_id)
        ->get();

    $existingTotal = $existingAllocations->sum('amount');

    // Calculate total of new allocations
    $newTotal = array_sum(array_column($validated['allocations'], 'amount'));

    // Calculate net change (new total - existing total)
    $netChange = $newTotal - $existingTotal;

    \Log::info('Allocation validation', [
        'budget_id' => $budget->id,
        'budget_current_amount' => $budget->current_amount,
        'existing_total' => $existingTotal,
        'new_total' => $newTotal,
        'net_change' => $netChange,
        'allocations' => $validated['allocations']
    ]);

    // FIXED: Check net change against current_amount (available budget)
    if ($netChange > $budget->current_amount) {
        \Log::warning('Net change exceeds available budget', [
            'net_change' => $netChange,
            'available_budget' => $budget->current_amount,
            'difference' => $netChange - $budget->current_amount
        ]);

        return response()->json([
            'status' => false,
            'message' => sprintf(
                'Net change exceeds available budget by ₱%s. Available: ₱%s, Net Change: ₱%s',
                number_format($netChange - $budget->current_amount, 2),
                number_format($budget->current_amount, 2),
                number_format($netChange, 2)
            )
        ], 422);
    }

    return DB::transaction(function () use ($validated, $budget, $request, $netChange, $existingAllocations) {
        $appropriations = [];

        // Delete existing allocations for this budget
        $existingAllocations->each->delete();

        // Create new allocations
        foreach ($validated['allocations'] as $allocation) {
            $appropriationData = [
                'barangay_id' => $request->user()->barangay_id,
                'budget_id' => $budget->id,
                'amount' => $allocation['amount'],
                'transaction_date' => now(),
                'status' => 'committed',
                'user_id' => $request->user()->id,
                'expense_class_id' => $allocation['expense_class_id'] ?? null,
                'expense_type_id' => $allocation['expense_type_id'] ?? null,
                'expense_item_id' => $allocation['expense_item_id'] ?? null
            ];

            $appropriations[] = TranAppropriation::create($appropriationData);

            AdminAuthController::logUserAction(
                $request->user(),
                'Updated Appropriation',
                "Set appropriation amount to ₱" . number_format($allocation['amount'], 2) .
                " for budget: " . $budget->description
            );
        }

        // Update budget's current amount by the net change
        $budget->current_amount = $budget->current_amount - $netChange;
        $budget->save();

        \Log::info('Budget updated after allocation', [
            'budget_id' => $budget->id,
            'new_current_amount' => $budget->current_amount,
            'net_change' => $netChange
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Allocation saved successfully',
            'budget' => $budget->fresh(),
            'appropriations' => $appropriations,
            'net_change' => $netChange,
            'updated_amount' => $budget->current_amount
        ]);
    });
}
}
