<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use Illuminate\Http\Request;

class DisbursementController extends Controller
{
    // GET /api/disbursements/recent-liquidated
    public function recentLiquidated()
    {
        $disbursements = Disbursement::where('status', 'Liquidated')
            ->orderByDesc('date')
            ->limit(4)
            ->get(['id', 'dv_number', 'dv_amount', 'date', 'status', 'liquidated_amount']);

        return response()->json([
            'status' => true,
            'data' => $disbursements
        ]);
    }
} 