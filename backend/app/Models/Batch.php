<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Batch extends Model
{
    protected $fillable = [
        'batch_number',
        'name',
        'color',
        'status',
        'checker_status',
        'final_batch_number',
        'summary_data',
        'billing_data',
    ];

    protected $casts = [
        'summary_data' => 'array',
        'billing_data'  => 'array',
    ];

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
