<?php

namespace App\Http\Controllers\Library;

use App\Http\Controllers\Controller;
use App\Models\LibFiscalYear;
use App\Models\LibExpense;
use App\Models\LibExpenseClass;
use App\Models\LibExpenseItem;
use App\Models\LibExpenseType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Http\Controllers\AdminAuthController;
use App\Models\BarangayUser;

class AccountsLibController extends Controller
{
   protected function verifyBarangayAccess()
{
    // No parameter needed since we'll get it from Auth
    $barangayId = Auth::user()->barangay_id;

    if (!$barangayId) {
        abort(403, 'User is not associated with any barangay');
    }
}

// Get all fiscal years for current barangay
public function getFiscalYears()
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    return response()->json(
        LibFiscalYear::where('barangay_id', $barangayId)
            ->orderBy('year', 'desc')
            ->get()
    );
}


public function createFiscalYear(Request $request)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'year' => [
            'required',
            'digits:4',
            Rule::unique('lib_fiscal_years')->where(function ($query) use ($barangayId) {
                return $query->where('barangay_id', $barangayId);
            })
        ]
    ]);

    $year = LibFiscalYear::create([
        'barangay_id' => $barangayId,
        'year' => $validated['year'],
        'is_active' => false,
        // Add this to ensure created_at is set
        'created_at' => now()
    ]);
    
    $classes = [
        ['name' => 'SANGUNIANG KABATAAN (SK) - 10%',                   'order' => 0],
        ['name' => 'PERSONAL SERVICES',                                'order' => 1],
        ['name' => 'MOOE',                                             'order' => 2],
        ['name' => 'LOCALLY FUNDED PROJECTS',                          'order' => 3],
        ['name' => 'CAPITAL OUTLAY',                                   'order' => 4],
        ['name' => 'BRGY. DISASTER RISK REDUCTION AND MANAGEMENT FUND','order' => 5],
        ['name' => '20% DEVELOPMENT FUND',                             'order' => 6],
    ];

    $typesMap = [
        'SANGUNIANG KABATAAN (SK) - 10%' => [
            ['name' => 'MOOE', 'order' => 0],
            ['name' => 'LOCALLY FUNDED PROGRAM', 'order' => 1],
            ['name' => 'CAPITAL OUTLAY', 'order' => 2],
        ],
        'PERSONAL SERVICES' => [
            ['name' => 'Honorarium', 'order' => 0],
            ['name' => 'Cash Gift', 'order' => 1],
            ['name' => 'Leave Credit Benefits', 'order' => 2],
            ['name' => 'Year-End Bonus', 'order' => 3],
            ['name' => 'MID-YEAR BONUS', 'order' => 4],
            ['name' => 'Productivity Enhancement Incentive (PEI)', 'order' => 5],
        ],
        'MOOE' => [
            ['name' => 'Travelling Expenses', 'order' => 0],
            ['name' => 'Training Expense', 'order' => 1],
            ['name' => 'Office Supplies', 'order' => 2],
            ['name' => 'Utitlity Expenses', 'order' => 3],
            ['name' => 'Membership Dues & Contribution to Organization', 'order' => 4],
            ['name' => 'Repair & Maintenance - Vehicles', 'order' => 5],
            ['name' => 'Fuel & Lubricants', 'order' => 6],
            ['name' => 'Repair & Maintenance of Government Facilities', 'order' => 7],
            ['name' => 'Financial Assistance for Brgy. Functionaries', 'order' => 8],
            ['name' => 'Fidelity Bond', 'order' => 9],
            ['name' => 'Subscription Expense', 'order' => 10],
            ['name' => 'Repair of Office Equipment', 'order' => 11],
            ['name' => 'Rent Expense', 'order' => 12],
            ['name' => 'Cable, satellite, telegraph & radio expense', 'order' => 13],
            ['name' => 'Extraordinary Expense', 'order' => 14],
            ['name' => 'Repair & maint. of other Public Infrastructure', 'order' => 15],
            ['name' => 'Accountable Forms Expense', 'order' => 16],
            ['name' => 'Auditing Services', 'order' => 17],
            ['name' => 'Insurance Premium', 'order' => 18],
            ['name' => 'Other MOE', 'order' => 19],
        ],
        'LOCALLY FUNDED PROJECTS' => [
            ['name' => 'Maint. of Peace & Order', 'order' => 0],
            ['name' => 'Environmental Sanitary Program', 'order' => 1],
            ['name' => 'Senior Citizen', 'order' => 2],
            ['name' => 'Health Program', 'order' => 3],
            ['name' => 'Nutrition Program', 'order' => 4],
            ['name' => 'Anti-Rabies Program', 'order' => 5],
            ['name' => 'Lupong Tagapamayapa Program', 'order' => 6],
            ['name' => 'Purok Affairs Program', 'order' => 7],
            ['name' => 'Welfare for Disabled Person', 'order' => 8],
            ['name' => 'HIV/AIDS Awareness', 'order' => 9],
            ['name' => 'Daycare Program', 'order' => 10],
            ['name' => 'Bloodletting Program', 'order' => 11],
            ['name' => 'Livelihood Program (GAD)', 'order' => 12],
            ['name' => 'Electrification Maintenance Program (GAD)', 'order' => 13],
            ['name' => 'VAW Program and Human Rights Program (GAD)', 'order' => 14],
            ['name' => 'Job Fair Program (GAD)', 'order' => 15],
            ['name' => 'Gender and Development Program (GAD)', 'order' => 16],
        ],
        'CAPITAL OUTLAY' => [
            ['name' => 'Bundy Clock', 'order' => 0],
            ['name' => 'IT Equipments', 'order' => 1],
        ],
        'BRGY. DISASTER RISK REDUCTION AND MANAGEMENT FUND (BDRRMF) - 5%' => [
            ['name' => 'Pre & Post Disaster Fund', 'order' => 0],
            ['name' => 'Quick Reponse Fund (QRF)', 'order' => 1],
        ],
        '20% DEVELOPMENT FUND' => [
            ['name' => 'Maintenance of streetlights', 'order' => 0],
            ['name' => 'Construction of Drainage (Prk. 1 & 3A)', 'order' => 1],
            ['name' => 'Construction of Solar Dryer', 'order' => 2],
            ['name' => 'Fabrication of Steel Gate', 'order' => 3],
            ['name' => 'Roof Painting of Multi-Purpose Bldg.', 'order' => 4],
            ['name' => 'Construction of Nursery', 'order' => 5],
            ['name' => 'Maintenance of Roads', 'order' => 6],
        ],
    ];

    $now = now();
    

    foreach ($classes as $class) {
        $classModel = LibExpenseClass::firstOrCreate(
            [
                'barangay_id'    => $barangayId,
                'fiscal_year_id' => $year->id,
                'name'           => $class['name'],
            ],
            [
                'order'      => $class['order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $types = $typesMap[$class['name']] ?? [];
        foreach ($types as $type) {
            LibExpenseType::firstOrCreate(
                [
                    'expense_class_id' => $classModel->id,
                    'name'             => $type['name'],
                ],
                [
                    'order'      => $type['order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }


    return response()->json($year, 201);
}

// Copy fiscal year data
  // Add this to your ExpenseClassController.php
public function copyToYear(Request $request, $sourceYearId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $request->validate([
        'target_year_id' => 'required|exists:lib_fiscal_years,id',
        'class_ids' => 'required|array',
        'class_ids.*' => 'exists:lib_expense_classes,id,fiscal_year_id,'.$sourceYearId
    ]);

    DB::beginTransaction();
    try {
        \Log::info('Starting year copy', [
            'source_year_id' => $sourceYearId,
            'target_year_id' => $request->target_year_id,
            'class_ids' => $request->class_ids
        ]);

        $stats = [
            'copied_classes' => 0,
            'copied_types' => 0,
            'skipped_classes' => 0,
            'skipped_types' => 0
        ];

        foreach ($request->class_ids as $classId) {
            $sourceClass = LibExpenseClass::with('types')
                ->where('fiscal_year_id', $sourceYearId)
                ->findOrFail($classId);

            // Check for duplicate class name in target year
            if (LibExpenseClass::where('fiscal_year_id', $request->target_year_id)
                ->where('name', $sourceClass->name)
                ->exists()) {
                $stats['skipped_classes']++;
                continue;
            }

            // Copy class
            $newClass = $sourceClass->replicate();
            $newClass->fiscal_year_id = $request->target_year_id;
            $newClass->save();
            $stats['copied_classes']++;

            // Copy types
            foreach ($sourceClass->types as $type) {
                if (LibExpenseType::where('expense_class_id', $newClass->id)
                    ->where('name', $type->name)
                    ->exists()) {
                    $stats['skipped_types']++;
                    continue;
                }

                $newType = $type->replicate();
                $newType->expense_class_id = $newClass->id;
                $newType->save();
                $stats['copied_types']++;
            }
        }

        DB::commit();

         \Log::info('Copy completed successfully', [
            'stats' => $stats,
            'response_data' => [
                'success' => true,
                'message' => 'Copy completed successfully',
                'stats' => $stats
            ]
        ]);
        $sourceYear  = \App\Models\LibFiscalYear::findOrFail($sourceYearId);
        $targetYear  = \App\Models\LibFiscalYear::findOrFail($request->input('target_year_id'));

        AdminAuthController::logUserAction(
            Auth::guard('barangay')->user(),
            'Accounts -> Copy to Year',
            "Copied selected classes from fiscal year {$sourceYear->year} to fiscal year {$targetYear->year}"
        );
        return response()->json([
            'success' => true,
            'message' => 'Copy completed successfully',
            'stats' => $stats
        ]);

     } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Copy failed', [
            'error' => $e->getMessage(),
            'stack' => $e->getTraceAsString(),
            'request' => $request->all()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Failed to copy data',
            'error' => $e->getMessage()
        ], 500);
    }
}
    // =============================================
    // Expense Class Methods
    // =============================================


     public function getExpenseClasses()
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;
    $fiscalYearId = request('fiscal_year_id');
    $fiscalYear = request('fiscal_year');

    $classes = LibExpenseClass::where('barangay_id', $barangayId)
        ->when($fiscalYearId, function($query) use ($fiscalYearId) {
            $query->where('fiscal_year_id', $fiscalYearId);
        })
        
        ->when($fiscalYear, function ($query) use ($fiscalYear) {
            $query->whereHas('fiscalYear', function ($subQuery) use ($fiscalYear) {
                $subQuery->where('year', $fiscalYear);
            });
        })
        ->with(['types', 'fiscalYear']) // eager load fiscal year too
        ->with('types')
        ->orderBy('order')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $classes
    ]);
}
   public function createExpenseClass(Request $request)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'fiscal_year_id' => [
            'required',
            Rule::exists('lib_fiscal_years', 'id')->where(function ($query) use ($barangayId) {
                $query->where('barangay_id', $barangayId);
            })
        ],
        'name' => [
            'required',
            'max:255',
            Rule::unique('lib_expense_classes')->where(function ($query) use ($barangayId, $request) {
                return $query->where('barangay_id', $barangayId)
                            ->where('fiscal_year_id', $request->fiscal_year_id);
            })
        ],

        'order' => 'sometimes|integer'
    ]);

    $class = LibExpenseClass::create([
        'barangay_id' => $barangayId,
        'fiscal_year_id' => $validated['fiscal_year_id'],
        'name' => $validated['name'],
        'order' => LibExpenseClass::where('fiscal_year_id', $validated['fiscal_year_id'])
            ->count()
    ]);
    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Class',
        'Created expense class "'.$request->input('name').'" for fiscal year '.(LibFiscalYear::whereKey($request->input('fiscal_year_id'))->value('year'))
    );
    return response()->json($class, 201);
}


 public function updateClass(Request $request, $classId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'fiscal_year_id' => 'required|exists:lib_fiscal_years,id',
        'name' => [
            'required',
            'max:255',
            Rule::unique('lib_expense_classes')
                ->ignore($classId)
                ->where(function ($query) use ($barangayId, $request) {
                    return $query->where('barangay_id', $barangayId)
                                ->where('fiscal_year_id', $request->fiscal_year_id);
                })
        ],
        'order' => 'sometimes|integer'
    ]);

    $class = LibExpenseClass::forBarangay($barangayId)->findOrFail($classId);
    $oldName = $class->name;                 // grab before update
    $class->update($validated);

    $class->update($validated);
    $fyYear = LibFiscalYear::whereKey($validated['fiscal_year_id'])->value('year');
    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Classes',
        'Updated expense class "'.$oldName.'" → "'.$class->fresh()->name.'" (ID: '.$class->id.') for fiscal year '.$fyYear
    );

    return response()->json($class->fresh()->load('types'));
}


  public function deleteClass($classId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $logData = [];

    DB::transaction(function () use ($barangayId, $classId) {
        $class = LibExpenseClass::forBarangay($barangayId)
            ->with('types.items')
            ->findOrFail($classId);

            
        // Collect log details before deletion
        $logData['class_name']  = $class->name;
        $logData['fiscal_year'] = optional($class->fiscalYear)->year ?? 'N/A';


        // Manually delete to avoid cascade issues
        $class->types->each(function ($type) {
            $type->items()->delete();
            $type->delete();
        });

        $class->delete();
        
        AdminAuthController::logUserAction(
                Auth::guard('barangay')->user(),
            'Accounts -> Expense Class',
            'Deleted expense class "'.$logData['class_name'].'" in fiscal year '.$logData['fiscal_year']
        );
    });

    return response()->json(['message' => 'Class deleted successfully']);
}

