<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Receipt;
use App\Models\Transaction;
use Illuminate\Support\Facades\Cache;

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

        $invalidReceiptIds = $receipts
            ->filter(fn ($r) => strtolower((string) $r->match_status) === 'verified' && !$r->transaction_id)
            ->pluck('id');
        $fixedReceipts = $invalidReceiptIds->isEmpty() ? 0 : Receipt::whereIn('id', $invalidReceiptIds)
            ->whereNull('transaction_id')
            ->whereRaw('LOWER(match_status) = ?', ['verified'])
            ->update(['match_status' => 'matched']);

        // Check the current database state in the same UPDATE. Avoid a query and
        // model write for every orphan, and preserve transactions with verified claims.
        $unlinked = Transaction::where('batch_id', $batch->id)
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')->from('receipts')
                    ->whereColumn('receipts.transaction_id', 'transactions.id')
                    ->whereColumn('receipts.batch_id', 'transactions.batch_id')
                    ->whereRaw('LOWER(receipts.match_status) = ?', ['verified']);
            })
            ->update(['batch_id' => null, 'status' => 'pending']);

        if ($unlinked > 0) {
            Cache::forget('transactions_report');
            $batch->unsetRelation('transactions');
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
        $transactions = $batch->relationLoaded('transactions')
            ? $batch->transactions->sortByDesc('amount')->values()
            : Transaction::where('batch_id', $batch->id)->orderBy('amount', 'desc')
                ->get(['id', 'amount', 'reference', 'label', 'account_holder', 'status']);

        return $transactions->map(fn ($t) => [
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
