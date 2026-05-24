<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountHolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'short_code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope to get only active account holders
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
