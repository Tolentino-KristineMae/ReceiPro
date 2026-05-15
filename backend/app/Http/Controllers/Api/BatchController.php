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
        $batches = Batch::with(['receipts'])->orderBy('created_at', 'desc')->get();
        return response()->json($batches);
    }

    /** Create a named batch (before uploading receipts) */
    public function store(Request $request)
    {
        $count = Batch::count() + 1;
        $name = $request->name ?: 'Batch #' . str_pad($count, 3, '0', STR_PAD_LEFT);

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
        return response()->json($batch->load('receipts'));
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

            // For each receipt in this batch, find a matching transaction and stamp it
            $batch->load('receipts');
            foreach ($batch->receipts as $receipt) {
                $ref    = $receipt->ocr_data['reference'] ?? null;
                $amount = isset($receipt->ocr_data['amount'])
                    ? (float) $receipt->ocr_data['amount']
                    : null;
                $holder = $receipt->account_holder;

                if (!$ref && !$amount) continue;

                // Match by reference first (most precise), then by amount + account_holder
                $transaction = null;

                if ($ref) {
                    $transaction = \App\Models\Transaction::where('reference', $ref)
                        ->whereNull('batch_id')
                        ->first();
                }

                if (!$transaction && $amount && $holder) {
                    $transaction = \App\Models\Transaction::where('account_holder', $holder)
                        ->whereRaw('ABS(amount - ?) < 0.01', [$amount])
                        ->whereNull('batch_id')
                        ->first();
                }

                if ($transaction) {
                    $transaction->update(['batch_id' => $batch->id]);
                }
            }

            return response()->json($batch->fresh()->load('receipts'));
        }

        $batch->update($data);

        // When billing is complete, mark all linked transactions as 'completed'
        if ($request->checker_status === 'billing_ready') {
            \App\Models\Transaction::where('batch_id', $batch->id)
                ->update(['status' => 'completed']);
        }

        return response()->json($batch->fresh()->load('receipts'));
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

    public function destroy(Batch $batch)
    {
        // Delete all associated receipts first
        $batch->receipts()->delete();
        
        $batch->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /** Run verification check and match with transactions using existing OCR data */
    public function process(Batch $batch)
    {
        $batch->load('receipts');
        
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
                        'timestamp' => $transaction->transaction_date ? $transaction->transaction_date->format('H:i') : now()->format('H:i')
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
