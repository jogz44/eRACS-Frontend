<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Disbursement extends Model
{
    use HasFactory;

    protected $table = 'disbursements';

    protected $fillable = [
        'barangay_id',
        'date',
        'dv_number',
        'cheque_number',
        'bank_id',
        'payee',
        'dv_amount',
        'status',
        'liquidated_amount',
        'liquidated_at',
        'remarks',
        'rejection_remarks',
        'is_continuing',
        'user_id',
    ];

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function orDetails()
    {
        return $this->hasMany(DisbursementOrDetail::class);
    }

    public function bank()
    {
        return $this->belongsTo(LibBank::class, 'bank_id');
    }

    public function expenseDetails()
    {
        return $this->hasMany(TranExpenseDetail::class, 'disbursement_id');
    }

    public function cheque()
    {
        return $this->hasOne(LibCheque::class, 'disbursement_id');
    }

    public function adminReviews(): MorphMany
    {
        return $this->morphMany(AdminReview::class, 'reviewable');
    }
}
