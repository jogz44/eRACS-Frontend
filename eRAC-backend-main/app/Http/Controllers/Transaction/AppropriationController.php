<?php
namespace App\Http\Controllers\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Http\Controllers\AdminAuthController;
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

        return response()->json($budget, 201);
    }

        // Get expense hierarchy for allocation
        public function getExpenseHierarchy(Request $request)
        {
            $request->validate([
            'fiscal_year_id' => 'required|exists:lib_fiscal_years,id'
        ]);

            $classes = LibExpenseClass::with(['types.items'])
                ->where('fiscal_year_id', $request->fiscal_year_id)
                ->get()
                ->map(function($class) {
                    return [
                        'id' => $class->id,
                        'name' => $class->name,
                        'isMainCategory' => true,
                        'children' => $class->types->map(function($type) {
                            return [
                                'id' => $type->id,
                                'name' => $type->name,
                                'isMainCategory' => false,
                                'children' => $type->items->map(function($item) {
                                    return [
                                        'id' => $item->id,
                                        'name' => $item->name,
                                        'isMainCategory' => false,
                                        'amount' => null
                                    ];
                                })
                            ];
                        })
                    ];
                });

            return response()->json($classes);
        }



        // Save allocation from modal
public function saveAllocation(Request $request, Budget $budget)
{
    $validated = $request->validate([
        'allocations' => 'required|array',
        'allocations.*.id' => 'required',
        'allocations.*.type' => 'required|in:class,type,item',
        'allocations.*.amount' => 'required|numeric|min:0'
    ]);

    // 1. Calculate current total allocated for this budget
    $currentAllocated = TranAppropriation::where('budget_id', $budget->id)->sum('amount');

    // 2. Calculate the total of the new allocations in this request
    $newTotal = $currentAllocated;
    foreach ($validated['allocations'] as $allocation) {
        $newTotal += $allocation['amount'];
    }

    // 3. Check if this would exceed the budget
    if ($newTotal > $budget->original_amount) {
        return response()->json([
            'status' => false,
            'message' => 'Allocation exceeds the available budget. Please adjust your amounts.'
        ], 422);
    }

    return DB::transaction(function () use ($validated, $budget, $request) {
        $totalAllocated = 0;
        $totalAdjustment = 0; // Tracks net changes to existing allocations
        $appropriations = [];

        // First get all existing appropriations for this budget
        $existingAppropriations = TranAppropriation::where('budget_id', $budget->id)
            ->where('barangay_id', $request->user()->barangay_id)
            ->get();

        foreach ($validated['allocations'] as $allocation) {
            $query = clone $existingAppropriations;

            // Filter by type and id
            switch ($allocation['type']) {
                case 'class':
                    $query = $query->where('expense_class_id', $allocation['id']);
                    break;
                case 'type':
                    $query = $query->where('expense_type_id', $allocation['id']);
                    break;
                case 'item':
                    $query = $query->where('expense_item_id', $allocation['id']);
                    break;
            }

            $existing = $query->first();

            $appropriationData = [
                'barangay_id' => $request->user()->barangay_id,
                'budget_id' => $budget->id,
                'amount' => $allocation['amount'],
                'transaction_date' => now(),
                'status' => 'committed',
                'user_id' => $request->user()->id
            ];

            // Set the appropriate expense field
            $field = match($allocation['type']) {
                'class' => 'expense_class_id',
                'type' => 'expense_type_id',
                'item' => 'expense_item_id',
            };
            $appropriationData[$field] = $allocation['id'];

            if ($existing) {
                // Calculate the difference from previous amount
                $amountDifference = $allocation['amount'] - $existing->amount;
                $totalAdjustment += $amountDifference;

                // Update existing record
                $existing->update($appropriationData);
                $appropriations[] = $existing;
            } else {
                // New allocation - add to total
                $totalAllocated += $allocation['amount'];
                $appropriations[] = TranAppropriation::create($appropriationData);
            }
        }

        // Calculate net change (new allocations + adjustments to existing ones)
        $netChange = $totalAllocated + $totalAdjustment;

        // Update the budget's current amount
        if ($netChange != 0) {
            $budget->decrement('current_amount', $netChange);
        }

        // If all allocations are removed, restore original amount
        if (empty($validated['allocations'])) {
            $budget->update(['current_amount' => $budget->original_amount]);
        }

        $budget->refresh();

        return response()->json([
            'budget' => $budget,
            'appropriations' => $appropriations,
            'total_allocated' => $totalAllocated + $totalAdjustment
        ]);
    });
}

