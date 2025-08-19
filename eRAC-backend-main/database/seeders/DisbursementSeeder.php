<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\Barangay;
use App\Models\LibBank;
use App\Models\LibBooklet;
use App\Models\LibCheque;
use App\Models\DisbursementOrDetail;
use App\Models\TranExpenseDetail;
use App\Models\TranAppropriation;
use Carbon\Carbon;

class DisbursementSeeder extends Seeder
{
    public function run()
    {
        $barangays = Barangay::all();
        $now = Carbon::now();
        $yy = $now->format('y');
        $mm = $now->format('m');
        $dvCounter = 1; // global counter so DV-YY-MM-XXX continues cleanly

        foreach ($barangays as $barangay) {
            $banks = LibBank::where('barangay_id', $barangay->id)->get();
            if ($banks->isEmpty()) {
                continue;
            }

            // Use available appropriations from this barangay
            $appropriations = TranAppropriation::where('barangay_id', $barangay->id)
                ->where('status', 'committed')
                ->where('amount', '>', 0)
                ->get();
            if ($appropriations->isEmpty()) {
                continue;
            }

            // Three disbursements: Pending, Partial, Liquidated
            $statuses = ['Pending', 'Partial', 'Liquidated'];
            foreach ($statuses as $idx => $status) {
                $bank = $banks[$idx % $banks->count()];
                $date = $now->copy()->subDays(($idx + 1));

                // Find an available cheque number for this bank
                $chequeNumber = null;
                $bookletIds = LibBooklet::where('bank_id', $bank->id)->pluck('id');
                if ($bookletIds->isNotEmpty()) {
                    $cheque = LibCheque::whereIn('booklet_id', $bookletIds)
                        ->where('status', 'unused')
                        ->orderBy('cheque_number')
                        ->first();
                    if ($cheque) {
                        $chequeNumber = $cheque->cheque_number;
                    }
                }

                // If no cheque available for this bank, skip this disbursement
                if (!$chequeNumber) {
                    continue;
                }

                // Clean amounts (multiples of 100)
                $dvAmount = (int) (1000 * ($idx + 2)); // 2000, 3000, 4000

                $dvNumber = 'DV-' . $yy . '-' . $mm . '-' . str_pad($dvCounter, 3, '0', STR_PAD_LEFT);

                $disb = Disbursement::create([
                    'barangay_id' => $barangay->id,
                    'date' => $date->format('Y-m-d'),
                    'dv_number' => $dvNumber,
                    'cheque_number' => $chequeNumber,
                    'bank_id' => $bank->id,
                    'payee' => 'Seeded Payee ' . $dvCounter,
                    'dv_amount' => $dvAmount,
                    'status' => $status,
                    'liquidated_amount' => $status === 'Liquidated' ? $dvAmount : ($status === 'Partial' ? (int) ($dvAmount * 0.6) : null),
                    'liquidated_at' => $status === 'Pending' ? null : $date->format('Y-m-d'),
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                // Mark cheque as issued
                if (isset($cheque)) {
                    $cheque->update(['status' => 'issued']);
                }

                // Create 1-3 expense details that sum to dv_amount
                $this->seedExpenseDetails($disb->id, $appropriations, $dvAmount, $date);

                // OR details
                if ($status === 'Liquidated') {
                    // Sum equals dv_amount
                    $orSplits = [$dvAmount * 0.6, $dvAmount * 0.4];
                    $this->seedOrDetails($disb->id, $orSplits, $date, $dvCounter);
                } elseif ($status === 'Partial') {
                    // Sum is less than dv_amount (e.g., 60%)
                    $liq = (int) ($dvAmount * 0.6);
                    $orSplits = [$liq];
                    $this->seedOrDetails($disb->id, $orSplits, $date, $dvCounter);
                }

                $dvCounter++;
            }
        }
    }

    private function seedExpenseDetails(int $disbursementId, $appropriations, int $totalAmount, Carbon $baseDate): void
    {
        $remaining = $totalAmount;
        $num = rand(1, 3);
        $used = [];

        for ($i = 0; $i < $num && $remaining > 0; $i++) {
            $available = $appropriations->whereNotIn('id', $used);
            if ($available->isEmpty()) {
                break;
            }
            $appr = $available->random();
            $used[] = $appr->id;

            // Last line gets remainder, others split evenly
            if ($i === $num - 1) {
                $amount = $remaining;
            } else {
                $partsLeft = max(1, $num - $i);
                $amount = (int) floor($remaining / $partsLeft / 100) * 100; // keep multiples of 100
                if ($amount <= 0) {
                    $amount = min(100, $remaining);
                }
            }

            TranExpenseDetail::create([
                'disbursement_id' => $disbursementId,
                'appropriation_id' => $appr->id,
                'amount' => $amount,
                'particulars' => 'Seeded expense',
                'created_at' => $baseDate,
                'updated_at' => $baseDate,
            ]);

            $remaining -= $amount;
        }

        // If anything remains due to rounding, add one more detail
        if ($remaining > 0) {
            $appr = $appropriations->first();
            TranExpenseDetail::create([
                'disbursement_id' => $disbursementId,
                'appropriation_id' => $appr->id,
                'amount' => $remaining,
                'particulars' => 'Seeded expense (adjustment)',
                'created_at' => $baseDate,
                'updated_at' => $baseDate,
            ]);
        }
    }

    private function seedOrDetails(int $disbursementId, array $amounts, Carbon $baseDate, int $dvIndex): void
    {
        foreach ($amounts as $k => $amount) {
            $orDate = $baseDate->copy()->addDays($k + 1);
            DisbursementOrDetail::create([
                'disbursement_id' => $disbursementId,
                'or_date' => $orDate->format('Y-m-d'),
                'or_number' => 'OR-' . str_pad($dvIndex, 3, '0', STR_PAD_LEFT) . '-' . ($k + 1),
                'or_amount' => $amount,
                'or_photo' => 'or-photos/vm8wtjh7G05yx1SzPm46RCpSMxUlEJiDNeC6YE8A.png',
                'remarks' => 'Seeded OR detail',
                'created_at' => $orDate,
                'updated_at' => $orDate,
            ]);
        }
    }
} 