public function updateTypeOrder(Request $request)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $request->validate([
        'classes' => 'required|array',
        'classes.*.id' => 'required|exists:lib_expense_classes,id',
        'classes.*.order' => 'required|integer'
    ]);

    DB::transaction(function () use ($request, $barangayId) {
        foreach ($request->classes as $classData) {
            LibExpenseClass::forBarangay($barangayId)
                ->where('id', $classData['id'])
                ->update(['order' => $classData['order']]);
        }
    });

    // log the action
    $updatedCount = count($request->input('classes', []));
    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Classes',
        "Reordered {$updatedCount} expense class(es)"
    );

    return response()->json(['message' => 'Order updated successfully']);
}

    //Exepnse Type Methods

 public function getExpenseTypes($classId)

 // Get all expense types for a specific class
    {
        $this->verifyBarangayAccess();
        $barangayId = Auth::user()->barangay_id;

        return response()->json(
            LibExpenseType::where('expense_class_id', $classId)
                ->whereHas('expenseClass', function($query) use ($barangayId) {
                    $query->where('barangay_id', $barangayId);
                })
                ->with('items') // Eager load items
                ->orderBy('order')
                ->get()
        );
    }

// Create a new expense type
public function createExpenseType(Request $request, $classId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'name' => [
            'required',
            'max:255',
            Rule::unique('lib_expense_types')->where(function ($query) use ($classId) {
                return $query->where('expense_class_id', $classId);
            })
        ],
        'order' => 'sometimes|integer',
    ]);

    $type = LibExpenseType::create([
        'expense_class_id' => $classId,
        'name' => $validated['name'],
        'order' => LibExpenseType::where('expense_class_id', $classId)
            ->count()
    ]);

     // ----- LOG USER ACTION -----
    $expenseClass = LibExpenseClass::forBarangay($barangayId)->findOrFail($classId);
    $fyYear = \App\Models\LibFiscalYear::whereKey($expenseClass->fiscal_year_id)->value('year');

    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Types',
        'Created expense type "'.$type->name.'" under class "'.$expenseClass->name.'" for fiscal year '.$fyYear
    );
    // ----------------------------

    return response()->json($type->load('items'), 201);
}



  public function updateExpenseType(Request $request, $classId, $typeId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'name' => [
            'required',
            'max:255',
            Rule::unique('lib_expense_types')
                ->ignore($typeId)
                ->where(function ($query) use ($classId) {
                    return $query->where('expense_class_id', $classId);
                })
        ],
        'order' => 'sometimes|integer',
    ]);

    $type = LibExpenseType::where('expense_class_id', $classId)
        ->whereHas('expenseClass', fn($q) => $q->where('barangay_id', $barangayId))
        ->findOrFail($typeId);
    
    // capture old values for the log
    $oldName  = $type->name;
    $oldOrder = $type->order;

    $type->update($validated);
    $type->refresh(); // ensure we have latest values

    // gather log context
    $expenseClass = $type->expenseClass;
    $fyYear = LibFiscalYear::whereKey($expenseClass->fiscal_year_id)->value('year');

    
    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Types',
        'Updated expense type "'.$oldName.'" → "'.$type->name
        .'" under class "'.$expenseClass->name.'" for fiscal year '.$fyYear
    );

    return response()->json($type->fresh()->load('items'));
}


    // Delete an expense type
    public function deleteType($classId, $typeId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;
    
    // Collect details before deletion, then log after commit
    $logData = [];

    DB::transaction(function () use ($barangayId, $classId, $typeId) {
        $type = LibExpenseType::where('expense_class_id', $classId)
            ->whereHas('expenseClass', function ($q) use ($barangayId) {
                $q->where('barangay_id', $barangayId);
            })
            ->with(['items', 'expenseClass'])   // need class name/year for logging
            ->findOrFail($typeId);
            
        // Save details for the log
        $logData['type_name']  = $type->name;
        $logData['class_name'] = optional($type->expenseClass)->name;
        $logData['fy_year']    = \App\Models\LibFiscalYear::whereKey(
            optional($type->expenseClass)->fiscal_year_id
        )->value('year');

        $type->items()->delete();
        $type->delete();
    AdminAuthController::logUserAction(
            Auth::guard('barangay')->user(),
        'Accounts -> Expense Types',
        'Deleted expense type "'.$logData['type_name'].'" under class "'.$logData['class_name'].'" for fiscal year '.$logData['fy_year']
    );

    });

    
    return response()->json(['message' => 'Type deleted successfully']);
}
//Sotrtable
public function updateOrder(Request $request, $classId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $request->validate([
        'types' => 'required|array',
        'types.*.id' => 'required|exists:lib_expense_types,id',
        'types.*.order' => 'required|integer'
    ]);

    DB::transaction(function () use ($request, $barangayId, $classId) {
        foreach ($request->types as $typeData) {
            LibExpenseType::forBarangay($barangayId)
                ->where('id', $typeData['id'])
                ->where('expense_class_id', $classId)
                ->update(['order' => $typeData['order']]);
        }
    });

    return response()->json(['message' => 'Type order updated successfully']);
}

    // =============================================
    // Expense Item Methods
    // =============================================

    public function getExpenseItems($classId, $typeId)

    // Get all expense items for a specific type
    {
        $this->verifyBarangayAccess();
        $barangayId = Auth::user()->barangay_id;

        return response()->json(
            LibExpenseItem::where('expense_type_id', $typeId)
                ->whereHas('expenseType.expenseClass', function($query) use ($barangayId) {
                    $query->where('barangay_id', $barangayId);
                })
                ->orderBy('order')
                ->get()
        );
    }

    // Create a new expense item
    public function createExpenseItem(Request $request, $classId, $typeId)
    {
        $this->verifyBarangayAccess();
        $barangayId = Auth::user()->barangay_id;

        // Verify the type belongs to this class which belongs to this barangay
        $type = LibExpenseType::where('expense_class_id', $classId)
            ->whereHas('expenseClass', function($query) use ($barangayId) {
                $query->where('barangay_id', $barangayId);
            })
        ->with('expenseClass') // eager-load for logging
            ->findOrFail($typeId);

        $validated = $request->validate([
            'name' => [
                'required',
                'max:255',
                Rule::unique('lib_expense_items')->where(function ($query) use ($typeId) {
                    return $query->where('expense_type_id', $typeId);
                })
            ],
            'order' => 'sometimes|integer'
        ]);

        $item = $type->items()->create([
            'name' => $validated['name'],
            'order' => $validated['order'] ?? 0
        ]);

        
        // ---- LOG USER ACTION ----
        $expenseClass = $type->expenseClass;
        $fyYear = \App\Models\LibFiscalYear::whereKey($expenseClass->fiscal_year_id)->value('year');

        AdminAuthController::logUserAction(
            Auth::guard('barangay')->user(),
            'Accounts -> Expense Items',
            'Created expense item "'.$item->name
            .'" under type "'.$type->name
            .'" in class "'.$expenseClass->name
            .'" for fiscal year '.$fyYear
        );
        // -------------------------

        return response()->json($item, 201);
    }

   public function updateItem(Request $request, $classId, $typeId, $itemId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

    $validated = $request->validate([
        'name' => [
            'required',
            'max:255',
            Rule::unique('lib_expense_items')
                ->ignore($itemId)
                ->where(function ($query) use ($typeId) {
                    return $query->where('expense_type_id', $typeId);
                })
        ],
        'order' => 'sometimes|integer'
    ]);

    $item = LibExpenseItem::where('expense_type_id', $typeId)
        ->whereHas('expenseType.expenseClass', function ($q) use ($barangayId) {
            $q->where('barangay_id', $barangayId);
        })
        ->findOrFail($itemId);
        
    $oldName = $item->name;

    $item->update($validated);

    // Gather log context
    $type         = $item->expenseType ?: $item->load('expenseType.expenseClass')->expenseType;
    $expenseClass = $type->expenseClass;
    $fyYear       = \App\Models\LibFiscalYear::whereKey($expenseClass->fiscal_year_id)->value('year');

    AdminAuthController::logUserAction(
        Auth::guard('barangay')->user(),
        'Accounts -> Expense Items',
        'Updated expense item "'.$oldName.'" to "'.$item->name
        .'" under type "'.$type->name
        .'" in class "'.$expenseClass->name
        .'" for fiscal year '.$fyYear
    );

    return response()->json($item);
}

   public function deleteItem($classId, $typeId, $itemId)
{
    $this->verifyBarangayAccess();
    $barangayId = Auth::user()->barangay_id;

         // Load relations so we can log details before deletion
    $item = LibExpenseItem::where('expense_type_id', $typeId)
        ->whereHas('expenseType.expenseClass', function ($q) use ($barangayId) {
            $q->where('barangay_id', $barangayId);
        })
        ->with('expenseType.expenseClass')
        ->findOrFail($itemId);

    // Collect log context BEFORE deletion
    $itemName     = $item->name;
    $type         = $item->expenseType;
    $expenseClass = $type->expenseClass;
    $fyYear       = \App\Models\LibFiscalYear::whereKey($expenseClass->fiscal_year_id)->value('year');


    $item->delete();

     // Log user action
    AdminAuthController::logUserAction(
            Auth::guard('barangay')->user(),
        'Accounts -> Expense Items',
        'Deleted expense item "'.$itemName
        .'" under type "'.$type->name
        .'" in class "'.$expenseClass->name
        .'" for fiscal year '.$fyYear
    );

    return response()->json(['message' => 'Item deleted successfully']);
}




}
