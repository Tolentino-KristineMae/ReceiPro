<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Receipt extends Model
{
    protected $fillable = [
        'file_path',
        'category',
        'account_holder',
        'source_label',
        'ocr_status',
        'ocr_data',
        'match_status',
        'transaction_id',
        'batch_id',
        'cropped_image'
    ];

    protected $casts = [
        'ocr_data' => 'array',
        'created_at' => 'datetime',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
