<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
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
        $query = Disbursement::query();
        // If user is authenticated and has barangay_id, filter by it
        if ($user && isset($user->barangay_id)) {
            $query->where('barangay_id', $user->barangay_id);
        }
        $disbursements = $query->orderByDesc('date')->get([
            'id',
            'date',
            'dv_number',
            'cheque_number',
            'bank',
            'payee',
            'dv_amount',
            'status',
            'created_at',
            'updated_at',
        ]);
        return response()->json([
            'status' => true,
            'data' => $disbursements
        ]);
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