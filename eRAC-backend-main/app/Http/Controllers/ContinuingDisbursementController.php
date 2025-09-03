<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\LibBooklet;
use App\Models\LibCheque;
use App\Models\DisbursementOrDetail;
use App\Models\TranExpenseDetail;
use App\Models\TranAppropriation;
use App\Models\ContApproAccounts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AdminAuthController;

class ContinuingDisbursementController extends Controller
{
    // GET /api/barangay/continuing-disbursements
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Disbursement::where('barangay_id', $user->barangay_id)
            ->where('is_continuing', true) // Add flag to distinguish continuing disbursements
            ->with(['bank', 'expenseDetails.appropriation.expenseClass', 'expenseDetails.appropriation.expenseType', 'expenseDetails.appropriation.expenseItem']);

        $disbursements = $query->orderByDesc('created_at')->get();

        $formattedDisbursements = $disbursements->map(function ($disbursement) {
            return [
                'id' => $disbursement->id,
                'date' => $disbursement->date,
                'dvNumber' => $disbursement->dv_number,
                'chequeNumber' => $disbursement->cheque_number,
                'bank' => $disbursement->bank ? $disbursement->bank->bank_name : 'N/A',
                'bank_id' => $disbursement->bank_id,
                'payee' => $disbursement->payee,
                'dvAmount' => $disbursement->dv_amount,
                'status' => $disbursement->status,
                'expenses' => $disbursement->expenseDetails->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'accountId' => $detail->appropriation_id,
                        'accountName' => $this->getAccountNameFromAppropriationId($detail->appropriation_id),
                        'particular' => $detail->particulars,
                        'amount' => $detail->amount,
                    ];
                }),
                'created_at' => $disbursement->created_at,
                'updated_at' => $disbursement->updated_at,
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $formattedDisbursements
        ]);
    }

    // POST /api/barangay/continuing-disbursements
    public function store(Request $request)
    {
        // Debug: Log the incoming request data
        \Log::info('Continuing Disbursement Store Request:', [
            'all_data' => $request->all(),
            'expenses' => $request->input('expenses', []),
        ]);

        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'dvNumber' => 'required|string|max:255',
                'chequeNumber' => 'required|string|max:255',
                'bank_id' => 'required|exists:lib_banks,id',
                'payee' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0',
                'expenses' => 'required|array|min:1',
                'expenses.*.accountId' => 'required|exists:cont_appro_accounts,id',
                'expenses.*.particulars' => 'required|string|max:255',
                'expenses.*.amount' => 'required|numeric|min:0',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create the disbursement
            $disbursement = Disbursement::create([
                'barangay_id' => $request->user()->barangay_id,
                'date' => $validated['date'],
                'dv_number' => $validated['dvNumber'],
                'cheque_number' => $validated['chequeNumber'],
                'bank_id' => $validated['bank_id'],
                'payee' => $validated['payee'],
                'dv_amount' => $validated['amount'],
                'status' => 'Pending',
                'is_continuing' => true, // Flag to identify continuing disbursements
                'user_id' => $request->user()->id,
            ]);

            // Create expense details
            foreach ($validated['expenses'] as $expense) {
                // Get the continuing appropriation account
                $contAccount = ContApproAccounts::find($expense['accountId']);
                if (!$contAccount) {
                    throw new \Exception("Continuing appropriation account not found");
                }

                // Create expense detail
                TranExpenseDetail::create([
                    'disbursement_id' => $disbursement->id,
                    'appropriation_id' => $contAccount->tranAppropriation_id, // Use the original appropriation ID
                    'particulars' => $expense['particulars'],
                    'amount' => $expense['amount'],
                    'user_id' => $request->user()->id,
                ]);

                // Update the remaining balance of the continuing appropriation account
                $contAccount->remainingBalance -= $expense['amount'];
                $contAccount->save();
            }

            // Update cheque status
            $cheque = LibCheque::where('cheque_number', $validated['chequeNumber'])->first();
            if ($cheque) {
                $cheque->status = 'issued';
                $cheque->disbursement_id = $disbursement->id;
                $cheque->save();
            }

            DB::commit();

            // Log the action
            AdminAuthController::logUserAction(
                $request->user(),
                'Created Continuing Disbursement',
                "Created continuing disbursement DV-{$disbursement->dv_number} for {$disbursement->payee}"
            );

            return response()->json([
                'status' => true,
                'message' => 'Continuing disbursement created successfully',
                'data' => $disbursement
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to create continuing disbursement: ' . $e->getMessage()
            ], 500);
        }
    }

    // GET /api/barangay/continuing-disbursements/{id}
    public function show(Request $request, $id)
    {
        $disbursement = Disbursement::where('id', $id)
            ->where('barangay_id', $request->user()->barangay_id)
            ->where('is_continuing', true)
            ->with(['bank', 'expenseDetails.appropriation.expenseClass', 'expenseDetails.appropriation.expenseType', 'expenseDetails.appropriation.expenseItem'])
            ->first();

        if (!$disbursement) {
            return response()->json([
                'status' => false,
                'message' => 'Continuing disbursement not found'
            ], 404);
        }

        $formattedDisbursement = [
            'id' => $disbursement->id,
            'date' => $disbursement->date,
            'dvNumber' => $disbursement->dv_number,
            'chequeNumber' => $disbursement->cheque_number,
            'bank' => $disbursement->bank ? $disbursement->bank->bank_name : 'N/A',
            'bank_id' => $disbursement->bank_id,
            'payee' => $disbursement->payee,
            'dvAmount' => $disbursement->dv_amount,
            'status' => $disbursement->status,
            'expenses' => $disbursement->expenseDetails->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'accountId' => $detail->appropriation_id,
                    'accountName' => $this->getAccountNameFromAppropriationId($detail->appropriation_id),
                    'particular' => $detail->particulars,
                    'amount' => $detail->amount,
                ];
            }),
            'created_at' => $disbursement->created_at,
            'updated_at' => $disbursement->updated_at,
        ];

        return response()->json([
            'status' => true,
            'data' => $formattedDisbursement
        ]);
    }

    // PUT /api/barangay/continuing-disbursements/{id}
    public function update(Request $request, $id)
    {
        $disbursement = Disbursement::where('id', $id)
            ->where('barangay_id', $request->user()->barangay_id)
            ->where('is_continuing', true)
            ->first();

        if (!$disbursement) {
            return response()->json([
                'status' => false,
                'message' => 'Continuing disbursement not found'
            ], 404);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'dvNumber' => 'required|string|max:255',
            'chequeNumber' => 'required|string|max:255',
            'bank_id' => 'required|exists:lib_banks,id',
            'payee' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expenses' => 'required|array|min:1',
            'expenses.*.accountId' => 'required|exists:cont_appro_accounts,id',
            'expenses.*.particulars' => 'required|string|max:255',
            'expenses.*.amount' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Update the disbursement
            $disbursement->update([
                'date' => $validated['date'],
                'dv_number' => $validated['dvNumber'],
                'cheque_number' => $validated['chequeNumber'],
                'bank_id' => $validated['bank_id'],
                'payee' => $validated['payee'],
                'dv_amount' => $validated['amount'],
            ]);

            // Delete existing expense details
            TranExpenseDetail::where('disbursement_id', $disbursement->id)->delete();

            // Create new expense details
            foreach ($validated['expenses'] as $expense) {
                // Get the continuing appropriation account
                $contAccount = ContApproAccounts::find($expense['accountId']);
                if (!$contAccount) {
                    throw new \Exception("Continuing appropriation account not found");
                }

                // Create expense detail
                TranExpenseDetail::create([
                    'disbursement_id' => $disbursement->id,
                    'appropriation_id' => $contAccount->tranAppropriation_id,
                    'particulars' => $expense['particulars'],
                    'amount' => $expense['amount'],
                    'user_id' => $request->user()->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Continuing disbursement updated successfully',
                'data' => $disbursement
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to update continuing disbursement: ' . $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/barangay/continuing-disbursements/{id}
    public function destroy(Request $request, $id)
    {
        $disbursement = Disbursement::where('id', $id)
            ->where('barangay_id', $request->user()->barangay_id)
            ->where('is_continuing', true)
            ->first();

        if (!$disbursement) {
            return response()->json([
                'status' => false,
                'message' => 'Continuing disbursement not found'
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Restore remaining balances
            $expenseDetails = TranExpenseDetail::where('disbursement_id', $disbursement->id)->get();
            foreach ($expenseDetails as $detail) {
                // Find the continuing appropriation account
                $contAccount = ContApproAccounts::where('tranAppropriation_id', $detail->appropriation_id)->first();
                if ($contAccount) {
                    $contAccount->remainingBalance += $detail->amount;
                    $contAccount->save();
                }
            }

            // Delete expense details
            TranExpenseDetail::where('disbursement_id', $disbursement->id)->delete();

            // Update cheque status
            $cheque = LibCheque::where('cheque_number', $disbursement->cheque_number)->first();
            if ($cheque) {
                $cheque->status = 'unused';
                $cheque->disbursement_id = null;
                $cheque->save();
            }

            // Delete the disbursement
            $disbursement->delete();

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Continuing disbursement deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete continuing disbursement: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getAccountNameFromAppropriationId($appropriationId)
    {
        $appr = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem'])->find($appropriationId);
        if (!$appr) {
            return 'Unknown Account';
        }
        $parts = [];
        if ($appr->expenseClass) { $parts[] = $appr->expenseClass->name; }
        if ($appr->expenseType) { $parts[] = $appr->expenseType->name; }
        if ($appr->expenseItem) { $parts[] = $appr->expenseItem->name; }
        return implode(' > ', $parts) ?: 'Unknown Account';
    }
}
