<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\Barangay;
use App\Models\LibBank;
use App\Models\DisbursementOrDetail;
use Carbon\Carbon;

class DisbursementSeeder extends Seeder
{
    public function run()
    {
        $barangays = Barangay::all();
        $barangayCount = $barangays->count();
        $disbursementIndex = 1;
        
        // Create disbursements for July 2025 (DV-25-07-XXX)
        $julyDate = Carbon::create(2025, 7, 15); // July 15, 2025
        
        // 4 liquidated per barangay
        foreach ($barangays as $barangay) {
            // Get all banks for this barangay
            $banks = LibBank::where('barangay_id', $barangay->id)->get();
            $bankCount = $banks->count();
            for ($i = 1; $i <= 2; $i++) {
                $dvAmount = 1000 * $i;
                $bank = $banks[($i - 1) % $bankCount] ?? $banks[0] ?? null;
                $bankId = $bank ? $bank->id : null;
                $disbursementDate = $julyDate->copy()->subDays($i);
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $disbursementDate,
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 3, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank_id' => $bankId,
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => $dvAmount,
                    'status' => 'Liquidated',
                    'liquidated_amount' => $dvAmount,
                    'liquidated_at' => $disbursementDate,
                    'created_at' => $disbursementDate,
                    'updated_at' => $disbursementDate,
                ]);
                // Seed 2 OR details for each liquidated disbursement, sum does not exceed dv_amount
                $orAmounts = [$dvAmount * 0.6, $dvAmount * 0.4];
                for ($j = 1; $j <= 2; $j++) {
                    $orDate = $disbursementDate->copy()->addDays($j);
                    DisbursementOrDetail::create([
                        'disbursement_id' => $disb->id,
                        'or_date' => $orDate,
                        'or_number' => 'OR-' . $disbursementIndex . '-' . $j,
                        'or_amount' => $orAmounts[$j-1],
                        'or_photo' => 'or-photos/vm8wtjh7G05yx1SzPm46RCpSMxUlEJiDNeC6YE8A.png',
                        'remarks' => 'Seeded remark for OR ' . $j . ' of disbursement ' . $disbursementIndex,
                        'created_at' => $orDate,
                        'updated_at' => $orDate,
                    ]);
                }
                $disbursementIndex++;
            }
            // 2 pending per barangay
            for ($i = 3; $i <= 4; $i++) {
                $dvAmount = 1000 * $i;
                $bank = $banks[($i - 1) % $bankCount] ?? $banks[0] ?? null;
                $bankId = $bank ? $bank->id : null;
                $disbursementDate = $julyDate->copy()->subDays($i);
                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $disbursementDate,
                    'dv_number' => 'DV-25-07-' . str_pad($disbursementIndex, 3, '0', STR_PAD_LEFT),
                    'cheque_number' => '20000' . (150 + $disbursementIndex),
                    'bank_id' => $bankId,
                    'payee' => 'Payee ' . $disbursementIndex,
                    'dv_amount' => $dvAmount,
                    'status' => 'Pending',
                    'liquidated_amount' => null,
                    'liquidated_at' => null,
                    'created_at' => $disbursementDate,
                    'updated_at' => $disbursementDate,
                ]);
                // No OR details for pending disbursements
                $disbursementIndex++;
            }
        }
    }
} 