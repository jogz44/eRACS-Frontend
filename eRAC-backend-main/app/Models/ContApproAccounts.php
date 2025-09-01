<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContApproAccounts extends Model
{
    protected $fillable = [
        'contAppropriation_id',
        'tranAppropriation_id',
        'remainingBalance',
        'continuingYear',
        'status',
        'user_id'
    ];

    protected $casts = [
        'remainingBalance' => 'decimal:2'
    ];

    public function continuingAppropriation()
    {
        return $this->belongsTo(ContAppropriation::class, 'contAppropriation_id');
    }

    public function transactionAppropriation()
    {
        return $this->belongsTo(TranAppropriation::class, 'tranAppropriation_id');
    }

    public function user()
    {
        return $this->belongsTo(BarangayUser::class);
    }
}
