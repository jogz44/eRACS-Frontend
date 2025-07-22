<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Disbursement extends Model
{
    use HasFactory;

    protected $table = 'disbursements';

    protected $fillable = [
        'date',
        'dv_number',
        'cheque_number',
        'bank',
        'payee',
        'dv_amount',
        'status',
    ];
} 