<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetAugmentationDetail extends Model
{
    protected $fillable = [
        'budget_augmentation_id',
        'from_expense_class_id',
        'from_expense_type_id',
        'from_expense_item_id',
        'transfer_to_expense_class_id',
        'transfer_to_expense_type_id',
        'transfer_to_expense_item_id',
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

    public function fromExpenseClass(): BelongsTo
    {
        return $this->belongsTo(LibExpenseClass::class, 'from_expense_class_id');
    }

    public function fromExpenseType(): BelongsTo
    {
        return $this->belongsTo(LibExpenseType::class, 'from_expense_type_id');
    }

    public function fromExpenseItem(): BelongsTo
    {
        return $this->belongsTo(LibExpenseItem::class, 'from_expense_item_id');
    }

    public function transferToExpenseClass(): BelongsTo
    {
        return $this->belongsTo(LibExpenseClass::class, 'transfer_to_expense_class_id');
    }

    public function transferToExpenseType(): BelongsTo
    {
        return $this->belongsTo(LibExpenseType::class, 'transfer_to_expense_type_id');
    }

    public function transferToExpenseItem(): BelongsTo
    {
        return $this->belongsTo(LibExpenseItem::class, 'transfer_to_expense_item_id');
    }
} 