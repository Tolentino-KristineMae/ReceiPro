<?php

namespace App\Jobs;

use App\Models\Receipt;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessReceiptOcr implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Receipt $receipt)
    {
    }

    /** Kept for old queued jobs. Actual extraction runs in the browser. */
    public function handle(): void
    {
        // Never generate or overwrite financial data with placeholder OCR values.
        Receipt::whereKey($this->receipt->id)
            ->where('ocr_status', 'processing')
            ->whereNull('ocr_data')
            ->update(['ocr_status' => 'pending']);
    }
}
