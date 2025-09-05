<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\TranAppropriation;

class ReportController extends Controller
{
    public function getRacReport(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
            'expense_class_id' => 'required|integer',
            'barangay_id' => 'nullable|integer|exists:barangays,id',
        ]);

        // Determine barangay scope: explicit param (admin) or authenticated user's barangay
        $barangayId = $data['barangay_id'] ?? $request->user()?->barangay_id;
        
        $q = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem', 'details','details.disbursement'])
            ->when($barangayId, fn($qq) => $qq->where('barangay_id', $barangayId))
            ->whereHas('details.disbursement', function($query) use ($data) {
                $query->whereDate('date', '>=', $data['from'])
                      ->whereDate('date', '<=', $data['to']);
            });

        $q->where('expense_class_id', $data['expense_class_id']);

        $rows = $q->orderBy('transaction_date')->get()
            ->flatMap(function ($o) use ($data) {
                return $o->details->filter(function ($detail) use ($data) {
                    // Only include details where the disbursement date is within the range
                    $disb = $detail->disbursement;
                    if (!$disb || !$disb->date) return false;
                    
                    $disbDate = \Carbon\Carbon::parse($disb->date)->format('Y-m-d');
                    return $disbDate >= $data['from'] && $disbDate <= $data['to'];
                })->map(function ($detail) use ($o) {
                    $disb = $detail->disbursement;
                    return [
                        'accountTitle' => implode(' - ', array_filter([
                            $o->expenseType->name ?? null,
                            $o->expenseItem->name ?? null,
                        ])),
                        'appropriation' => (float) $o->amount,
                        'particular' => $detail?->particulars,
                        'dvNumber' => $disb?->dv_number,
                        'date' => $disb?->date,
                        'payee'    => $disb?->payee,
                        'dvAmount' => (float) ($disb?->dv_amount ?? 0), // DV amount for appropriation column
                        'amount'   => (float) ($detail?->amount ?? 0),
                    ];
                });
            })
            ->groupBy('dvNumber') // Group by DV number
            ->map(function ($group) {
                $firstItem = $group->first();
                $particulars = $group->pluck('particular')->filter()->unique()->implode(', ');
                
                // Debug logging for particulars
                \Log::info('RAC Particulars', [
                    'dvNumber' => $firstItem['dvNumber'],
                    'individual_particulars' => $group->pluck('particular')->toArray(),
                    'concatenated_particulars' => $particulars
                ]);
                
                // Calculate appropriation based on expense class - sum amounts for this specific class
                $classAppropriation = $group->sum('amount'); // Sum all amounts for this DV within this class
                
                // Debug logging to understand the data structure
                \Log::info('RAC Class Appropriation', [
                    'dvNumber' => $firstItem['dvNumber'],
                    'classAppropriation' => $classAppropriation,
                    'groupItems' => $group->pluck('accountTitle')->toArray(),
                    'groupAmounts' => $group->pluck('amount')->toArray()
                ]);
                
                // Create a base row with common fields
                $row = [
                    'particular' => $particulars,
                    'dvNumber' => $firstItem['dvNumber'],
                    'date' => $firstItem['date'],
                    'payee' => $firstItem['payee'],
                    'amount' => $group->sum('amount'), // Sum all amounts for this DV
                    'appropriation' => $classAppropriation, // Use the class-specific total amount
                ];
                
                // Add each account title as a separate column
                $group->each(function ($item) use (&$row) {
                    $accountTitle = $item['accountTitle'];
                    if ($accountTitle) {
                        // Create a unique key for this account title - preserve dashes, only replace spaces and special chars
                        $key = 'amount_' . strtolower(str_replace([' ', '&', '.', '(', ')'], ['_', '_', '_', '_', '_'], $accountTitle));
                        $row[$key] = $item['amount'];
                        
                        // Debug logging
                        \Log::info('RAC Account Title', [
                            'dvNumber' => $item['dvNumber'],
                            'accountTitle' => $accountTitle,
                            'key' => $key,
                            'amount' => $item['amount']
                        ]);
                    }
                });
                
                return $row;
            })
            ->values()
            ->sortBy('dvNumber')
            ->values();

        // Extract account titles and create key map
        $accountTitles = [];
        $accountTitleKeyMap = [];
        
        $rows->each(function ($row) use (&$accountTitles, &$accountTitleKeyMap) {
            foreach ($row as $key => $value) {
                if (str_starts_with($key, 'amount_')) {
                    // Convert key back to readable account title
                    $accountTitle = str_replace('amount_', '', $key);
                    $accountTitle = str_replace('_', ' ', $accountTitle);
                    $accountTitle = preg_replace('/\s+/', ' ', trim($accountTitle));
                    
                    if (!in_array($accountTitle, $accountTitles)) {
                        $accountTitles[] = $accountTitle;
                        $accountTitleKeyMap[$accountTitle] = $key;
                    }
                }
            }
        });

        $summary = [
            'count' => $rows->count(),
            'total' => round($rows->sum('amount'), 2),
            'range' => ['from' => $data['from'], 'to' => $data['to']],
        ];

        return response()->json([
            'data' => [
                'rows' => $rows,
                'filters' => $data,
                'summary' => $summary,
                'account_titles' => $accountTitles,
                'account_title_key_map' => $accountTitleKeyMap,
            ]
        ]);
    }

    
    public function getSacbReport(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
            'barangay_id' => 'nullable|integer|exists:barangays,id',
        ]);

        // Debug logging
        \Log::info('SACB Report Date Range', [
            'from' => $data['from'],
            'to' => $data['to'],
            'barangay_id' => $data['barangay_id'] ?? 'null'
        ]);

        // Determine barangay scope: explicit param (admin) or authenticated user's barangay
        $barangayId = $data['barangay_id'] ?? optional($request->user())->barangay_id;

        $q = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem','details.disbursement'])
            ->when($barangayId, fn($qq) => $qq->where('barangay_id', $barangayId))
            ->whereHas('details.disbursement', function($query) use ($data) {
                $query->whereDate('date', '>=', $data['from'])
                      ->whereDate('date', '<=', $data['to']);
            });

        $rows = $q->orderBy('transaction_date')->get()->map(function($o) use ($data) {
            // Filter details to only include those within the date range
            $filteredDetails = $o->details->filter(function ($detail) use ($data) {
                $disb = $detail->disbursement;
                if (!$disb || !$disb->date) return false;
                
                $disbDate = \Carbon\Carbon::parse($disb->date)->format('Y-m-d');
                return $disbDate >= $data['from'] && $disbDate <= $data['to'];
            });
            
            return [
                'expense'=> $o->expenseClass?->name,
                'order'=> $o->expenseClass?->order,
                'ppa' => implode(' - ', array_filter([
                    $o->expenseType?->name,
                    $o->expenseItem?->name
                ])),
                'appropriation'=> (float)$o->amount,
                'obligation'   => (float) $filteredDetails->sum('amount'), // Use filtered details
                'balance'      => (float) $o->amount - (float) $filteredDetails->sum('amount'),
            ];
        })->groupBy('ppa')   // group all rows by PPA
            ->map(function ($group) {
                return [
                    'expense'      => $group->first()['expense'],
                    'order'        => $group->first()['order'],
                    'ppa'          => $group->first()['ppa'],
                    'appropriation'=> $group->sum('appropriation'),
                    'obligation'   => $group->sum('obligation'),
                    'balance'      => $group->sum('appropriation') - $group->sum('obligation'),
                ];
            })
            ->values();

        $summary = [
            'count' => $rows->count(),
            'total_appropriation' => round($rows->sum('appropriation'), 2),
            'total_obligation' => round($rows->sum('obligation'), 2),
            'total_balance' => round($rows->sum('balance'), 2),
            'range' => ['from' => $data['from'], 'to' => $data['to']],
        ];

        return response()->json([
            'data' => [
                'rows' => $rows,
                'filters' => $data,
                'summary' => $summary,
            ]
        ]);
    }

    public function exportPdf(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
            'class_id' => 'nullable|integer',
            'download' => 'nullable|boolean',
        ]);

        $q = Order::query()->whereBetween('date', [$data['from'], $data['to']]);
        if (!empty($data['class_id'])) $q->where('class_id', $data['class_id']);

        $rows = $q->orderBy('date')->get()->map(fn($o) => [
            'date' => $o->date->toDateString(),
            'student' => $o->student_name,
            'class_id' => $o->class_id,
            'amount' => (float)$o->amount,
        ])->toArray();

        $summary = [
            'count' => count($rows),
            'total' => array_sum(array_column($rows, 'amount')),
            'range' => ['from' => $data['from'], 'to' => $data['to']],
        ];

        $pdf = Pdf::loadView('pdf.sales-report', [
            'summary' => $summary,
            'rows' => $rows,
        ])->setPaper('A4', 'portrait');

        $filename = 'sales-report_'.now()->format('Ymd_His').'.pdf';
        return $request->boolean('download', true) ? $pdf->download($filename) : $pdf->stream($filename);
    }
}
