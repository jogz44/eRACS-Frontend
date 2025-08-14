<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LibBooklet;
use App\Models\LibCheque;

class BookletAndChequeSeeder extends Seeder
{
    public function run(): void
    {
        // Banks to seed for
        $bankIds = [1, 2, 3];

        foreach ($bankIds as $bankId) {
            // Create 2 booklets per bank
            for ($b = 1; $b <= 2; $b++) {
                $startingNumber = 10000000+(1000 * $bankId + ($b * 100));
                $endingNumber   = $startingNumber + 9; // 10 cheques per booklet

                $booklet = LibBooklet::create([
                    'bank_id'              => $bankId,
                    'booklet_numb'         => "B{$bankId}-{$b}",
                    'starting_cheque_numb' => $startingNumber,
                    'ending_cheque_numb'   => $endingNumber,
                    'status'               => 'unused', 
                ]);

                // Generate cheques for this booklet
                for ($num = $startingNumber; $num <= $endingNumber; $num++) {
                    LibCheque::create([
                        'booklet_id'    => $booklet->id,
                        'cheque_number' => $num,
                        'status'        => 'unused', 
                    ]);
                }
            }
        }
    }
}
