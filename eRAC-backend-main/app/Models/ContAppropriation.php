<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContAppropriation extends Model
{
    
    protected $fillable = [
        'description',
    ];
    public function continuingAccount()
    {
        return $this->hasMany(ContApproAccounts::class, 'tranAppropriation_id');
    }
}
