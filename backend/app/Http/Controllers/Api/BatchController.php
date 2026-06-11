<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Receipt;
use App\Models\Transaction;
use App\Services\BatchStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BatchController extends Controller
{
    public function __construct(private BatchStatsService $statsService)
    {
    }

    private function loadBatchWithReceipts(Batch $batch): Batch
    {
        return $batch->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc')->with('transaction');
        }]);
    }

    private function respondWithBatch(Batch $batch)
    {
        return response()->json(
            $this->statsService->enrichBatch($this->loadBatchWithReceipts($batch))
        );
    }

    /** List all batches with their receipts */
    public function index()
    {
        $batches = Batch::with(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc')->with('transaction');
        }])->orderBy('created_at', 'desc')->get();

        $enriched = $batches->map(fn (Batch $batch) => $this->statsService->enrichBatch($batch));

        return response()->json([
            'batches'   => $enriched,
            'dashboard' => $this->statsService->dashboardSummary($batches),
        ]);
    }

    /** Create a named batch (before uploading receipts) */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|unique:batches,name',
        ], [
            'name.unique' => 'A batch with this number already exists.',
        ]);

        $count = Batch::count() + 1;
        $name = $request->name ?: 'Batch #' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $batch = Batch::create([
            'batch_number'   => 'BATCH-' . now()->format('Ymd-His') . '-' . Str::random(4),
            'name'           => $name,
            'checker_status' => 'open',
        ]);

        return response()->json($batch, 201);
    }

    public function update(Request $request, Batch $batch)
    {
        $request->validate([
            'name' => 'nullable|string|unique:batches,name,' . $batch->id,
        ], [
            'name.unique' => 'A batch with this number already exists.',
        ]);

        $batch->update($request->only(['name', 'checker_status', 'summary_data', 'billing_data']));

        return $this->respondWithBatch($batch->fresh());
    }

    /** Show a single batch with all receipts */
    public function show(Request $request, Batch $batch)
    {
        $batch = $this->loadBatchWithReceipts($batch);
        $filter = (string) $request->get('filter', 'all');
        $enriched = $this->statsService->enrichBatch($batch);

        if ($filter !== 'all') {
            $filtered = $batch->receipts->filter(function ($receipt) use ($filter) {
                return match ($filter) {
                    'pending'   => $receipt->ocr_status === 'pending',
                    'completed' => $receipt->ocr_status === 'completed',
                    'gcash'     => $receipt->category === 'gcash',
                    'others'    => $receipt->category === 'others' || !$receipt->category,
                    default     => true,
                };
            })->values();
            $enriched->setRelation('receipts', $filtered);
        }

        return response()->json($enriched);
    }

    /** Update checker_status: open → claiming → verified → finalized → summarized → billing_ready */
    public function updateStatus(Request $request, Batch $batch)
    {
        $request->validate([
            'checker_status' => 'required|in:open,claiming,verified,finalized,summarized,billing_ready',
        ]);

        $data = ['checker_status' => $request->checker_status];

        // Persist summary figures when moving to summarized
        if ($request->has('summary_data')) {
            $data['summary_data'] = $request->summary_data;
        }

        // Persist billing breakdown when moving to billing_ready
        if ($request->has('billing_data')) {
            $data['billing_data'] = $request->billing_data;
        }

        // On finalization: assign final batch number AND link matching transactions
        if ($request->checker_status === 'finalized' && !$batch->final_batch_number) {
            $count = Batch::whereNotNull('final_batch_number')->count() + 1;
            $data['final_batch_number'] = 'B-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $batch->update($data);

            // Only link transactions that were explicitly verified during the Run Check step
            $batch->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }]);
            foreach ($batch->receipts as $receipt) {
                if ($receipt->batch_id !== $batch->id) {
                    continue;
                }

                if ($receipt->match_status !== 'verified' || !$receipt->transaction_id) {
                    continue;
                }

                $transaction = \App\Models\Transaction::find($receipt->transaction_id);
                if (!$transaction) {
                    continue;
                }

                // Skip if already claimed by a different batch
                if ($transaction->batch_id && $transaction->batch_id !== $batch->id) {
                    continue;
                }

                // Require OCR amount to match transaction amount before linking
                $ocrData = $receipt->ocr_data ?? [];
                $ocrAmount = isset($ocrData['amount']) ? (float) $ocrData['amount'] : null;
                if ($ocrAmount === null || abs((float) $transaction->amount - $ocrAmount) >= 0.01) {
                    continue;
                }

                $transaction->update(['batch_id' => $batch->id]);
            }

            return $this->respondWithBatch($batch->fresh());
        }

        $batch->update($data);

        // When billing is complete, mark only verified linked transactions as completed
        if ($request->checker_status === 'billing_ready') {
            $verifiedTxIds = $batch->receipts()
                ->where('match_status', 'verified')
                ->whereNotNull('transaction_id')
                ->pluck('transaction_id');

            if ($verifiedTxIds->isNotEmpty()) {
                Transaction::where('batch_id', $batch->id)
                    ->whereIn('id', $verifiedTxIds)
                    ->update(['status' => 'completed']);
            }

            Transaction::where('batch_id', $batch->id)
                ->when($verifiedTxIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $verifiedTxIds))
                ->update(['batch_id' => null, 'status' => 'pending']);
        }

        return $this->respondWithBatch($batch->fresh());
    }

    /** Update source_label on a receipt (for manual Others entries) */
    public function updateReceiptLabel(Request $request, Batch $batch, Receipt $receipt)
    {
        $request->validate([
            'source_label' => 'required|string|in:Int,Go Tyme,Unionbank,Other',
            'amount'       => 'nullable|numeric',
            'reference'    => 'nullable|string',
            'date'         => 'nullable|string',
        ]);

        $receipt->update([
            'source_label' => $request->source_label,
            'ocr_data'     => array_merge($receipt->ocr_data ?? [], [
                'amount'    => $request->amount,
                'reference' => $request->reference,
                'date'      => $request->date,
            ]),
            'ocr_status' => 'completed',
        ]);

        return response()->json($receipt->fresh());
    }

    /** Manually verify a receipt and link to a transaction */
    public function manualVerify(Request $request, Batch $batch, Receipt $receipt)
    {
        $request->validate([
            'transaction_id' => 'required|exists:transactions,id'
        ]);

        $transaction = \App\Models\Transaction::findOrFail($request->transaction_id);

        // Update receipt: mark verified, link transaction, update ocr_data with confirmed ref/amount
        $ocrData = $receipt->ocr_data ?? [];
        $ocrData['reference'] = $transaction->reference ?? $transaction->label ?? $ocrData['reference'] ?? null;
        $ocrData['amount']    = $transaction->amount ?? $ocrData['amount'] ?? 0;

        // Reject if this transaction is already verified in another batch
        if ($transaction->batch_id && $transaction->batch_id !== $batch->id) {
            return response()->json(['message' => 'Transaction is already claimed by another batch.'], 422);
        }

        $ocrAmount = isset($ocrData['amount']) ? (float) $ocrData['amount'] : null;
        if ($ocrAmount !== null && abs((float) $transaction->amount - $ocrAmount) >= 0.01) {
            return response()->json(['message' => 'Transaction amount does not match receipt amount.'], 422);
        }

        $claimedElsewhere = Receipt::where('transaction_id', $transaction->id)
            ->where('batch_id', '!=', $batch->id)
            ->where('match_status', 'verified')
            ->exists();

        if ($claimedElsewhere) {
            return response()->json(['message' => 'Transaction is already verified in another batch.'], 422);
        }

        $receipt->update([
            'match_status'   => 'verified',
            'transaction_id' => $transaction->id,
            'ocr_data'       => $ocrData,
        ]);

        // batch_id is stamped on the transaction only when the batch is finalized

        return response()->json($receipt->fresh());
    }

    public function destroy(Batch $batch)
    {
        // Delete all associated receipts first
        $batch->receipts()->delete();
        
        $batch->delete();

        // 1. Re-sequence final_batch_number for all remaining finalized batches
        $finalizedBatches = Batch::whereNotNull('final_batch_number')
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($finalizedBatches as $index => $b) {
            $newNumber = 'B-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            if ($b->final_batch_number !== $newNumber) {
                $b->update(['final_batch_number' => $newNumber]);
            }
        }

        // 2. Re-sequence display names for non-finalized batches that follow the "Batch #XXX" pattern
        $openBatches = Batch::whereNull('final_batch_number')
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($openBatches as $index => $b) {
            // Only update if the name follows the "Batch #XXX" pattern
            if (preg_match('/^Batch #\d+$/', $b->name)) {
                $newName = 'Batch #' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                if ($b->name !== $newName) {
                    $b->update(['name' => $newName]);
                }
            }
        }

        return response()->json(['message' => 'Deleted and batches re-sequenced']);
    }

    /** Reset a batch — clears all checker progress, unlinking transactions and resetting receipt statuses */
    public function reset(Batch $batch)
    {
        DB::transaction(function () use ($batch) {
            $receipts = $batch->receipts()->get();
            $linkedTxIds = $receipts->pluck('transaction_id')->filter()->unique()->values();

            foreach ($receipts as $receipt) {
                if ($receipt->cropped_image) {
                    Storage::disk('public')->delete($receipt->cropped_image);
                }
            }

            Transaction::where('batch_id', $batch->id)
                ->update(['batch_id' => null, 'status' => 'pending']);

            if ($linkedTxIds->isNotEmpty()) {
                Transaction::whereIn('id', $linkedTxIds)
                    ->where(function ($query) use ($batch) {
                        $query->whereNull('batch_id')
                            ->orWhere('batch_id', $batch->id);
                    })
                    ->update(['batch_id' => null, 'status' => 'pending']);
            }

            $batch->receipts()->update([
                'match_status'   => 'unmatched',
                'transaction_id' => null,
                'ocr_status'     => 'pending',
                'ocr_data'       => null,
                'cropped_image'  => null,
                'category'       => 'unsorted',
                'account_holder' => null,
                'source_label'   => null,
            ]);

            $batch->update([
                'checker_status'     => 'open',
                'final_batch_number' => null,
                'summary_data'       => null,
                'billing_data'       => null,
            ]);
        });

        // Re-sequence final_batch_numbers for remaining finalized batches
        $finalizedBatches = Batch::whereNotNull('final_batch_number')
            ->orderBy('created_at', 'asc')
            ->get();
        foreach ($finalizedBatches as $index => $b) {
            $newNumber = 'B-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            if ($b->final_batch_number !== $newNumber) {
                $b->update(['final_batch_number' => $newNumber]);
            }
        }

        return response()->json([
            'message' => 'Batch reset successfully',
            'batch'   => $this->statsService->enrichBatch($batch->fresh()->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])),
        ]);
    }

    /** Run verification check and match with transactions using existing OCR data */
    public function process(Batch $batch)
    {
        $batch->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]);
        
        $results = [];
        foreach ($batch->receipts as $receipt) {
            // Preserve receipts that were already manually confirmed
            if ($receipt->match_status === 'verified' && $receipt->transaction_id) {
                $ocrData = $receipt->ocr_data ?? [];
                $results[] = [
                    'receipt'             => $receipt->fresh(),
                    'amount'              => $ocrData['amount'] ?? 0,
                    'reference'           => $ocrData['reference'] ?? 'N/A',
                    'date'                => $ocrData['date'] ?? 'N/A',
                    'confidence'          => $ocrData['confidence'] ?? 0,
                    'manualEntry'         => false,
                    'verification_status' => 'verified',
                    'match_details'       => null,
                ];
                continue;
            }

            // Use existing OCR data saved from frontend
            $ocrData = $receipt->ocr_data;
            
            if (!$ocrData) {
                // Fallback if frontend OCR didn't save for some reason
                $ocrData = [
                    'reference' => 'MISSING',
                    'amount' => 0,
                    'date' => null
                ];
            }

            // Transaction Matching Logic (Phase 4: Run Check)
            // Auto-match uses exact reference/label + amount only; user must Confirm to verify
            $isMatched = false;
            $matchDetails = null;

            if ($ocrData['reference'] && trim($ocrData['reference']) !== 'MISSING') {
                // Query the Transactions table to find a match
                // For GCash: match reference/label, amount, and account_holder
                // For others: match reference/label and amount (account_holder may be 'OTHERS')
                // If the full reference doesn't match, allow a partial match on the last 4 or 5 digits.
                $reference = trim($ocrData['reference']);
                $digitReference = preg_replace('/\D+/', '', $reference);
                $partialMatches = [];
                if (strlen($digitReference) >= 5) {
                    $partialMatches[] = substr($digitReference, -5);
                }
                if (strlen($digitReference) >= 4) {
                    $partialMatches[] = substr($digitReference, -4);
                }
                $partialMatches = array_unique($partialMatches);

                \Log::info("Verification attempt for receipt {$receipt->id}: ref='{$reference}', amount={$ocrData['amount']}, category={$receipt->category}, account_holder=" . ($receipt->account_holder ?? 'null') . ", source_label=" . ($receipt->source_label ?? 'null'));

                // ── Duplicate detection: check if this ref+amount is already claimed by another batch ──
                $duplicateQuery = \App\Models\Transaction::whereNotNull('batch_id')
                    ->whereRaw('ABS(amount - ?) < 0.01', [$ocrData['amount'] ?? 0])
                    ->where(function($q) use ($reference, $partialMatches) {
                        $q->where('reference', $reference)
                          ->orWhere('label', $reference);
                        foreach ($partialMatches as $part) {
                            $q->orWhere('reference', 'like', '%' . $part)
                              ->orWhere('label', 'like', '%' . $part);
                        }
                    });
                if ($receipt->category === 'gcash') {
                    $duplicateQuery->where('account_holder', $receipt->account_holder);
                }
                $duplicateTx = $duplicateQuery->with('batch')->first();

                if ($duplicateTx && $duplicateTx->batch_id !== $batch->id) {
                    // Already claimed by a different batch
                    $claimedBatch = $duplicateTx->batch;
                    $receipt->update(['match_status' => 'flagged']);
                    $results[] = [
                        'receipt'             => $receipt->fresh(),
                        'amount'              => $ocrData['amount'] ?? 0,
                        'reference'           => $ocrData['reference'] ?? 'N/A',
                        'date'                => $ocrData['date'] ?? 'N/A',
                        'confidence'          => $ocrData['confidence'] ?? 0,
                        'manualEntry'         => false,
                        'verification_status' => 'duplicate',
                        'match_details'       => [
                            'duplicate'        => true,
                            'claimed_batch_id' => $duplicateTx->batch_id,
                            'claimed_batch'    => $claimedBatch ? ($claimedBatch->final_batch_number ?? $claimedBatch->name ?? "Batch #{$duplicateTx->batch_id}") : "Batch #{$duplicateTx->batch_id}",
                            'transaction_id'   => $duplicateTx->id,
                        ],
                    ];
                    continue;
                }

                $query = \App\Models\Transaction::whereNull('batch_id')
                    ->whereRaw('ABS(amount - ?) < 0.01', [$ocrData['amount'] ?? 0])
                    ->where(function($subQuery) use ($reference, $receipt) {
                        // Exact match on reference or label only (no partial digit matching)
                        $subQuery->where('reference', $reference)
                                ->orWhere('label', $reference);

                        // For others category, also check if source_label matches transaction label
                        if ($receipt->category === 'others' && $receipt->source_label) {
                            $subQuery->orWhere('label', trim($receipt->source_label));
                        }
                    });

                // Only match account_holder for GCash category
                if ($receipt->category === 'gcash') {
                    $query->where('account_holder', $receipt->account_holder);
                }

                $transaction = $query->first();
                \Log::info("Verification result for receipt {$receipt->id}: " . ($transaction ? "FOUND transaction {$transaction->id} (ref: {$transaction->reference}, label: {$transaction->label})" : "NOT FOUND"));

                if ($transaction) {
                    $isMatched = true;
                    $matchDetails = [
                        'bank' => $receipt->category === 'gcash' ? 'GCash' : ($receipt->source_label ?? 'Bank'),
                        'timestamp' => $transaction->transaction_date ? $transaction->transaction_date->format('H:i') : now()->format('H:i'),
                        'transaction' => $transaction,
                    ];
                } else {
                    // Find recommended transactions (unclaimed only, must match amount)
                    $potentialMatches = \App\Models\Transaction::whereNull('batch_id')
                        ->whereRaw('ABS(amount - ?) < 0.01', [$ocrData['amount'] ?? 0])
                        ->orderByRaw("CASE 
                            WHEN reference = ? THEN 1 
                            WHEN label = ? THEN 2
                            ELSE 3 END", [$reference, $reference])
                        ->limit(5)
                        ->get();
                    
                    \Log::info("Potential matches for receipt {$receipt->id} (amount={$ocrData['amount']}): count=" . $potentialMatches->count());

                    $matchDetails = [
                        'potential_matches' => $potentialMatches
                    ];
                }
            }

            $verificationStatus = $isMatched ? 'matched' : 'flagged';

            $oldTxId = $receipt->transaction_id;

            // Save check result — only manualVerify may set match_status to 'verified'
            $receipt->update([
                'match_status'   => $verificationStatus,
                'transaction_id' => null,
            ]);

            if ($oldTxId) {
                Transaction::where('id', $oldTxId)
                    ->where('batch_id', $batch->id)
                    ->update(['batch_id' => null, 'status' => 'pending']);
            }

            $results[] = [
                'receipt'     => $receipt->fresh(),
                'amount'      => $ocrData['amount'] ?? 0,
                'reference'   => $ocrData['reference'] ?? 'N/A',
                'date'        => $ocrData['date'] ?? 'N/A',
                'confidence'  => $ocrData['confidence'] ?? 0,
                'manualEntry' => false,
                'verification_status' => $verificationStatus,
                'match_details' => $matchDetails
            ];
        }

        $batch->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]);

        return response()->json([
            'results' => $results,
            'summary' => $this->statsService->summarizeVerificationResults($results),
            'batch'   => $this->statsService->enrichBatch($batch->fresh()->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])),
        ]);
    }
}
