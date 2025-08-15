<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\LibCheque;
use App\Models\DisbursementOrDetail;
use App\Models\TranExpenseDetail;
use Illuminate\Http\Request;

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
} 