<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use Carbon\Carbon;

class DisbursementSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();
        // 4 liquidated
        for ($i = 1; $i <= 4; $i++) {
            Disbursement::create([
                'date' => $now->copy()->subDays($i),
                'dv_number' => 'DV-25-07-0' . $i,
                'cheque_number' => '20000' . (150 + $i),
                'bank' => 'BDO',
                'payee' => 'Payee ' . $i,
                'dv_amount' => 1000 * $i,
                'status' => 'Liquidated',
                'liquidated_amount' => 1000 * $i,
            ]);
        }
        // 2 pending
        for ($i = 5; $i <= 6; $i++) {
            Disbursement::create([
                'date' => $now->copy()->subDays($i),
                'dv_number' => 'DV-25-07-0' . $i,
                'cheque_number' => '20000' . (150 + $i),
                'bank' => 'BPI',
                'payee' => 'Payee ' . $i,
                'dv_amount' => 1000 * $i,
                'status' => 'Pending',
                'liquidated_amount' => null,
            ]);
        }
    }
} 