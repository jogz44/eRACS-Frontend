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
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $now->copy()->subDays($i),
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 2, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank' => $i % 2 === 0 ? 'BDO' : 'BPI',
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => 1000 * $i,
                    'status' => 'Liquidated',
                    'liquidated_amount' => 1000 * $i,
                    'liquidated_at' => $now->copy()->subDays($i),
                ]);
                // Seed 2 OR details for each liquidated disbursement
                for ($j = 1; $j <= 2; $j++) {
                    DisbursementOrDetail::create([
                        'disbursement_id' => $disb->id,
                        'or_date' => $now->copy()->subDays($i + $j),
                        'or_number' => 'OR-' . $disbursementIndex . '-' . $j,
                        'or_amount' => 500 * $j,
                        'or_photo' => null,
                        'remarks' => 'Seeded remark for OR ' . $j . ' of disbursement ' . $disbursementIndex,
                    ]);
                }
                $disbursementIndex++;
            }
            // 2 pending per barangay
            for ($i = 3; $i <= 4; $i++) {
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $now->copy()->subDays($i),
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 2, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank' => $i % 2 === 0 ? 'BDO' : 'BPI',
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => 1000 * $i,
                    'status' => 'Pending',
                    'liquidated_amount' => null,
                    'liquidated_at' => null,
                ]);
                // Seed 1 OR detail for each pending disbursement
                DisbursementOrDetail::create([
                    'disbursement_id' => $disb->id,
                    'or_date' => $now->copy()->subDays($i),
                    'or_number' => 'OR-' . $disbursementIndex . '-1',
                    'or_amount' => 500,
                    'or_photo' => null,
                    'remarks' => 'Seeded remark for pending OR of disbursement ' . $disbursementIndex,
                ]);
                $disbursementIndex++;
            }
        }
    }
} 