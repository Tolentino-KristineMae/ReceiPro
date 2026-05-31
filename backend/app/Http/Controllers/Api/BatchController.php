<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BatchController extends Controller
{
    /** List all batches with their receipts */
    public function index()
    {
        // 1. Fetch all batches in chronological order to check/fix naming
        $allBatches = Batch::orderBy('created_at', 'asc')->get();
        
        $needsFix = false;
        $seenNames = [];
        $seenFinals = [];
        $finalizedIndex = 0;
        foreach ($allBatches as $index => $b) {
            $expectedName = 'Batch #' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            $expectedFinal = null;
            
            if ($b->final_batch_number) {
                $finalizedIndex++;
                $expectedFinal = 'B-' . str_pad($finalizedIndex, 4, '0', STR_PAD_LEFT);
            }

            // Check Display Name
            if (preg_match('/^Batch #\d+$/', $b->name)) {
                if ($b->name !== $expectedName || in_array($b->name, $seenNames)) {
                    $needsFix = true;
                    break;
                }
                $seenNames[] = $b->name;
            }

            // Check Final Batch Number
            if ($b->final_batch_number) {
                if ($b->final_batch_number !== $expectedFinal || in_array($b->final_batch_number, $seenFinals)) {
                    $needsFix = true;
                    break;
                }
                $seenFinals[] = $b->final_batch_number;
            }
        }

        // 2. If duplicates or gaps found, perform a deep re-sequence
        if ($needsFix) {
            \Log::info("Duplicate or gap detected in batch names. Re-sequencing...");
            $finalizedCount = 0;
            foreach ($allBatches as $index => $b) {
                // Fix Display Name
                if (preg_match('/^Batch #\d+$/', $b->name)) {
                    $newName = 'Batch #' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                    if ($b->name !== $newName) {
                        $b->update(['name' => $newName]);
                    }
                }

                // Fix Final Batch Number (B-XXXX)
                if ($b->final_batch_number) {
                    $finalizedCount++;
                    $newFinal = 'B-' . str_pad($finalizedCount, 4, '0', STR_PAD_LEFT);
                    if ($b->final_batch_number !== $newFinal) {
                        $b->update(['final_batch_number' => $newFinal]);
                    }
                }
            }
        }

        // 3. Return final list in descending order for the dashboard
        $batches = Batch::with(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }])->orderBy('created_at', 'desc')->get();
        
        return response()->json($batches);
    }

    /** Create a named batch (before uploading receipts) */
    public function store(Request $request)
    {
        // Find the highest sequence number among auto-generated names
        $allBatches = Batch::all();
        $maxNum = 0;
        foreach ($allBatches as $b) {
            if (preg_match('/Batch #(\d+)/', $b->name, $matches)) {
                $num = (int)$matches[1];
                if ($num > $maxNum) $maxNum = $num;
            }
        }
        
        $name = $request->name ?: 'Batch #' . str_pad($maxNum + 1, 3, '0', STR_PAD_LEFT);

        $batch = Batch::create([
            'batch_number'   => 'BATCH-' . now()->format('Ymd-His') . '-' . Str::random(4),
            'name'           => $name,
            'checker_status' => 'open',
        ]);

        return response()->json($batch, 201);
    }

    /** Show a single batch with all receipts */
    public function show(Batch $batch)
    {
        return response()->json($batch->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]));
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
        if ($request->checker_status === 'finalized') {
            if (!$batch->final_batch_number) {
                $count = Batch::whereNotNull('final_batch_number')->count() + 1;
                $data['final_batch_number'] = 'B-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }

            $batch->update($data);

            // For each receipt in this batch, find a matching transaction and stamp it
            $batch->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }]);

            foreach ($batch->receipts as $receipt) {
                // If already linked, skip
                if ($receipt->transaction_id) continue;

                $ocrData = $receipt->ocr_data;
                if (!$ocrData || !isset($ocrData['amount'])) continue;

                $reference = trim($ocrData['reference'] ?? '');
                $amount = (float)$ocrData['amount'];
                $holder = $receipt->account_holder;

                if ($amount <= 0) continue;

                // Robust Matching Logic (Same as in process method)
                $digitReference = preg_replace('/\D+/', '', $reference);
                $partialMatches = [];
                if (strlen($digitReference) >= 5) $partialMatches[] = substr($digitReference, -5);
                if (strlen($digitReference) >= 4) $partialMatches[] = substr($digitReference, -4);
                $partialMatches = array_unique($partialMatches);

                $query = \App\Models\Transaction::where('amount', $amount)
                    ->whereNull('batch_id') // Only link unlinked transactions
                    ->where(function($subQuery) use ($reference, $partialMatches, $receipt) {
                        if ($reference && $reference !== 'MISSING') {
                            $subQuery->where('reference', $reference)
                                    ->orWhere('label', $reference);

                            foreach ($partialMatches as $part) {
                                $subQuery->orWhere('reference', 'like', '%' . $part)
                                        ->orWhere('label', 'like', '%' . $part);
                            }
                        }

                        if ($receipt->category === 'others' && $receipt->source_label) {
                            $subQuery->orWhere('label', trim($receipt->source_label));
                        }
                    });

                if ($receipt->category === 'gcash' && $holder) {
                    $query->where('account_holder', $holder);
                }

                $transaction = $query->first();

                if ($transaction) {
                    $receipt->update([
                        'transaction_id' => $transaction->id,
                        'match_status'   => 'verified'
                    ]);
                    $transaction->update(['batch_id' => $batch->id]);
                    \Log::info("Auto-linked receipt {$receipt->id} to transaction {$transaction->id} during finalization");
                }
            }

            return response()->json($batch->fresh()->load(['receipts' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }]));
        }

        $batch->update($data);

        // When billing is complete, mark all linked transactions as 'completed'
        if ($request->checker_status === 'billing_ready') {
            \App\Models\Transaction::where('batch_id', $batch->id)
                ->update(['status' => 'completed']);
        }

        return response()->json($batch->fresh()->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]));
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

        $receipt->update([
            'match_status' => 'verified',
            'transaction_id' => $transaction->id
        ]);

        // Link the transaction to this batch
        $transaction->update(['batch_id' => $batch->id]);

        return response()->json($receipt->fresh());
    }

    public function destroy(Batch $batch)
    {
        // Delete all associated receipts first
        $batch->receipts()->delete();
        
        $batch->delete();

        // Re-sequence to fix duplicates and gaps
        // We sort by creation date to keep the historical order
        $allBatches = Batch::orderBy('created_at', 'asc')->get();
        
        $finalizedCount = 0;
        foreach ($allBatches as $index => $b) {
            // 1. Re-sequence the display Name (Batch #001, Batch #002...)
            // Only update if it matches our standard naming pattern
            $standardName = 'Batch #' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            if (preg_match('/Batch #\d+/', $b->name)) {
                if ($b->name !== $standardName) {
                    $b->update(['name' => $standardName]);
                }
            }

            // 2. Re-sequence the Final Batch Number (B-0001, B-0002...)
            if ($b->final_batch_number) {
                $finalizedCount++;
                $newFinal = 'B-' . str_pad($finalizedCount, 4, '0', STR_PAD_LEFT);
                if ($b->final_batch_number !== $newFinal) {
                    $b->update(['final_batch_number' => $newFinal]);
                }
            }
        }

        return response()->json(['message' => 'Deleted and batches re-sequenced']);
    }

    /** Run verification check and match with transactions using existing OCR data */
    public function process(Batch $batch)
    {
        $batch->load(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }]);
        
        $results = [];
        foreach ($batch->receipts as $receipt) {
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
            // Match based on amount, account_holder, and reference/label (ignore dates)
            $isVerified = false;
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

                $query = \App\Models\Transaction::where('amount', $ocrData['amount'])
                    ->where(function($subQuery) use ($reference, $partialMatches, $receipt) {
                        // Match reference or label with OCR reference (trimmed full value)
                        $subQuery->where('reference', $reference)
                                ->orWhere('label', $reference);

                        // Partial match on last 4-5 digits when full reference is not enough
                        foreach ($partialMatches as $part) {
                            $subQuery->orWhere('reference', 'like', '%' . $part)
                                    ->orWhere('label', 'like', '%' . $part);
                        }

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
                    $isVerified = true;
                    $matchDetails = [
                        'bank' => $receipt->category === 'gcash' ? 'GCash' : ($receipt->source_label ?? 'Bank'),
                        'timestamp' => $transaction->transaction_date ? $transaction->transaction_date->format('H:i') : now()->format('H:i'),
                        'transaction' => $transaction
                    ];

                    // Link immediately if perfect match found
                    $receipt->update([
                        'transaction_id' => $transaction->id,
                        'match_status'   => 'verified'
                    ]);
                    $transaction->update(['batch_id' => $batch->id]);
                } else {
                    // Find recommended transactions (no batch record)
                    // Priority 1: Match reference and specific labels (like "Int")
                    // Priority 2: Match amount and partial reference
                    $potentialMatches = \App\Models\Transaction::whereNull('batch_id')
                        ->where(function($q) use ($reference, $ocrData) {
                            // Match by reference
                            $q->where('reference', $reference)
                              ->orWhere('label', 'like', '%Int%') // Check for "Int" (Inbound Transfer)
                              ->orWhere('label', 'like', '%' . $reference . '%');
                            
                            // Also include matches by amount as fallback in the query
                            if (isset($ocrData['amount']) && $ocrData['amount'] > 0) {
                                $q->orWhere('amount', $ocrData['amount']);
                            }
                        })
                        ->orderByRaw("CASE 
                            WHEN reference = ? THEN 1 
                            WHEN label LIKE '%Int%' AND ABS(amount - ?) < 0.01 THEN 2
                            WHEN ABS(amount - ?) < 0.01 THEN 3
                            ELSE 4 END", [$reference, $ocrData['amount'] ?? 0, $ocrData['amount'] ?? 0])
                        ->limit(5)
                        ->get();
                    
                    $matchDetails = [
                        'potential_matches' => $potentialMatches
                    ];
                }
            }

            $verificationStatus = $isVerified ? 'verified' : 'flagged';

            // Save the status to the DB so the frontend progress bar updates
            $receipt->update([
                'match_status' => $verificationStatus
            ]);

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

        return response()->json($results);
    }
}
