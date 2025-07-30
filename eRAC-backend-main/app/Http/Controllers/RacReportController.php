<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class RacReportController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
            'user_id' => 'required|integer',
            'noted_by_id' => 'required|integer',
            'certified_by_id' => 'required|integer',
            'expence_id' => 'required|integer',

        ]);

        //change Order to your actual model
        // and adjust the fields accordingly
        $q = Order::query()->whereBetween('date', [$data['from'], $data['to']]);

        if (!empty($data['expence_id'])) {
            $q->where('expence_id', $data['expence_id']);
        }

        $rows = $q->orderBy('date')->get()->map(fn($o) => [
            'date' => $o->date->toDateString(),
            'student' => $o->student_name,
            'class_id' => $o->class_id,
            'amount' => (float)$o->amount,
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
