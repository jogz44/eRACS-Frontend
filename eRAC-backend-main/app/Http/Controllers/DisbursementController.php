<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\DisbursementOrDetail;
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

    // GET /api/barangay/disbursements/{id}/or-details
    public function getOrDetails($id)
    {
        $orDetails = DisbursementOrDetail::where('disbursement_id', $id)->get();
        return response()->json(['status' => true, 'data' => $orDetails]);
    }

    // GET /api/barangay/disbursements/{id}
    public function show($id)
    {
        try {
            \Log::info("Fetching disbursement with ID: " . $id);
            
            $user = request()->user();
            \Log::info("User: ", ['user_id' => $user ? $user->id : 'null', 'barangay_id' => $user ? $user->barangay_id : 'null']);
            
            $query = Disbursement::with('bank');
            
            // If user is authenticated and has barangay_id, filter by it
            if ($user && isset($user->barangay_id)) {
                $query->where('barangay_id', $user->barangay_id);
            }
            
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
            'created_at' => $disbursement->created_at,
            'updated_at' => $disbursement->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("Error fetching disbursement: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
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
} 