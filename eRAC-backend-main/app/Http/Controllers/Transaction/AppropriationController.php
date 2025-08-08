<?php
namespace App\Http\Controllers\Transaction;

use App\Http\Controllers\Controller;
use App\Http\Controllers\AdminAuthController;
use App\Models\Budget;
use App\Models\TranAppropriation;
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
        // Log user activity
        if ($request->user()) {
            AdminAuthController::logUserAction($request->user(),'Visited Appropriation Page' ,'Visited Appropriation Page');
        }

        $request->validate([
            'year' => 'nullable|integer',
            'status' => 'nullable|in:draft,committed,reverted',
            'search' => 'nullable|string',
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

                return [
                    'id' => $budget->id,
                    'date' => $budget->created_at->format('Y-m-d'),
                    'description' => $budget->description,
                    'amount' => (float)$budget->original_amount,
                    'unappropriated' => (float)$budget->current_amount,
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
                                        ->sum('current_amount')
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

        return DB::transaction(function () use ($validated, $budget, $totalAllocated) {
            // Delete all old item-level appropriations for this budget
            $budget->tranAppropriations()->whereNotNull('expense_item_id')->delete();

            foreach ($validated['allocations'] as $alloc) {
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
            \Log::info('Barangay ID: ' . $barangayId);

            // Get all budgets for this barangay
            $budgets = Budget::with(['tranAppropriations', 'fiscalYear'])
                ->where('barangay_id', $barangayId)
                ->get();

            \Log::info('Found ' . $budgets->count() . ' budgets');

            // Calculate totals
            $totalAppropriation = $budgets->sum('original_amount');
            $totalObligation = $budgets->sum(function($budget) {
                // Sum all allocations (items, types, and classes)
                return $budget->tranAppropriations->sum('amount');
            });
            $totalBalance = $totalAppropriation - $totalObligation;

            \Log::info('Totals - Appropriation: ' . $totalAppropriation . ', Obligation: ' . $totalObligation . ', Balance: ' . $totalBalance);

            // Get expense hierarchy for pie chart
            $currentYear = now()->year;
            $fiscalYear = LibFiscalYear::where('year', $currentYear)->first();

            \Log::info('Current year: ' . $currentYear . ', Fiscal year found: ' . ($fiscalYear ? 'yes' : 'no'));

            $expenseHierarchy = [];
            if ($fiscalYear) {
                $expenseHierarchy = LibExpenseClass::with(['types.items'])
                    ->where('fiscal_year_id', $fiscalYear->id)
                    ->get()
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
                    'current_fiscal_year' => $currentYear,
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
}