// In your AppropriationController.php
    public function getBudgetAllocations($budgetId)
    {
        $allocations = TranAppropriation::where('budget_id', $budgetId)
            ->get()
            ->map(function($alloc) {
                return [
                    'expense_item_id' => $alloc->expense_item_id,
                    'expense_type_id' => $alloc->expense_type_id,
                    'amount' => $alloc->amount
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $allocations
        ]);
    }

        // Adjust budget (augmentation/return)
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

        // Add this method to your AppropriationController
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
                        ])->orderBy ('created_at', 'desc');
                    },
                    'fiscalYear'
                ])->findOrFail($budgetId);

                // Only use allocations for items
                $itemAppropriations = $budget->tranAppropriations->whereNotNull('expense_item_id');

                // Group by allocation date (session)
                $groupedHistory = $itemAppropriations->groupBy(function($item) {
                    return $item->created_at->format('Y-m-d H:i:s');
                });

                // Format response with ALL historical records
                $history = $groupedHistory->map(function($allocations, $date) use ($budget) {
                    return [
                        'date' => $date,
                        'created_at' => $allocations->first()->created_at,
                        'total_allocated' => $allocations->sum('amount'),
                        'allocations' => $allocations->map(function($alloc) {
                            // Get hierarchy info
                            $expenseClass = $alloc->expenseClass ??
                                           ($alloc->expenseType->expenseClass ??
                                           ($alloc->expenseItem->expenseType->expenseClass ?? null));

                            $expenseType = $alloc->expenseType ??
                                          ($alloc->expenseItem->expenseType ?? null);

                            return [
                                'id' => $alloc->id,
                                'amount' => (float)$alloc->amount,
                                'expense_class_id' => $expenseClass->id ?? null,
                                'expense_class_name' => $expenseClass->name ?? null,
                                'expense_type_id' => $expenseType->id ?? null,
                                'expense_type_name' => $expenseType->name ?? null,
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
                        'total_allocated_to_date' => $itemAppropriations->sum('amount')
                    ]
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'status' => false,
                    'message' => 'Failed to fetch allocation history: ' . $e->getMessage()
                ], 500);
            }
        }

    // Add this method to your AppropriationController
    public function updateAllocations(Request $request, $budgetId)
    {
        $validated = $request->validate([
            'allocations' => 'required|array',
            'allocations.*.expense_item_id' => 'required|integer|exists:lib_expense_items,id',
            'allocations.*.amount' => 'required|numeric|min:0',
        ]);

        $budget = \App\Models\Budget::findOrFail($budgetId);

        // Prevent over-allocation
        $totalAllocated = array_sum(array_column($validated['allocations'], 'amount'));
        if ($totalAllocated > $budget->original_amount) {
            return response()->json([
                'status' => false,
                'message' => 'Allocation exceeds the available budget. Please adjust your amounts.'
            ], 422);
        }

        return DB::transaction(function () use ($validated, $budget) {
            // Delete all old item-level appropriations for this budget
            $budget->tranAppropriations()->whereNotNull('expense_item_id')->delete();

            $totalAllocated = 0;
            foreach ($validated['allocations'] as $alloc) {
                $budget->tranAppropriations()->create([
                    'barangay_id' => $budget->barangay_id,
                    'amount' => $alloc['amount'],
                    'expense_item_id' => $alloc['expense_item_id'],
                    'transaction_date' => now(),
                    'status' => 'committed',
                    'user_id' => $budget->user_id,
                ]);
                $totalAllocated += $alloc['amount'];
            }
            // Update current_amount
            $budget->current_amount = $budget->original_amount - $totalAllocated;
            $budget->save();
            return response()->json(['status' => true, 'message' => 'Allocations updated', 'budget' => $budget]);
        });
        }

    // Add this method to your AppropriationController
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
                // Only sum allocations for items
                return $budget->tranAppropriations->whereNotNull('expense_item_id')->sum('amount');
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
                    // Only sum allocations for items under this class
                    foreach ($expenseClass['children'] as $expenseType) {
                        foreach ($expenseType['children'] as $expenseItem) {
                            $classTotal += $budget->tranAppropriations
                                ->where('expense_item_id', $expenseItem['id'])
                                ->sum('amount');
                        }
                    }
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

            $response = [
                'status' => true,
                'data' => [
                    'summary' => [
                        'total_appropriation' => (float)$totalAppropriation,
                        'total_obligation' => (float)$totalObligation,
                        'total_balance' => (float)$totalBalance,
                    ],
                    'pie_chart_data' => [
                        'labels' => array_column($classTotals, 'name'),
                        'data' => array_column($classTotals, 'total'),
                    ],
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
