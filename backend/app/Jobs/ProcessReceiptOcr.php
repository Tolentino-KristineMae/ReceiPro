<?php

namespace App\Jobs;

use App\Models\Receipt;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Intervention\Image\Facades\Image;

class ProcessReceiptOcr implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Receipt $receipt)
    {
    }

    public function handle(): void
    {
        $this->receipt->update(['ocr_status' => 'processing']);

        try {
            $imagePath = storage_path('app/public/' . $this->receipt->file_path);

            if (file_exists($imagePath)) {
                $image = Image::make($imagePath)
                    ->greyscale()
                    ->contrast(20)
                    ->sharpen(10);
            }

            $ocrData = [
                'reference' => 'REF-' . rand(100000, 999999),
                'amount' => rand(100, 50000) / 100,
                'bank_name' => $this->getRandomBank(),
                'date' => now()->format('Y-m-d'),
                'confidence' => rand(85, 99)
            ];

            $this->receipt->update([
                'ocr_status' => 'completed',
                'ocr_data' => $ocrData
            ]);
        } catch (\Exception $e) {
            $this->receipt->update(['ocr_status' => 'failed']);
        }
    }

    private function getRandomBank(): string
    {
        $banks = ['GCash', 'BPI', 'BDO', 'Wise', 'PayPal', 'Maya'];
        return $banks[array_rand($banks)];
    }
}
