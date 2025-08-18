<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\LibCheque;
use App\Models\DisbursementOrDetail;
use App\Models\TranExpenseDetail;
use App\Models\TranAppropriation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DisbursementController extends Controller
{
    // GET /api/disbursements/recent-liquidated
    public function recentLiquidated(Request $request)
    {
        $user = $request->user();
        $query = Disbursement::where('status', 'Liquidated');
        if ($user && isset($user->barangay_id)) {
            $query->where('barangay_id', $user->barangay_id);
        }
        $disbursements = $query->orderByDesc('liquidated_at')
            ->limit(4)
            ->get(['id', 'dv_number', 'dv_amount', 'date', 'status', 'liquidated_amount', 'liquidated_at']);
        return response()->json([
            'status' => true,
            'data' => $disbursements
        ]);
    }

    // GET /api/barangay/disbursements
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Disbursement::with('bank');
        // If user is authenticated and has barangay_id, filter by it
        if ($user && isset($user->barangay_id)) {
            $query->where('barangay_id', $user->barangay_id);
        }
        $disbursements = $query->orderByDesc('date')->get();
        $result = $disbursements->map(function($d) {
            return [
                'id' => $d->id,
                'date' => $d->date,
                'dv_number' => $d->dv_number,
                'cheque_number' => $d->cheque_number,
                'bank_id' => $d->bank_id,
                'bank_name' => $d->bank->bank_name,
                'payee' => $d->payee,
                'dv_amount' => $d->dv_amount,
                'status' => $d->status,
                'created_at' => $d->created_at,
                'updated_at' => $d->updated_at,
            ];
        });
        return response()->json([
            'status' => true,
            'data' => $result
        ]);
    }

    // POST /api/barangay/disbursements
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|string|regex:/^\d{2}\/\d{2}\/\d{4}$/',
            'dv_number' => 'required|string|unique:disbursements,dv_number',
            'cheque_number' => 'required|string',
            'bank_id' => 'required|exists:lib_banks,id',
            'payee' => 'required|string',
            'dv_amount' => 'required|numeric|min:0',
            'expenses' => 'array',
            'expenses.*.accountId' => 'required|integer',
            'expenses.*.amount' => 'required|numeric|min:0',
            'expenses.*.particular' => 'nullable|string',
        ]);

        try {
            $user = $request->user();
            
            // Convert date from DD/MM/YYYY to YYYY-MM-DD
            $dateParts = explode('/', $request->date);
            $formattedDate = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];

            $disbursement = Disbursement::create([
                'barangay_id' => $user->barangay_id,
                'date' => $formattedDate,
                'dv_number' => $request->dv_number,
                'cheque_number' => $request->cheque_number,
                'bank_id' => $request->bank_id,
                'payee' => $request->payee,
                'dv_amount' => $request->dv_amount,
                'status' => 'Pending',
            ]);

            // update the selected lib_cheque_numbers status to 'Used'
            $chequeNumber = $request->cheque_number;
            $cheque = LibCheque::where('cheque_number', $chequeNumber)
                ->where('booklet_id', $request->cheque_booklet) // Assuming cheque_booklet is passed in the request
                ->where('status', 'unused')
                ->firstorFail();
            $cheque->update([
                'status' => 'issued',
            ]);


            // Save expense details to tran_expense_details table
            if ($request->has('expenses') && is_array($request->expenses)) {
                // The frontend already creates expense details, we just need to link them
                // by updating their disbursement_id
                foreach ($request->expenses as $expense) {
                    if (isset($expense['dbId'])) {
                        // Update existing expense detail with disbursement ID
                        TranExpenseDetail::where('id', $expense['dbId'])
                            ->update(['disbursement_id' => $disbursement->id]);
                    }
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Disbursement created successfully',
                'data' => $disbursement
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error creating disbursement: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to create disbursement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/barangay/disbursements/{id}/or-details
    public function getOrDetails($id)
    {
        $orDetails = DisbursementOrDetail::where('disbursement_id', $id)->get();
        return response()->json(['status' => true, 'data' => $orDetails]);
    }

    // POST /api/barangay/disbursements/{id}/or-details
    public function saveOrDetails(Request $request, $id)
    {
        $request->validate([
            'orDetails' => 'required|array',
            'orDetails.*.id' => 'nullable|integer|exists:disbursement_or_details,id',
            'orDetails.*.orNumber' => 'required|string',
            'orDetails.*.orAmount' => 'required|numeric|min:0',
            'orDetails.*.orDate' => 'required|string|regex:/^\d{2}\/\d{2}\/\d{4}$/',
            'orDetails.*.orPhotoUrl' => 'required|string',
            'orDetails.*.remarks' => 'nullable|string',
            'liquidatedAmount' => 'required|numeric|min:0',
            'isPartial' => 'nullable|boolean',
        ]);

        try {
            $user = $request->user();
            
            // Find the disbursement
            $disbursement = Disbursement::where('id', $id)
                ->where('barangay_id', $user->barangay_id)
                ->firstOrFail();

            // Check if this is a continuation of partial liquidation
            $isContinuation = $disbursement->status === 'Partial';
            
            if (!$isContinuation) {
                // Delete existing OR details only if not continuing partial liquidation
                DisbursementOrDetail::where('disbursement_id', $id)->delete();
            }

            // Get existing OR details for comparison
            $existingOrDetails = DisbursementOrDetail::where('disbursement_id', $id)->get();
            
            // Process OR details - update existing ones or create new ones
            foreach ($request->orDetails as $orDetail) {
                // Convert date from DD/MM/YYYY to YYYY-MM-DD if provided
                $orDate = null;
                if (!empty($orDetail['orDate'])) {
                    $dateParts = explode('/', $orDetail['orDate']);
                    if (count($dateParts) === 3) {
                        $orDate = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];
                    }
                }

                if ($isContinuation && isset($orDetail['id']) && $orDetail['id']) {
                    // Update existing OR detail by ID
                    $existingOrDetail = DisbursementOrDetail::where('id', $orDetail['id'])
                        ->where('disbursement_id', $id)
                        ->first();
                    
                    if ($existingOrDetail) {
                        $existingOrDetail->update([
                            'or_date' => $orDate,
                            'or_number' => $orDetail['orNumber'],
                            'or_amount' => $orDetail['orAmount'],
                            'remarks' => $orDetail['remarks'] ?? '',
                            'or_photo' => $orDetail['orPhotoUrl'] ?? null,
                        ]);
                    }
                } else {
                    // Create new OR detail
                    DisbursementOrDetail::create([
                        'disbursement_id' => $id,
                        'or_date' => $orDate,
                        'or_number' => $orDetail['orNumber'],
                        'or_amount' => $orDetail['orAmount'],
                        'remarks' => $orDetail['remarks'] ?? '',
                        'or_photo' => $orDetail['orPhotoUrl'] ?? null,
                    ]);
                }
            }
            


            // Update disbursement status based on whether it's partial or full liquidation
            $isPartial = $request->has('isPartial') && ($request->isPartial === true || $request->isPartial === 'true' || $request->isPartial === 1);
            $status = $isPartial ? 'Partial' : 'Liquidated';
            $disbursement->update([
                'status' => $status,
                'liquidated_amount' => $request->liquidatedAmount,
                'liquidated_at' => now(),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'OR Details saved successfully',
                'data' => [
                    'disbursement' => $disbursement,
                    'orDetails' => DisbursementOrDetail::where('disbursement_id', $id)->get()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error saving OR details: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to save OR details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/barangay/disbursements/or-photo/upload
    public function uploadOrPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        try {
            $user = $request->user();
            
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $fileName = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('or-photos', $fileName, 'public');
                
                return response()->json([
                    'status' => true,
                    'message' => 'Photo uploaded successfully',
                    'path' => $path
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => 'No photo provided'
            ], 400);

        } catch (\Exception $e) {
            \Log::error('Error uploading OR photo: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to upload photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/barangay/disbursements/or-photo/delete
    public function deleteOrPhoto(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            $path = $request->path;
            
            if (\Storage::disk('public')->exists($path)) {
                \Storage::disk('public')->delete($path);
                
                return response()->json([
                    'status' => true,
                    'message' => 'Photo deleted successfully'
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => 'Photo not found'
            ], 404);

        } catch (\Exception $e) {
            \Log::error('Error deleting OR photo: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/barangay/disbursements/{id}
    public function show($id)
    {
        try {
            \Log::info("Fetching disbursement with ID: " . $id);
            
            $user = request()->user();
            \Log::info("User: ", ['user_id' => $user ? $user->id : 'null', 'barangay_id' => $user ? $user->barangay_id : 'null']);
            
            $query = Disbursement::with(['bank', 'expenseDetails.appropriation']);
            
            // If user is authenticated and has barangay_id, filter by it
            if ($user && isset($user->barangay_id)) {
                $query->where('barangay_id', $user->barangay_id);
            }
            $query->orderByDesc('created_at');
            $disbursement = $query->find($id);
            
            if (!$disbursement) {
                \Log::warning("Disbursement not found with ID: " . $id);
                return response()->json(['error' => 'Disbursement not found'], 404);
            }
            
            \Log::info("Found disbursement: ", ['id' => $disbursement->id, 'dv_number' => $disbursement->dv_number]);
            
            return response()->json([
                'status' => true,
                'data' => [
                'id' => $disbursement->id,
                'date' => $disbursement->date,
                'dv_number' => $disbursement->dv_number,
                'cheque_number' => $disbursement->cheque_number,
                'bank_id' => $disbursement->bank_id,
                'bank_name' => $disbursement->bank ? $disbursement->bank->bank_name : null,
                'payee' => $disbursement->payee,
                'dv_amount' => $disbursement->dv_amount,
                'status' => $disbursement->status,
                'expenses' => $disbursement->expenseDetails->map(function($detail) {
                    return [
                        'id' => $detail->id,
                        'accountId' => $detail->appropriation_id,
                        'amount' => $detail->amount,
                        'particular' => $detail->particulars,
                        'expense_class_id' => $detail->appropriation->expense_class_id ?? null,
                        'expense_type_id' => $detail->appropriation->expense_type_id ?? null,
                        'expense_item_id' => $detail->appropriation->expense_item_id ?? null,
                    ];
                }),
                'created_at' => $disbursement->created_at,
                'updated_at' => $disbursement->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("Error fetching disbursement: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/barangay/disbursements/{id}
    public function update(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|string|regex:/^\d{2}\/\d{2}\/\d{4}$/',
            'dv_number' => 'required|string|unique:disbursements,dv_number,' . $id,
            'cheque_number' => 'required|string',
            'bank_id' => 'required|exists:lib_banks,id',
            'payee' => 'required|string',
            'dv_amount' => 'required|numeric|min:0',
            'expenses' => 'array',
            'expenses.*.accountId' => 'required|exists:lib_expense_items,id',
            'expenses.*.amount' => 'required|numeric|min:0',
            'expenses.*.particular' => 'nullable|string',
        ]);

        try {
            $user = $request->user();
            
            // Find the disbursement
            $disbursement = Disbursement::where('id', $id)
                ->where('barangay_id', $user->barangay_id)
                ->firstOrFail();
            
            // Convert date from DD/MM/YYYY to YYYY-MM-DD
            $dateParts = explode('/', $request->date);
            $formattedDate = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];

            // Update the disbursement
            $disbursement->update([
                'date' => $formattedDate,
                'dv_number' => $request->dv_number,
                'cheque_number' => $request->cheque_number,
                'bank_id' => $request->bank_id,
                'payee' => $request->payee,
                'dv_amount' => $request->dv_amount,
            ]);

            // Update expense details - first delete existing ones, then create new ones
            if ($request->has('expenses') && is_array($request->expenses)) {
                // Delete existing expense details for this disbursement
                TranExpenseDetail::where('disbursement_id', $disbursement->id)->delete();
                
                // Create new expense details
                foreach ($request->expenses as $expense) {
                    TranExpenseDetail::create([
                        'disbursement_id' => $disbursement->id,
                        'appropriation_id' => $expense['accountId'],
                        'amount' => $expense['amount'],
                        'particulars' => $expense['particular'] ?? '',
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Disbursement updated successfully',
                'data' => $disbursement
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating disbursement: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update disbursement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/barangay/disbursements/{id}/liquidate
    public function liquidate(Request $request, $id)
    {
        $request->validate([
            'liquidated_amount' => 'required|numeric|min:0',
        ]);
        $disbursement = Disbursement::findOrFail($id);
        $disbursement->status = 'Liquidated';
        $disbursement->liquidated_amount = $request->liquidated_amount;
        $disbursement->liquidated_at = now();
        $disbursement->save();
        return response()->json(['status' => true, 'data' => $disbursement]);
    }

    // DELETE /api/barangay/disbursements/{id}/or-details/{orDetailId}
    public function deleteOrDetail(Request $request, $id, $orDetailId)
    {
        try {
            $user = $request->user();
            
            // Find the disbursement and ensure it belongs to the user's barangay
            $disbursement = Disbursement::where('id', $id)
                ->where('barangay_id', $user->barangay_id)
                ->firstOrFail();
            
            // Check if disbursement can be modified (only if status is Pending or Partial)
            if ($disbursement->status !== 'Pending' && $disbursement->status !== 'Partial') {
                return response()->json([
                    'status' => false,
                    'message' => 'Only pending and partial disbursements can be modified'
                ], 400);
            }
            
            // Find and delete the OR detail
            $orDetail = DisbursementOrDetail::where('id', $orDetailId)
                ->where('disbursement_id', $id)
                ->firstOrFail();
            
            $orDetail->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'OR Detail deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error deleting OR detail: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete OR detail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/barangay/disbursements/{id}
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Find the disbursement and ensure it belongs to the user's barangay
            $disbursement = Disbursement::where('id', $id)
                ->where('barangay_id', $user->barangay_id)
                ->firstOrFail();
            
            // Check if disbursement can be deleted (only if status is Pending or Partial)
            if ($disbursement->status !== 'Pending' && $disbursement->status !== 'Partial') {
                return response()->json([
                    'status' => false,
                    'message' => 'Only pending and partial disbursements can be deleted'
                ], 400);
            }
            
            // Delete expense details first (they will be automatically deleted due to cascade, but being explicit)
            TranExpenseDetail::where('disbursement_id', $disbursement->id)->delete();
            
            // Delete the disbursement
            $disbursement->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Disbursement deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error deleting disbursement: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete disbursement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/barangay/expense-details
    public function getExpenseDetails(Request $request)
    {
        try {
            $user = $request->user();
            
            $query = TranExpenseDetail::with(['appropriation.expenseClass', 'appropriation.expenseType', 'appropriation.expenseItem']);
            
            // If user is authenticated and has barangay_id, filter by it
            if ($user && isset($user->barangay_id)) {
                $query->whereHas('appropriation', function($q) use ($user) {
                    $q->where('barangay_id', $user->barangay_id);
                });
            }
            
            $expenseDetails = $query->get();
            
            $result = $expenseDetails->map(function($detail) {
                return [
                    'id' => $detail->id,
                    'disbursement_id' => $detail->disbursement_id,
                    'appropriation_id' => $detail->appropriation_id,
                    'amount' => $detail->amount,
                    'particulars' => $detail->particulars,
                    'expense_class_id' => $detail->appropriation->expense_class_id ?? null,
                    'expense_type_id' => $detail->appropriation->expense_type_id ?? null,
                    'expense_item_id' => $detail->appropriation->expense_item_id ?? null,
                    'created_at' => $detail->created_at,
                    'updated_at' => $detail->updated_at,
                ];
            });
            
            return response()->json([
                'status' => true,
                'data' => $result
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error fetching expense details: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch expense details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/barangay/expense-details
    public function storeExpenseDetail(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'particulars' => 'nullable|string',
            // Client may provide either a direct appropriation_id or one of the expense hierarchy IDs
            'appropriation_id' => 'nullable|exists:tran_appropriations,id',
            'expense_class_id' => 'nullable|exists:lib_expense_classes,id',
            'expense_type_id' => 'nullable|exists:lib_expense_types,id',
            'expense_item_id' => 'nullable|exists:lib_expense_items,id',
        ]);

        try {
            $user = $request->user();
            
            \Log::info('Starting expense detail creation:', [
                'user_id' => $user->id,
                'barangay_id' => $user->barangay_id,
                'request_data' => $request->all()
            ]);

            // Use database transaction to ensure data consistency
            DB::beginTransaction();

            // Resolve appropriation
            $appropriationQuery = TranAppropriation::where('barangay_id', $user->barangay_id)
                ->where('status', 'committed');

            $appropriation = null;
            if ($request->filled('appropriation_id')) {
                $appropriation = $appropriationQuery->where('id', $request->appropriation_id)->first();
            }

            if (!$appropriation) {
                // Prefer most specific ID first (item > type > class)
                if ($request->filled('expense_item_id')) {
                    $appropriationQuery->where('expense_item_id', $request->expense_item_id);
                } elseif ($request->filled('expense_type_id')) {
                    $appropriationQuery->whereNull('expense_item_id')
                        ->where('expense_type_id', $request->expense_type_id);
                } elseif ($request->filled('expense_class_id')) {
                    $appropriationQuery->whereNull('expense_item_id')
                        ->whereNull('expense_type_id')
                        ->where('expense_class_id', $request->expense_class_id);
                } else {
                    DB::rollBack();
                    return response()->json([
                        'status' => false,
                        'message' => 'No appropriation reference provided',
                        'errors' => ['appropriation' => ['Provide appropriation_id or one of expense_item_id/expense_type_id/expense_class_id']]
                    ], 422);
                }

                // Pick the most recent committed appropriation that matches
                $appropriation = $appropriationQuery->orderByDesc('created_at')->first();
                if (!$appropriation) {
                    DB::rollBack();
                    return response()->json([
                        'status' => false,
                        'message' => 'No committed appropriation found for the selected account',
                    ], 422);
                }
            }

            \Log::info('Found appropriation:', [
                'id' => $appropriation->id,
                'amount' => $appropriation->amount,
                'expense_class_id' => $appropriation->expense_class_id,
                'expense_type_id' => $appropriation->expense_type_id,
                'expense_item_id' => $appropriation->expense_item_id,
            ]);

            // Find all matching appropriations and treat them as one budget pool
            $matchingAppropriationsQuery = TranAppropriation::where('barangay_id', $user->barangay_id)
                ->where('status', 'committed');
            
            if ($appropriation->expense_item_id) {
                $matchingAppropriationsQuery->where('expense_item_id', $appropriation->expense_item_id);
            } elseif ($appropriation->expense_type_id) {
                $matchingAppropriationsQuery->whereNull('expense_item_id')
                    ->where('expense_type_id', $appropriation->expense_type_id);
            } else {
                $matchingAppropriationsQuery->whereNull('expense_item_id')
                    ->where('expense_class_id', $appropriation->expense_class_id);
            }

            $matchingAppropriations = $matchingAppropriationsQuery->orderBy('created_at', 'asc')->get();

            \Log::info('Matching appropriations found:', [
                'count' => $matchingAppropriations->count(),
                'requested_amount' => $request->amount,
                'expense_class_id' => $request->expense_class_id,
                'expense_type_id' => $request->expense_type_id,
                'expense_item_id' => $request->expense_item_id,
            ]);

            if ($matchingAppropriations->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'status' => false,
                    'message' => 'No appropriations found for the selected account',
                ], 422);
            }

            // Calculate total available balance across all appropriations (treat as one pool)
            $totalAvailableBalance = 0;
            foreach ($matchingAppropriations as $appr) {
                $alreadyUsed = TranExpenseDetail::where('appropriation_id', $appr->id)->sum('amount');
                $available = max(0, (float)$appr->amount - (float)$alreadyUsed);
                $totalAvailableBalance += $available;
            }

            \Log::info('Total available balance:', [
                'total_available' => $totalAvailableBalance,
                'requested_amount' => $request->amount,
            ]);

            if ($totalAvailableBalance < (float)$request->amount) {
                DB::rollBack();
                return response()->json([
                    'status' => false,
                    'message' => 'Insufficient appropriation balance to cover requested amount',
                ], 422);
            }

            // Create a single expense detail record (representing the logical expense)
            // The appropriation_id will be set to the first matching appropriation
            // but the amount represents the total across all appropriations
            $expenseDetail = TranExpenseDetail::create([
                'disbursement_id' => null, // Will be set when disbursement is saved
                'appropriation_id' => $matchingAppropriations->first()->id, // Use first appropriation as reference
                'amount' => (float)$request->amount,
                'particulars' => $request->particulars ?? '',
            ]);

            \Log::info('Successfully created expense detail:', [
                'id' => $expenseDetail->id,
                'amount' => $expenseDetail->amount,
                'appropriation_id' => $expenseDetail->appropriation_id,
            ]);

            // Commit the transaction
            DB::commit();

            // Return the expense detail
            return response()->json([
                'status' => true,
                'message' => 'Expense detail created successfully',
                'data' => [
                    'id' => $expenseDetail->id,
                    'disbursement_id' => null,
                    'appropriation_id' => $expenseDetail->appropriation_id,
                    'amount' => $expenseDetail->amount,
                    'particulars' => $expenseDetail->particulars,
                    'expense_class_id' => $appropriation->expense_class_id,
                    'expense_type_id' => $appropriation->expense_type_id,
                    'expense_item_id' => $appropriation->expense_item_id,
                    // Since we're treating this as one logical expense, just return the single ID
                    'all_detail_ids' => [$expenseDetail->id],
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating expense detail: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => false,
                'message' => 'Failed to create expense detail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/barangay/expense-details/{id}
    public function updateExpenseDetail(Request $request, $id)
    {
        $request->validate([
            'disbursement_id' => 'nullable|exists:disbursements,id',
        ]);

        try {
            $user = $request->user();
            
            // Find the expense detail and ensure it belongs to the user's barangay
            $expenseDetail = TranExpenseDetail::where('id', $id)
                ->whereHas('appropriation', function($q) use ($user) {
                    $q->where('barangay_id', $user->barangay_id);
                })
                ->firstOrFail();
            
            $expenseDetail->update([
                'disbursement_id' => $request->disbursement_id,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Expense detail updated successfully',
                'data' => $expenseDetail
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error updating expense detail: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update expense detail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/barangay/expense-details/{id}
    public function destroyExpenseDetail(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Find the expense detail and ensure it belongs to the user's barangay
            $expenseDetail = TranExpenseDetail::where('id', $id)
                ->whereHas('appropriation', function($q) use ($user) {
                    $q->where('barangay_id', $user->barangay_id);
                })
                ->firstOrFail();
            
            // Only allow deletion if disbursement_id is null (unsaved)
            if ($expenseDetail->disbursement_id !== null) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cannot delete expense detail that is already associated with a disbursement'
                ], 400);
            }
            
            $expenseDetail->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Expense detail deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error deleting expense detail: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete expense detail',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 