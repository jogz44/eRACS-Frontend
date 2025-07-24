<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\Barangay;
use App\Models\DisbursementOrDetail;
use Carbon\Carbon;

class DisbursementSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();
        $barangays = Barangay::all();
        $barangayCount = $barangays->count();
        $disbursementIndex = 1;
        // 4 liquidated per barangay
        foreach ($barangays as $barangay) {
            for ($i = 1; $i <= 2; $i++) {
                $dvAmount = 1000 * $i;
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $now->copy()->subDays($i),
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 2, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank' => $i % 2 === 0 ? 'BDO' : 'BPI',
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => $dvAmount,
                    'status' => 'Liquidated',
                    'liquidated_amount' => $dvAmount,
                    'liquidated_at' => $now->copy()->subDays($i),
                ]);
                // Seed 2 OR details for each liquidated disbursement, sum does not exceed dv_amount
                $orAmounts = [$dvAmount * 0.6, $dvAmount * 0.4];
                for ($j = 1; $j <= 2; $j++) {
                    DisbursementOrDetail::create([
                        'disbursement_id' => $disb->id,
                        'or_date' => $now->copy()->subDays($i + $j),
                        'or_number' => 'OR-' . $disbursementIndex . '-' . $j,
                        'or_amount' => $orAmounts[$j-1],
                        'or_photo' => 'or-photos/vm8wtjh7G05yx1SzPm46RCpSMxUlEJiDNeC6YE8A.png',
                        'remarks' => 'Seeded remark for OR ' . $j . ' of disbursement ' . $disbursementIndex,
                    ]);
                }
                $disbursementIndex++;
            }
            // 2 pending per barangay
            for ($i = 3; $i <= 4; $i++) {
                $dvAmount = 1000 * $i;
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $now->copy()->subDays($i),
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 2, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank' => $i % 2 === 0 ? 'BDO' : 'BPI',
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => $dvAmount,
                    'status' => 'Pending',
                    'liquidated_amount' => null,
                    'liquidated_at' => null,
                ]);
                // No OR details for pending disbursements
                $disbursementIndex++;
            }
        }
    }
} 