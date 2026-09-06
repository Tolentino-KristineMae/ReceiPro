<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\FeeCalculator;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_date',
        'account',
        'account_holder',
        'entry_type',
        'amount',
        'fee',
        'net_amount',
        'opening_balance',
        'running_balance',
        'reference',
        'label',
        'source_type',
        'status',
        'batch_id',
        'denominations'
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'fee'             => 'decimal:2',
        'net_amount'      => 'decimal:2',
        'opening_balance' => 'decimal:2',
        'running_balance' => 'decimal:2',
        'denominations'   => 'array',
        'transaction_date' => 'date',
    ];

    protected $attributes = [
        'opening_balance' => 0,
        'running_balance' => 0,
        'fee' => 0,
    ];

    protected static function booted()
    {
        static::saving(function ($transaction) {
            $transaction->fee = FeeCalculator::calculate($transaction->amount);
            $transaction->net_amount = $transaction->amount - $transaction->fee;
            $transaction->denominations = self::suggestDenominations($transaction->amount);

            // running_balance = opening_balance ± amount (credit adds, debit subtracts)
            // Default opening_balance to 0 if null
            $openingBalance = $transaction->opening_balance ?? 0;
            $signed = $transaction->entry_type === 'debit'
                ? -abs($transaction->amount)
                : abs($transaction->amount);
            $transaction->running_balance = $openingBalance + $signed;
        });
    }

    public static function suggestDenominations($amount): array
    {
        $denominations = [];
        $remaining = (float) ($amount ?? 0);

        if ($remaining >= 1000) {
            $count = floor($remaining / 1000);
            $denominations['1000'] = (int) $count;
            $remaining -= $count * 1000;
        }

        if ($remaining >= 500) {
            $count = floor($remaining / 500);
            $denominations['500'] = (int) $count;
            $remaining -= $count * 500;
        }

        if ($remaining >= 100) {
            $count = floor($remaining / 100);
            $denominations['100'] = (int) $count;
        }

        return $denominations;
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }
}
