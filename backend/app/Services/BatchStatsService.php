<?php

namespace App\Services;

use App\Models\Batch;
use Illuminate\Support\Collection;

class BatchStatsService
{
    public function __construct(private BatchSyncService $syncService)
    {
    }
    public function parseOcrData($data): ?array
    {
        if (!$data) {
            return null;
        }
        if (is_array($data)) {
            return $data;
        }
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            return is_array($decoded) ? $decoded : null;
        }
        return null;
    }

    private function isCheckedStatus(?string $status): bool
    {
        $s = strtolower((string) $status);
        return in_array($s, ['verified', 'matched', 'flagged', 'not_found'], true);
    }

    public function calculateStats(Batch $batch): array
    {
        $receipts = $batch->receipts ?? collect();

        if ($receipts->isEmpty()) {
            return [
                'total'           => 0,
                'unsorted'        => 0,
                'needs_crop_input'=> 0,
                'ready_for_ocr'   => 0,
                'ocr_finished'    => 0,
                'checked'         => 0,
                'confirmed'       => 0,
                'verified'        => 0,
            ];
        }

        $unsorted = $receipts->filter(fn ($r) => !$r->category || $r->category === 'unsorted')->count();

        $needsCropInput = $receipts->filter(function ($r) {
            if (!$r->category || $r->category === 'unsorted') {
                return false;
            }
            $ocr = $this->parseOcrData($r->ocr_data);
            if ($r->category === 'others') {
                return !($ocr && ($ocr['manual'] ?? false) && (($ocr['amount'] ?? null) || ($ocr['reference'] ?? null)));
            }
            return !($r->cropped_image && strlen((string) $r->cropped_image) > 5);
        })->count();

        $readyForOcr = $receipts->filter(function ($r) {
            $ocr = $this->parseOcrData($r->ocr_data);
            $isOthersDone = $r->category === 'others' && $ocr && ($ocr['manual'] ?? false);
            $isGcashDone = $r->category === 'gcash' && $r->cropped_image && strlen((string) $r->cropped_image) > 5;
            return $isOthersDone || $isGcashDone;
        })->count();

        $ocrFinished = $receipts->filter(function ($r) {
            $ocr = $this->parseOcrData($r->ocr_data);
            if ($r->category === 'others' && ($ocr['manual'] ?? false)) {
                return true;
            }
            return $r->ocr_status === 'completed'
                || $r->ocr_status === 'processing'
                || ($ocr && !empty($ocr['raw_text']));
        })->count();

        $checked = $receipts->filter(fn ($r) => $this->isCheckedStatus($r->match_status))->count();
        $confirmed = $receipts->filter(fn ($r) =>
            strtolower((string) $r->match_status) === 'verified' && $r->transaction_id
        )->count();

        return [
            'total'            => $receipts->count(),
            'unsorted'         => $unsorted,
            'needs_crop_input' => $needsCropInput,
            'ready_for_ocr'    => $readyForOcr,
            'ocr_finished'     => $ocrFinished,
            'checked'          => $checked,
            'confirmed'        => $confirmed,
            'verified'         => $checked,
        ];
    }

    public function getOverallProgress(Batch $batch): int
    {
        $stats = $this->calculateStats($batch);
        $total = $stats['total'];
        if ($total === 0) {
            return 0;
        }

        $stageWeight = 100 / 8;
        $totalProgress = $stageWeight; // Uploading
        $totalProgress += (($total - $stats['unsorted']) / $total) * $stageWeight;
        $totalProgress += (($total - $stats['needs_crop_input']) / $total) * $stageWeight;
        $totalProgress += ($stats['ocr_finished'] / $total) * $stageWeight;
        $totalProgress += ($stats['checked'] / $total) * $stageWeight;

        if (in_array($batch->checker_status, ['finalized', 'summarized', 'billing_ready'], true)) {
            $totalProgress += $stageWeight;
        }
        if (in_array($batch->checker_status, ['summarized', 'billing_ready'], true)) {
            $totalProgress += $stageWeight;
        }
        if ($batch->checker_status === 'billing_ready') {
            $totalProgress += $stageWeight;
        }

        return (int) round($totalProgress);
    }

    public function getVerifiedClaims(Batch $batch): array
    {
        return ($batch->receipts ?? collect())
            ->filter(fn ($r) => strtolower((string) $r->match_status) === 'verified' && $r->transaction_id)
            ->map(function ($r) {
                $ocr = $this->parseOcrData($r->ocr_data) ?? [];
                $txAmount = $r->relationLoaded('transaction') && $r->transaction
                    ? (float) $r->transaction->amount
                    : null;

                return [
                    'receipt_id'     => $r->id,
                    'transaction_id' => $r->transaction_id,
                    'account_holder' => $r->account_holder,
                    'amount'         => $txAmount ?? (float) ($ocr['amount'] ?? 0),
                    'reference'      => $ocr['reference'] ?? ($r->transaction->reference ?? null),
                    'source_label'   => $r->source_label,
                ];
            })
            ->values()
            ->all();
    }

    public function summarizeVerificationResults(array $results): array
    {
        $summary = [
            'total'     => count($results),
            'confirmed' => 0,
            'matched'   => 0,
            'not_found' => 0,
            'duplicate' => 0,
        ];

        foreach ($results as $row) {
            $status = strtolower((string) ($row['verification_status'] ?? ''));
            if ($status === 'verified') {
                $summary['confirmed']++;
            } elseif ($status === 'matched') {
                $summary['matched']++;
            } elseif ($status === 'duplicate') {
                $summary['duplicate']++;
            } else {
                $summary['not_found']++;
            }
        }

        return $summary;
    }

    public function dashboardSummary(Collection $batches): array
    {
        return [
            'total_batches'     => $batches->count(),
            'completed_batches' => $batches->where('checker_status', 'billing_ready')->count(),
            'in_progress_batches' => $batches->filter(fn ($b) =>
                $b->checker_status !== 'billing_ready' && ($b->receipts?->count() ?? 0) > 0
            )->count(),
            'total_receipts'    => $batches->sum(fn ($b) => $b->receipts?->count() ?? 0),
        ];
    }

    public function summarizeBatchReceipts(Batch $batch): array
    {
        $receipts = $batch->receipts ?? collect();
        $summary = [
            'total'     => $receipts->count(),
            'confirmed' => 0,
            'matched'   => 0,
            'not_found' => 0,
            'duplicate' => 0,
        ];

        foreach ($receipts as $receipt) {
            $status = strtolower((string) $receipt->match_status);
            if ($status === 'verified') {
                $summary['confirmed']++;
            } elseif ($status === 'matched') {
                $summary['matched']++;
            } elseif ($status === 'duplicate') {
                $summary['duplicate']++;
            } elseif ($this->isCheckedStatus($status)) {
                $summary['not_found']++;
            }
        }

        return $summary;
    }

    public function enrichBatch(Batch $batch): Batch
    {
        $repair = $this->syncService->repairBatch($batch);
        if ($repair['fixed_receipts'] > 0 || $repair['unlinked_transactions'] > 0) {
            $batch->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc')->with('transaction');
            }]);
        }

        $batch->setAttribute('stats', $this->calculateStats($batch));
        $batch->setAttribute('progress', $this->getOverallProgress($batch));
        $batch->setAttribute('verified_claims', $this->getVerifiedClaims($batch));
        $batch->setAttribute('linked_transactions', $this->syncService->getLinkedTransactions($batch));
        $batch->setAttribute('verification_summary', $this->summarizeBatchReceipts($batch));
        $batch->setAttribute('sync_repair', $repair);
        return $batch;
    }
}
