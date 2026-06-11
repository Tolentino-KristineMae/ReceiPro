<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Receipt;
use App\Models\Transaction;

class BatchSyncService
{
    /**
     * Keep transaction.batch_id aligned with verified receipts in the same batch.
     * Returns a summary of repairs performed.
     */
    public function repairBatch(Batch $batch): array
    {
        $receipts = $batch->relationLoaded('receipts')
            ? $batch->receipts
            : $batch->receipts()->get();

        $verifiedTxIds = $receipts
            ->filter(fn ($r) => strtolower((string) $r->match_status) === 'verified' && $r->transaction_id)
            ->pluck('transaction_id')
            ->filter()
            ->unique()
            ->values();

        $fixedReceipts = 0;
        foreach ($receipts as $receipt) {
            if (strtolower((string) $receipt->match_status) === 'verified' && !$receipt->transaction_id) {
                $receipt->update(['match_status' => 'matched']);
                $fixedReceipts++;
            }
        }

        $orphaned = Transaction::where('batch_id', $batch->id)
            ->when($verifiedTxIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $verifiedTxIds))
            ->when($verifiedTxIds->isEmpty(), fn ($q) => $q)
            ->get();

        $unlinked = 0;
        foreach ($orphaned as $transaction) {
            $hasVerifiedReceipt = Receipt::where('batch_id', $batch->id)
                ->where('transaction_id', $transaction->id)
                ->where('match_status', 'verified')
                ->exists();

            if (!$hasVerifiedReceipt) {
                $transaction->update(['batch_id' => null, 'status' => 'pending']);
                $unlinked++;
            }
        }

        return [
            'fixed_receipts'      => $fixedReceipts,
            'unlinked_transactions' => $unlinked,
        ];
    }

    /** Repair every batch that has linked transactions. */
    public function repairAll(): array
    {
        $totalUnlinked = 0;
        $totalFixed = 0;
        $batchesTouched = 0;

        $batchIds = Transaction::whereNotNull('batch_id')
            ->distinct()
            ->pluck('batch_id');

        foreach ($batchIds as $batchId) {
            $batch = Batch::with('receipts')->find($batchId);
            if (!$batch) {
                continue;
            }
            $result = $this->repairBatch($batch);
            if ($result['unlinked_transactions'] > 0 || $result['fixed_receipts'] > 0) {
                $batchesTouched++;
            }
            $totalUnlinked += $result['unlinked_transactions'];
            $totalFixed += $result['fixed_receipts'];
        }

        return [
            'batches_touched'       => $batchesTouched,
            'unlinked_transactions' => $totalUnlinked,
            'fixed_receipts'        => $totalFixed,
        ];
    }

    /** Transactions linked to this batch in the ledger. */
    public function getLinkedTransactions(Batch $batch): array
    {
        return Transaction::where('batch_id', $batch->id)
            ->orderBy('amount', 'desc')
            ->get(['id', 'amount', 'reference', 'label', 'account_holder', 'status'])
            ->map(fn ($t) => [
                'id'             => $t->id,
                'amount'         => (float) $t->amount,
                'reference'      => $t->reference,
                'label'          => $t->label,
                'account_holder' => $t->account_holder,
                'status'         => $t->status,
            ])
            ->values()
            ->all();
    }
}
