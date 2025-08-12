<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\TranAppropriation;

class RacReportController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
            'expense_class_id' => 'required|integer',
        ]);

        //change Order to your actual model
        // and adjust the fields accordingly
        $q = TranAppropriation::query()->whereBetween('created_at', [$data['from'], $data['to']]);

        $q->where('expense_class_id', $data['expense_class_id']);

        $rows = $q->orderBy('created_at')->get()->map(fn($o) => [
            'expense_type_id' => $o->expense_type_id,
            'expense_item_id' => $o->expense_item_id,
            'amount' => (float)$o->amount,
            'description' => $o->description,
            'status' => $o->status,
            'transaction_date' => $o->transaction_date->toDateString(),
            'user_id' => $o->user_id,
            'barangay_id' => $o->barangay_id,
            'budget_id' => $o->budget_id,
            'expense_class_id' => $o->expense_class_id,
            'expense_class_name' => $o->expenseClass->name ?? null,
            'expense_type_name' => $o->expenseType->name ?? null,
            'expense_item_name' => $o->expenseItem->name ?? null,
            'barangay_name' => $o->barangay->name ?? null,
            'budget_name' => $o->budget->name ?? null,
            'user_name' => $o->user->name ?? null,
            'barangay_id' => $o->barangay_id,
            'budget_id' => $o->budget_id,
            'expense_class_id' => $o->expense_class_id,
            'expense_type_id' => $o->expense_type_id,
            'expense_item_id' => $o->expense_item_id,
            'amount' => (float)$o->amount,
            'transaction_date' => $o->transaction_date->toDateString(),
            'description' => $o->description,
            'status' => $o->status,
            'user_id' => $o->user_id,
            'barangay_id' => $o->barangay_id,
            'budget_id' => $o->budget_id,
            'expense_class_name' => $o->expenseClass->name ?? null,
            'expense_type_name' => $o->expenseType->name ?? null,
            'expense_item_name' => $o->expenseItem->name ?? null,
            'user_name' => $o->user->name ?? null,
            'barangay_name' => $o->barangay->name ?? null,
            'budget_name' => $o->budget->name ?? null,
            'created_at' => $o->created_at,
            'updated_at' => $o->updated_at,
            'id' => $o->id,
            'expense_class_id' => $o->expense_class_id,
            'expense_type_id' => $o->expense_type_id,
            'expense_item_id' => $o->expense_item_id,
            'created_at' => $o->created_at->toDateString(),
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
