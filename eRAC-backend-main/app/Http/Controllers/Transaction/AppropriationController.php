<?php
namespace App\Http\Controllers\Transaction;

use App\Http\Controllers\Controller;
use App\Http\Controllers\AdminAuthController;
use App\Models\Budget;
use App\Models\TranAppropriation;
use App\Models\TranExpenseDetail;
use App\Models\LibFiscalYear;
use App\Models\LibExpenseClass;
use App\Models\LibExpenseType;
use App\Models\LibExpenseItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AppropriationController extends Controller
{
    public function index(Request $request)
    {
        // Removed page visit logging as requested

        $request->validate([
            'year' => 'nullable|integer',
            'status' => 'nullable|in:draft,committed,reverted',
            'search' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'barangay_id' => 'nullable|exists:barangays,id'
        ]);

        // Get base query
        $query = Budget::with(['tranAppropriations.expenseType', 'fiscalYear', 'barangay']);
        
        // Check if user is admin (from admin guard) or barangay user with admin role
        $isAdmin = false;
        
        // Try to get admin user first
        try {
            $adminUser = $request->user('admin');
            if ($adminUser) {
                $isAdmin = true;
            }
        } catch (\Exception $e) {
            // Not an admin user, check if barangay user is admin
            $barangayUser = $request->user('barangay');
            if ($barangayUser && $barangayUser->role === 'admin') {
                $isAdmin = true;
            }
        }
        
        // Filter by barangay - admin can view all, regular users only see their barangay
        if ($request->barangay_id && $isAdmin) {
            // Admin can filter by specific barangay
            $query->where('barangay_id', $request->barangay_id);
        } else {
            // Regular users only see their barangay
            $user = $request->user('barangay');
            if ($user) {
                $query->where('barangay_id', $user->barangay_id);
            }
        }

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
                    'barangay_name' => $budget->barangay->name ?? null,
                    'barangay_id' => $budget->barangay_id,
                    'allocations' => $budget->tranAppropriations->map(function($tranAppropriations) {
                        return [
                            'id' => $tranAppropriations->id,
                            'amount' => (float)$tranAppropriations->amount,
                            'expense_type' => $tranAppropriations->expenseType->name ?? null
                        ];
                    })
                ];
            });

        // Calculate total available based on filtered results
        $totalAvailable = $budgets->sum('amount');

        return response()->json([
            'status' => true,
            'data' => $budgets,
            'total_available' => $totalAvailable
        ]);
    }

    /**
     * Admin version of index - can view all barangay budgets
     */
    public function adminIndex(Request $request)
    {
        $request->validate([
            'year' => 'nullable|integer',
            'status' => 'nullable|in:draft,committed,reverted',
            'search' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'barangay_id' => 'nullable|exists:barangays,id'
        ]);

        // Get base query - admin can see all barangays
        $query = Budget::with(['tranAppropriations.expenseType', 'fiscalYear', 'barangay']);
        
        // Filter by specific barangay if requested
        if ($request->barangay_id) {
            $query->where('barangay_id', $request->barangay_id);
        }

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
                    'barangay_name' => $budget->barangay->name ?? null,
                    'barangay_id' => $budget->barangay_id,
                    'allocations' => $budget->tranAppropriations->map(function($tranAppropriations) {
                        return [
                            'id' => $tranAppropriations->id,
                            'amount' => (float)$tranAppropriations->amount,
                            'expense_type' => $tranAppropriations->expenseType->name ?? null
                        ];
                    })
                ];
            });

        // Calculate total available based on filtered results
        $totalAvailable = $budgets->sum('amount');

        return response()->json([
            'status' => true,
            'data' => $budgets,
            'total_available' => $totalAvailable
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
            'original_amount' => 'required|numeric|min:0',
            'barangay_id' => 'nullable|exists:barangays,id'
        ]);

        // Determine barangay_id based on user type
        $barangayId = null;
        if ($request->barangay_id) {
            // Admin user providing barangay_id
            $barangayId = $request->barangay_id;
        } else {
            // Regular user - use their barangay_id
            $barangayId = $request->user()->barangay_id;
        }

        $budget = Budget::create([
            'barangay_id' => $barangayId,
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
            sprintf(
                'Created budget "%s" with amount ₱%s',
                $validated['description'],
                number_format($validated['original_amount'], 2)
            )
        );

        return response()->json($budget, 201);
    }

    // Get expense hierarchy for allocation
    public function getExpenseHierarchy(Request $request)
    {
        $request->validate([
            'fiscal_year_id' => 'nullable|exists:lib_fiscal_years,id',
            'year' => 'nullable|integer|min:2000|max:2100',
            'budget_id' => 'nullable|exists:budgets,id'
        ]);

        $barangayId = $request->user()->barangay_id;
        $budgetId = $request->budget_id;
        $year = $request->input('year');
        $fiscalYearId = $request->input('fiscal_year_id');

        // Determine fiscal year ID from year if not provided
        if (!$fiscalYearId && $year) {
            $fiscalYear = LibFiscalYear::where('barangay_id', $barangayId)
                ->where('year', $year)
                ->first();
            if ($fiscalYear) {
                $fiscalYearId = $fiscalYear->id;
            }
        }

        // If still no fiscal year ID, use current year
        if (!$fiscalYearId) {
            $currentYear = now()->year;
            $fiscalYear = LibFiscalYear::where('barangay_id', $barangayId)
                ->where('year', $currentYear)
                ->first();
            if ($fiscalYear) {
                $fiscalYearId = $fiscalYear->id;
            }
        }

        if (!$fiscalYearId) {
            return response()->json([
                'status' => false,
                'message' => 'No fiscal year found for the specified criteria'
            ], 400);
        }

        $classes = LibExpenseClass::with(['types.items'])
            ->where('fiscal_year_id', $fiscalYearId)
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

    // NEW: Validate that new appropriation amounts are not less than what has already been disbursed
    foreach ($validated['allocations'] as $allocation) {
        // Find the existing allocation to compare amounts
        $existingAllocation = $existingAllocations->first(function($existing) use ($allocation) {
            return $existing->expense_class_id == ($allocation['expense_class_id'] ?? null) &&
                   $existing->expense_type_id == ($allocation['expense_type_id'] ?? null) &&
                   $existing->expense_item_id == ($allocation['expense_item_id'] ?? null);
        });

        if ($existingAllocation) {
            // Calculate how much has been disbursed from this appropriation
            $disbursedAmount = \App\Models\TranExpenseDetail::where('appropriation_id', $existingAllocation->id)
                ->sum('amount');

            // Check if the new amount is less than what has been disbursed
            if ($allocation['amount'] < $disbursedAmount) {
                
                return response()->json([
                    'status' => false,
                    'message' => sprintf(
                        'Cannot reduce appropriation below the disbursed amount. New amount must be at least ₱%s.',
                        number_format($disbursedAmount, 2)
                    )
                ], 422);
            }
        }
    }

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

        // Instead of deleting all existing allocations, update them intelligently
        // This preserves the TranExpenseDetail records that are linked to appropriations
        
        // Create a map of existing allocations for easy lookup
        $existingAllocationMap = [];
        foreach ($existingAllocations as $existing) {
            $key = $this->getAllocationKey($existing);
            $existingAllocationMap[$key] = $existing;
        }

        // Process new allocations
        foreach ($validated['allocations'] as $allocation) {
            $allocationKey = $this->getAllocationKey($allocation);
            
            if (isset($existingAllocationMap[$allocationKey])) {
                // Update existing allocation
                $existingAllocation = $existingAllocationMap[$allocationKey];
                $previousAmount = (float) $existingAllocation->amount;
                $existingAllocation->update([
                    'amount' => $allocation['amount'],
                    'transaction_date' => now(),
                    'status' => 'committed',
                    'user_id' => $request->user()->id,
                ]);
                $appropriations[] = $existingAllocation;
                
                // Remove from map to track which ones were updated
                unset($existingAllocationMap[$allocationKey]);

                // Log edited allocation with previous vs new amount only if amount actually changed
                if (abs($previousAmount - $allocation['amount']) > 0.01) { // Use small threshold for float comparison
                    $identifier = $this->getExpenseIdentifier($allocation);
                    AdminAuthController::logUserAction(
                        $request->user(),
                        'Edited Allocation',
                        sprintf(
                            'Edited allocation %s: from ₱%s to ₱%s for budget "%s"',
                            $identifier,
                            number_format($previousAmount, 2),
                            number_format($allocation['amount'], 2),
                            $budget->description
                        )
                    );
                }
            } else {
                // Create new allocation
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

                // Log committed allocation
                $identifier = $this->getExpenseIdentifier($allocation);
                AdminAuthController::logUserAction(
                    $request->user(),
                    'Committed Allocation',
                    sprintf(
                        'Committed allocation %s: ₱%s for budget "%s"',
                        $identifier,
                        number_format($allocation['amount'], 2),
                        $budget->description
                    )
                );
            }
        }

        // Delete only the allocations that are no longer needed
        // This preserves TranExpenseDetail records for allocations that still exist
        foreach ($existingAllocationMap as $existingAllocation) {
            $existingAllocation->delete();
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

    /**
     * Helper method to get a human-readable identifier for an expense allocation
     */
    private function getExpenseIdentifier($allocation)
    {
        if (isset($allocation['expense_item_id'])) {
            $item = \App\Models\LibExpenseItem::find($allocation['expense_item_id']);
            if ($item) {
                $type = \App\Models\LibExpenseType::find($item->expense_type_id);
                $class = \App\Models\LibExpenseClass::find($item->expense_class_id);
                return sprintf('%s > %s > %s', 
                    $class ? $class->name : 'Unknown Class',
                    $type ? $type->name : 'Unknown Type',
                    $item->name
                );
            }
        } elseif (isset($allocation['expense_type_id'])) {
            $type = \App\Models\LibExpenseType::find($allocation['expense_type_id']);
            if ($type) {
                $class = \App\Models\LibExpenseClass::find($type->expense_class_id);
                return sprintf('%s > %s', 
                    $class ? $class->name : 'Unknown Class',
                    $type->name
                );
            }
        } elseif (isset($allocation['expense_class_id'])) {
            $class = \App\Models\LibExpenseClass::find($allocation['expense_class_id']);
            return $class ? $class->name : 'Unknown Class';
        }
        
        return 'Unknown Expense Account';
    }

    /**
     * Helper method to generate a unique key for an allocation
     */
    private function getAllocationKey($allocation)
    {
        // For arrays (from request)
        if (is_array($allocation)) {
            return sprintf(
                'class_%s_type_%s_item_%s',
                $allocation['expense_class_id'] ?? 'null',
                $allocation['expense_type_id'] ?? 'null',
                $allocation['expense_item_id'] ?? 'null'
            );
        }
        
        // For models (from database)
        return sprintf(
            'class_%s_type_%s_item_%s',
            $allocation->expense_class_id ?? 'null',
            $allocation->expense_type_id ?? 'null',
            $allocation->expense_item_id ?? 'null'
        );
    }

    // In your AppropriationController.php
    public function getBudgetAllocations($budgetId)
    {
        $allocations = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem'])
            ->where('budget_id', $budgetId)
            ->get()
            ->map(function($alloc) {
                return [
                    'expense_item_id' => $alloc->expense_item_id,
                    'expense_type_id' => $alloc->expense_type_id,
                    'expense_class_id' => $alloc->expense_class_id,
                    'expense_class_name' => $alloc->expenseClass->name ?? null,
                    'expense_type_name' => $alloc->expenseType->name ?? null,
                    'expense_item_name' => $alloc->expenseItem->name ?? null,
                    'amount' => (float)$alloc->amount
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $allocations
        ]);
    }

    // Rest of the methods remain the same...
    public function adjustBudget(Request $request, Budget $budget)
    {
        $validated = $request->validate([
            'type' => 'required|in:augmentation,return',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:255'
        ]);

        return DB::transaction(function () use ($validated, $budget) {
            if ($validated['type'] === 'augmentation') {
                $budget->increment('augmentation', $validated['amount']);
                $budget->increment('current_amount', $validated['amount']);
            } else {
                $budget->increment('return_amount', $validated['amount']);
                $budget->decrement('current_amount', $validated['amount']);
            }

            return response()->json($budget);
        });
    }

    public function getAllocationHistory($budgetId)
    {
        try {
            // Get the budget with all related appropriations
            $budget = Budget::with([
                'tranAppropriations' => function($query) {
                    $query->with([
                        'expenseClass:id,name',
                        'expenseType:id,name,expense_class_id',
                        'expenseItem:id,name,expense_type_id'
                    ])->orderBy('created_at', 'desc');
                },
                'fiscalYear'
            ])->findOrFail($budgetId);

            // Use all appropriations (items, types, and classes)
            $allAppropriations = $budget->tranAppropriations;

            // Group by allocation date (session)
            $groupedHistory = $allAppropriations->groupBy(function($item) {
                return $item->created_at->format('Y-m-d H:i:s');
            });

            // Format response with ALL historical records
            $history = $groupedHistory->map(function($allocations, $date) use ($budget) {
                return [
                    'date' => $date,
                    'created_at' => $allocations->first()->created_at,
                    'total_allocated' => $allocations->sum('amount'),
                    'allocations' => $allocations->map(function($alloc) {
                        return [
                            'id' => $alloc->id,
                            'amount' => (float)$alloc->amount,
                            'expense_class_id' => $alloc->expense_class_id,
                            'expense_class_name' => $alloc->expenseClass->name ?? null,
                            'expense_type_id' => $alloc->expense_type_id,
                            'expense_type_name' => $alloc->expenseType->name ?? null,
                            'expense_item_id' => $alloc->expense_item_id,
                            'expense_item_name' => $alloc->expenseItem->name ?? null,
                        ];
                    }),
                    'remaining_unappropriated' => $budget->current_amount
                ];
            })->values();

            return response()->json([
                'status' => true,
                'data' => [
                    'budget' => $budget->only(['id', 'description', 'original_amount', 'current_amount']),
                    'fiscal_year' => $budget->fiscalYear->year ?? null,
                    'history' => $history,
                    'total_allocated_to_date' => $allAppropriations->sum('amount')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch allocation history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateAllocations(Request $request, $budgetId)
    {
        $validated = $request->validate([
            'allocations' => 'required|array',
            'allocations.*.expense_item_id' => 'required|integer|exists:lib_expense_items,id',
            'allocations.*.amount' => 'required|numeric|min:0',
            'allocations.*.expense_class_id' => 'nullable|integer|exists:lib_expense_classes,id',
            'allocations.*.expense_type_id' => 'nullable|integer|exists:lib_expense_types,id',
        ]);

        $budget = \App\Models\Budget::findOrFail($budgetId);

        // NEW: Validate that new appropriation amounts are not less than what has already been disbursed
        foreach ($validated['allocations'] as $allocation) {
            // Find the existing allocation to compare amounts
            $existingAllocation = TranAppropriation::where('budget_id', $budgetId)
                ->where('barangay_id', $request->user()->barangay_id)
                ->where('expense_item_id', $allocation['expense_item_id'])
                ->first();

            if ($existingAllocation) {
                // Calculate how much has been disbursed from this appropriation
                $disbursedAmount = \App\Models\TranExpenseDetail::where('appropriation_id', $existingAllocation->id)
                    ->sum('amount');

                // Check if the new amount is less than what has been disbursed
                if ($allocation['amount'] < $disbursedAmount) {
                    $expenseIdentifier = $this->getExpenseIdentifier($allocation);
                    
                    return response()->json([
                        'status' => false,
                        'message' => sprintf(
                            'Cannot reduce appropriation for %s below ₱%s because ₱%s has already been disbursed. New amount must be at least ₱%s.',
                            $expenseIdentifier,
                            number_format($allocation['amount'], 2),
                            number_format($disbursedAmount, 2),
                            number_format($disbursedAmount, 2)
                        )
                    ], 422);
                }
            }
        }

        // FIXED: Check against current_amount instead of original_amount
        $totalAllocated = array_sum(array_column($validated['allocations'], 'amount'));
        if ($totalAllocated > $budget->current_amount) {
            return response()->json([
                'status' => false,
                'message' => sprintf(
                    'Allocation exceeds available budget by ₱%s. Available: ₱%s, Requested: ₱%s',
                    number_format($totalAllocated - $budget->current_amount, 2),
                    number_format($budget->current_amount, 2),
                    number_format($totalAllocated, 2)
                )
            ], 422);
        }

        return DB::transaction(function () use ($validated, $budget, $totalAllocated, $request) {
            // Get existing item-level appropriations for this budget
            $existingAllocations = $budget->tranAppropriations()
                ->whereNotNull('expense_item_id')
                ->get();

            // Create a map of existing allocations for easy lookup
            $existingAllocationMap = [];
            foreach ($existingAllocations as $existing) {
                $key = $this->getAllocationKey($existing);
                $existingAllocationMap[$key] = $existing;
            }

            // Process new allocations
            foreach ($validated['allocations'] as $alloc) {
                $allocationKey = $this->getAllocationKey($alloc);
                
                if (isset($existingAllocationMap[$allocationKey])) {
                    // Update existing allocation
                    $existingAllocation = $existingAllocationMap[$allocationKey];
                    $previousAmount = (float) $existingAllocation->amount;
                    $existingAllocation->update([
                        'amount' => $alloc['amount'],
                        'transaction_date' => now(),
                        'status' => 'committed',
                        'user_id' => $budget->user_id,
                    ]);
                    // Log edited allocation only if amount actually changed
                    if (abs($previousAmount - $alloc['amount']) > 0.01) { // Use small threshold for float comparison
                        $identifier = $this->getExpenseIdentifier($alloc);
                        AdminAuthController::logUserAction(
                            $request->user(),
                            'Edited Allocation',
                            sprintf(
                                'Edited allocation %s: from ₱%s to ₱%s for budget "%s"',
                                $identifier,
                                number_format($previousAmount, 2),
                                number_format($alloc['amount'], 2),
                                $budget->description
                            )
                        );
                    }
                    
                    // Remove from map to track which ones were updated
                    unset($existingAllocationMap[$allocationKey]);
                } else {
                    // Create new allocation
                    $budget->tranAppropriations()->create([
                        'barangay_id' => $budget->barangay_id,
                        'amount' => $alloc['amount'],
                        'expense_class_id' => $alloc['expense_class_id'] ?? null,
                        'expense_type_id' => $alloc['expense_type_id'] ?? null,
                        'expense_item_id' => $alloc['expense_item_id'],
                        'transaction_date' => now(),
                        'status' => 'committed',
                        'user_id' => $budget->user_id,
                    ]);
                    // Log committed allocation
                    $identifier = $this->getExpenseIdentifier($alloc);
                    AdminAuthController::logUserAction(
                        $request->user(),
                        'Committed Allocation',
                        sprintf(
                            'Committed allocation %s: ₱%s for budget "%s"',
                            $identifier,
                            number_format($alloc['amount'], 2),
                            $budget->description
                        )
                    );
                }
            }

            // Delete only the allocations that are no longer needed
            // This preserves TranExpenseDetail records for allocations that still exist
            foreach ($existingAllocationMap as $existingAllocation) {
                $existingAllocation->delete();
            }

            // Update current_amount by subtracting the total allocated
            $budget->current_amount = $budget->current_amount - $totalAllocated;
            $budget->save();

            return response()->json([
                'status' => true,
                'message' => 'Allocations updated',
                'budget' => $budget->fresh()
            ]);
        });
    }

    public function getDashboardSummary(Request $request)
    {
        try {
            \Log::info('Dashboard summary requested for user: ' . $request->user()->id);

            $barangayId = $request->user()->barangay_id;
            $year = $request->input('year', now()->year); // Default to current year if not specified
            
            \Log::info('Barangay ID: ' . $barangayId . ', Year: ' . $year);

            // Get budgets for this barangay with year filter
            $budgetsQuery = Budget::with(['tranAppropriations', 'fiscalYear'])
                ->where('barangay_id', $barangayId);
            
            if ($year !== 'all') {
                $budgetsQuery->whereHas('fiscalYear', function($q) use ($year) {
                    $q->where('year', $year);
                });
            }
            
            $budgets = $budgetsQuery->get();

            \Log::info('Found ' . $budgets->count() . ' budgets for year ' . $year);

            // Calculate totals
            $totalAppropriation = $budgets->sum('original_amount');
            $totalObligation = $budgets->sum(function($budget) {
                // Sum all allocations (items, types, and classes)
                return $budget->tranAppropriations->sum('amount');
            });
            $totalBalance = $totalAppropriation - $totalObligation;

            \Log::info('Totals - Appropriation: ' . $totalAppropriation . ', Obligation: ' . $totalObligation . ', Balance: ' . $totalBalance);

            // Get expense hierarchy for pie chart
            $fiscalYear = null;
            if ($year !== 'all') {
                $fiscalYear = LibFiscalYear::where('year', $year)->first();
            } else {
                // For "all years", get the most recent fiscal year for structure reference
                $fiscalYear = LibFiscalYear::where('barangay_id', $barangayId)
                    ->orderBy('year', 'desc')
                    ->first();
            }

            \Log::info('Fiscal year found: ' . ($fiscalYear ? 'yes' : 'no'));

            $expenseHierarchy = [];
            if ($fiscalYear) {
                $expenseHierarchyQuery = LibExpenseClass::with(['types.items'])
                    ->where('fiscal_year_id', $fiscalYear->id);
                
                $expenseHierarchy = $expenseHierarchyQuery->get()
                    ->map(function($class) {
                        return [
                            'id' => $class->id,
                            'name' => $class->name,
                            'children' => $class->types->map(function($type) {
                                return [
                                    'id' => $type->id,
                                    'name' => $type->name,
                                    'children' => $type->items->map(function($item) {
                                        return [
                                            'id' => $item->id,
                                            'name' => $item->name,
                                        ];
                                    })
                                ];
                            })
                        ];
                    });
            }

            \Log::info('Expense hierarchy count: ' . count($expenseHierarchy));

            // Calculate class totals for pie chart
            $classTotals = [];
            foreach ($expenseHierarchy as $expenseClass) {
                $classTotal = 0;
                foreach ($budgets as $budget) {
                    // Sum all allocations for this class (type-level and item-level)
                    $classTotal += $budget->tranAppropriations
                        ->where('expense_class_id', $expenseClass['id'])
                        ->sum('amount');
                }
                if ($classTotal > 0) {
                    $classTotals[] = [
                        'id' => $expenseClass['id'],
                        'name' => $expenseClass['name'],
                        'total' => $classTotal
                    ];
                }
            }

            \Log::info('Class totals count: ' . count($classTotals));

            // Get top expense classes by allocation amount
            $topExpenseClasses = collect($classTotals)
                ->sortByDesc('total')
                ->take(5)
                ->values()
                ->all();

            // Get recent allocations (last 10)
            $recentAllocations = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem'])
                ->where('barangay_id', $barangayId)
                ->where('status', 'committed')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function($alloc) {
                    return [
                        'id' => $alloc->id,
                        'amount' => (float)$alloc->amount,
                        'expense_class_name' => $alloc->expenseClass->name ?? 'Unknown',
                        'expense_type_name' => $alloc->expenseType->name ?? 'Unknown',
                        'expense_item_name' => $alloc->expenseItem->name ?? null,
                        'allocation_type' => $alloc->expense_item_id ? 'Item' : 'Type',
                        'created_at' => $alloc->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            // Calculate additional breakdown statistics
            $typeLevelTotal = $budgets->sum(function($budget) {
                return $budget->tranAppropriations
                    ->whereNotNull('expense_type_id')
                    ->whereNull('expense_item_id')
                    ->sum('amount');
            });
            
            $itemLevelTotal = $budgets->sum(function($budget) {
                return $budget->tranAppropriations
                    ->whereNotNull('expense_item_id')
                    ->sum('amount');
            });

            // Calculate additional statistics
            $totalAllocations = $budgets->sum(function($budget) {
                return $budget->tranAppropriations->count();
            });
            
            $typeLevelAllocations = $budgets->sum(function($budget) {
                return $budget->tranAppropriations
                    ->whereNotNull('expense_type_id')
                    ->whereNull('expense_item_id')
                    ->count();
            });
            
            $itemLevelAllocations = $budgets->sum(function($budget) {
                return $budget->tranAppropriations
                    ->whereNotNull('expense_item_id')
                    ->count();
            });

            $averageAllocation = $totalAllocations > 0 ? $totalObligation / $totalAllocations : 0;

            $response = [
                'status' => true,
                'data' => [
                    'summary' => [
                        'total_appropriation' => (float)$totalAppropriation,
                        'total_obligation' => (float)$totalObligation,
                        'total_balance' => (float)$totalBalance,
                        'type_level_total' => (float)$typeLevelTotal,
                        'item_level_total' => (float)$itemLevelTotal,
                        'total_allocations' => (int)$totalAllocations,
                        'type_level_allocations' => (int)$typeLevelAllocations,
                        'item_level_allocations' => (int)$itemLevelAllocations,
                        'average_allocation' => (float)$averageAllocation,
                    ],
                    'pie_chart_data' => [
                        'labels' => array_column($classTotals, 'name'),
                        'data' => array_column($classTotals, 'total'),
                    ],
                    'top_expense_classes' => $topExpenseClasses,
                    'recent_allocations' => $recentAllocations,
                    'budgets_count' => $budgets->count(),
                    'selected_year' => $year,
                    'fiscal_year_id' => $fiscalYear ? $fiscalYear->id : null,
                    'fiscal_year_name' => $fiscalYear ? $fiscalYear->year : null,
                ]
            ];

            \Log::info('Dashboard response prepared', $response);

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Dashboard summary error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Error fetching dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appropriations for augmentation (returns appropriations grouped by expense hierarchy)
     */
    public function getAppropriationsForAugmentation(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:draft,committed,reverted',
            'fiscal_year_id' => 'nullable|exists:lib_fiscal_years,id'
        ]);

        $barangayId = $request->user()->barangay_id;
        $status = $request->status ?? 'committed';

        $query = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem'])
            ->where('barangay_id', $barangayId)
            ->where('status', $status);

        if ($request->fiscal_year_id) {
            $query->whereHas('budget', function($q) use ($request) {
                $q->where('fiscal_year_id', $request->fiscal_year_id);
            });
        }

        $appropriations = $query->get();

        // Group appropriations by expense hierarchy (class, type, item)
        $groupedAppropriations = [];
        
        foreach ($appropriations as $appropriation) {
            // Create a unique key for grouping
            $key = $appropriation->expense_class_id . '_' . 
                   ($appropriation->expense_type_id ?? 'null') . '_' . 
                   ($appropriation->expense_item_id ?? 'null');
            
            if (!isset($groupedAppropriations[$key])) {
                // Build account name
                $accountParts = [];
                if ($appropriation->expenseClass) {
                    $accountParts[] = $appropriation->expenseClass->name;
                }
                if ($appropriation->expenseType) {
                    $accountParts[] = $appropriation->expenseType->name;
                }
                if ($appropriation->expenseItem) {
                    $accountParts[] = $appropriation->expenseItem->name;
                }
                
                $accountName = implode(' > ', $accountParts);

                // Get all appropriations with the same expense hierarchy
                $matchingAppropriations = $appropriations->filter(function($appr) use ($appropriation) {
                    return $appr->expense_class_id === $appropriation->expense_class_id &&
                           $appr->expense_type_id === $appropriation->expense_type_id &&
                           $appr->expense_item_id === $appropriation->expense_item_id;
                });

                // Calculate total amount and get the first appropriation ID for reference
                $totalAmount = $matchingAppropriations->sum('amount');
                $firstAppropriation = $matchingAppropriations->first();

                $groupedAppropriations[$key] = [
                    'id' => $firstAppropriation->id, // Use first appropriation ID as reference
                    'account_name' => $accountName,
                    'amount' => (float)$totalAmount,
                    'expense_class_id' => $appropriation->expense_class_id,
                    'expense_type_id' => $appropriation->expense_type_id,
                    'expense_item_id' => $appropriation->expense_item_id,
                    'budget_id' => $firstAppropriation->budget_id,
                    'status' => $appropriation->status,
                    'created_at' => $firstAppropriation->created_at->format('Y-m-d'),
                    'appropriation_ids' => $matchingAppropriations->pluck('id')->toArray() // Store all IDs for reference
                ];
            }
        }

        // Convert to array and sort by appropriation ID
        $result = array_values($groupedAppropriations);
        usort($result, function($a, $b) {
            return $a['id'] - $b['id'];
        });

        return response()->json([
            'status' => true,
            'data' => $result
        ]);
    }
}
