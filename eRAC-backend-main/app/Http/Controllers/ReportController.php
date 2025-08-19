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
        ]);

        
        $q = TranAppropriation::query()->whereBetween('transaction_date', [$data['from'], $data['to']]);

        $q->where('expense_class_id', $data['expense_class_id']);

        $rows = $q->orderBy('transaction_date')->get()->map(fn($o) => [
            'accountTitle' => $o->expenseType->name ?? null + $o->expenseItem->name ?? null,
            'appropriation' => (float)$o->amount,

            'dvNumber' => $o->data,//disbursmnet
            'date' => $o->toDateString(),//disbursmnet
            'payee' => $o->data,//disbursmnet
            'amount' => $o->data,//disbursmnet
        ])->values();

        $summary = [
            'count' => $rows->count(),
            'total' => round($rows->sum('amount'), 2),
            'range' => ['from' => $data['from'], 'to' => $data['to']],
        ];

        return response()->json([
            'filters' => $data,
            'summary' => $summary,
            'rows' => $rows,
        ]);
    }

    
    public function getSacbReport(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        
        $q = TranAppropriation::with(['expenseClass', 'expenseType', 'expenseItem','details.disbursement'])
            ->whereBetween('transaction_date', [$data['from'], $data['to']]);

        //$q->where('expense_class_id', $data['expense_class_id']);

        $rows = $q->orderBy('transaction_date')->get()->map(fn($o) => [
            'expense'=> $o->expenseClass?->name,
            'order'=> $o->expenseClass?->order,
            'ppa' => implode(' - ', array_filter([
                $o->expenseType?->name,
                $o->expenseItem?->name
            ])),
            'appropriation'=> (float)$o->amount,
            'obligation'   => (float) $o->details->sum(fn($d) => $d->disbursement?->dv_amount ?? 0),
            'balance'      => (float) $o->amount - (float) $o->details->sum(fn($d) => $d->disbursement?->dv_amount ?? 0),
        ])->values();

        $summary = [
            'count' => $rows->count(),
            'total' => round($rows->sum('appropriation'), 2),
            'total' => round($rows->sum('obligation'), 2),
            'total' => round($rows->sum('balance'), 2),
            'range' => ['from' => $data['from'], 'to' => $data['to']],
        ];

        return response()->json([
            'rows' => $rows,
            'filters' => $data,
            'summary' => $summary,
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
