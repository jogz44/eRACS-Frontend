<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'transaction_date' => 'date',
        'amount' => 'decimal:2'
    ];
    public function continuing()
    {
        return $this->belongsTo(ContAppropriation::class, 'tranAppropriation_id');
    }

    public function transaction()
    {
        return $this->hasMany(TranAppropriation::class, 'contAppropriation_id');
    }
}
