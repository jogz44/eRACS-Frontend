<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetAugmentationDetail extends Model
{
    protected $fillable = [
        'budget_augmentation_id',
        'expense_class_id',
        'expense_type_id',
        'expense_item_id',
        'amount',
        'particulars'
    ];

    protected $casts = [
        'amount' => 'decimal:2'
    ];

    public function budgetAugmentation(): BelongsTo
    {
        return $this->belongsTo(BudgetAugmentation::class);
    }

    public function expenseClass(): BelongsTo
    {
        return $this->belongsTo(LibExpenseClass::class);
    }

    public function expenseType(): BelongsTo
    {
        return $this->belongsTo(LibExpenseType::class);
    }

    public function expenseItem(): BelongsTo
    {
        return $this->belongsTo(LibExpenseItem::class);
    }
} 