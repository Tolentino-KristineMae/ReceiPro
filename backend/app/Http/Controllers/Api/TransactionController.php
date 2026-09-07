<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    private const ACCOUNT_HOLDERS = ['Kristine', 'Nixie', 'Babilyn'];

    // Columns needed for the index/list view — avoids loading heavy JSON columns
    private const LIST_COLUMNS = [
        'id', 'transaction_date', 'account', 'account_holder',
        'entry_type', 'amount', 'fee', 'net_amount',
        'opening_balance', 'running_balance',
        'reference', 'label', 'source_type', 'status',
        'batch_id', 'created_at',
    ];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_date'  => 'required|date',
            'account'           => 'required|string|in:Account 1,Account 2,Account 3',
            'account_holder'    => 'required|string|in:Babilyn,Nixie,Kristine',
            'entry_type'        => 'required|string|in:credit,debit',
            'amount'            => 'required|numeric|min:0',
            'opening_balance'   => 'nullable|numeric',
            'reference'         => 'nullable|string',
            'label'             => 'nullable|string',
            'source_type'       => 'required|string|in:gcash,others',
            'denominations'     => 'nullable|array',
        ]);

        $transaction = Transaction::create($validated);

        // Bust report cache when a transaction is created
        Cache::forget('transactions_report');

        return response()->json($transaction->load(['receipts', 'batch']), 201);
    }

    public function index(Request $request)
    {
        try {
            $sortOrder = strtolower((string) $request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

            $query = $this->buildQuery($request);

            // Only eager-load batch (needed for batch_label/display_label).
            // Receipts are NOT needed for the list view — loading them was a major bottleneck.
            // Select only the columns we actually use instead of SELECT *.
            $query->select(self::LIST_COLUMNS)
                  ->with(['batch:id,final_batch_number,name'])
                  ->orderBy('transaction_date', 'asc')
                  ->orderBy('id', 'asc');

            $transactions = $query->get();

            // Compute running balances in ascending order, then re-sort if needed
            $withBalances = collect($this->appendRunningBalances($transactions));

            if ($sortOrder === 'desc') {
                $withBalances = $withBalances->sortByDesc(function ($row) {
                    return sprintf('%s-%010d', $row['transaction_date'], $row['id']);
                })->values();
            }

            return response()->json([
                'data' => $withBalances,
                'meta' => $this->computeMeta($transactions),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transactions in index()', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'request_params' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch transactions',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching transactions',
                'data' => [],
                'meta' => [
                    'opening_balance' => 0,
                    'total_credit' => 0,
                    'total_debit' => 0,
                    'current_balance' => 0,
                    'transaction_count' => 0,
                ]
            ], 500);
        }
    }

    /** Full multi-account report data for printing */
    public function report()
    {
        // Cache for 2 minutes — report is heavy and rarely changes mid-session
        return Cache::remember('transactions_report', 120, function () {
            $accounts = [];

            foreach (self::ACCOUNT_HOLDERS as $accountHolder) {
                // Select only needed columns; batch only needs id + final_batch_number
                $transactions = Transaction::select(self::LIST_COLUMNS)
                    ->with(['batch:id,final_batch_number,name'])
                    ->where('account_holder', $accountHolder)
                    ->orderBy('transaction_date', 'asc')
                    ->orderBy('id', 'asc')
                    ->get();

                if ($transactions->isEmpty()) {
                    continue;
                }

                $accounts[$accountHolder] = [
                    'transactions' => $this->appendRunningBalances($transactions),
                    'meta'         => $this->computeMeta($transactions),
                ];
            }

            // Single query for completed batches instead of loading all transactions again
            $completedBatches = \App\Models\Batch::whereNotNull('final_batch_number')
                ->orderBy('final_batch_number')
                ->pluck('final_batch_number')
                ->filter()
                ->unique()
                ->values()
                ->all();

            return response()->json([
                'accounts'          => $accounts,
                'completed_batches' => $completedBatches,
                'can_print'         => count($completedBatches) >= 5,
            ])->getData(true);
        });
    }

    public function show($id)
    {
        $transaction = Transaction::with(['receipts', 'batch'])->findOrFail($id);
        return response()->json($transaction);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);

        $validated = $request->validate([
            'transaction_date'  => 'sometimes|date',
            'account'           => 'sometimes|string|in:Account 1,Account 2,Account 3',
            'account_holder'    => 'sometimes|string|in:Babilyn,Nixie,Kristine',
            'entry_type'        => 'sometimes|string|in:credit,debit',
            'amount'            => 'sometimes|numeric|min:0',
            'opening_balance'   => 'nullable|numeric',
            'reference'         => 'nullable|string',
            'label'             => 'nullable|string',
            'source_type'       => 'sometimes|string|in:gcash,others',
            'denominations'     => 'nullable|array',
        ]);

        $transaction->update($validated);

        // Bust report cache on any transaction change
        Cache::forget('transactions_report');

        return response()->json($transaction->load(['receipts', 'batch']));
    }

    public function destroy($id)
    {
        try {
            $transaction = Transaction::findOrFail($id);
            
            // Use database transaction for safety
            \DB::beginTransaction();
            
            try {
                // The foreign key constraint will automatically set null on related receipts
                $transaction->delete();
                
                // Bust report cache on deletion
                Cache::forget('transactions_report');
                
                \DB::commit();
                
                return response()->json([
                    'message' => 'Transaction deleted successfully',
                    'success' => true
                ], 200);
                
            } catch (\Exception $e) {
                \DB::rollBack();
                \Log::error('Failed to delete transaction', [
                    'transaction_id' => $id,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'message' => 'Failed to delete transaction',
                    'error' => $e->getMessage(),
                    'success' => false
                ], 500);
            }
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found',
                'success' => false
            ], 404);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer'
        ]);

        $ids = array_values(array_unique($validated['ids']));

        try {
            DB::beginTransaction();

            try {
                $foundIds = Transaction::whereIn('id', $ids)->pluck('id')->all();
                if (count($foundIds) !== count($ids)) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Some transaction IDs do not exist',
                        'success' => false
                    ], 422);
                }

                $deletedCount = Transaction::whereIn('id', $ids)->delete();
                
                Cache::forget('transactions_report');
                
                DB::commit();

                return response()->json([
                    'message' => "Successfully deleted {$deletedCount} transaction(s)",
                    'success' => true,
                    'deleted_count' => $deletedCount
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to bulk delete transactions', [
                    'transaction_ids' => $ids,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'message' => 'Failed to delete transactions',
                    'error' => $e->getMessage(),
                    'success' => false
                ], 500);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid transaction IDs provided',
                'errors' => $e->errors(),
                'success' => false
            ], 422);
        }
    }

    private function buildQuery(Request $request)
    {
        // Start without eager loading — index() adds its own with()
        $query = Transaction::query();

        if ($request->filled('account_holder')) {
            $query->where('account_holder', $request->account_holder);
        }
        if ($request->filled('entry_type')) {
            $query->where('entry_type', $request->entry_type);
        }
        if ($request->filled('source_type')) {
            $query->where('source_type', $request->source_type);
        }
        if ($request->filled('account')) {
            $query->where('account', $request->account);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($sub) use ($search) {
                $sub->where('label', 'like', '%' . $search . '%')
                    ->orWhere('reference', 'like', '%' . $search . '%')
                    ->orWhere('entry_type', 'like', '%' . $search . '%')
                    ->orWhere('transaction_date', 'like', '%' . $search . '%')
                    ->orWhereRaw('CAST(amount AS CHAR) LIKE ?', ['%' . $search . '%']);
            });
        }

        return $query;
    }

    private function computeMeta($transactions): array
    {
        $collection = collect($transactions);
        $first = $collection->first();
        $openingBalance = $first ? (float) ($first->opening_balance ?? 0) : 0.0;

        $totalCredit = (float) $collection->where('entry_type', 'credit')->sum('amount');
        $totalDebit  = (float) $collection->where('entry_type', 'debit')->sum('amount');

        return [
            'opening_balance'   => $openingBalance,
            'total_credit'      => $totalCredit,
            'total_debit'       => $totalDebit,
            'current_balance'   => $openingBalance + $totalCredit - $totalDebit,
            'transaction_count' => $collection->count(),
        ];
    }

    private function appendRunningBalances($transactions): array
    {
        $running = 0.0;
        $isFirstTransaction = true;

        return $transactions->map(function ($transaction) use (&$running, &$isFirstTransaction) {
            // If this transaction has an opening balance set, use it as the starting point
            $transactionOpeningBalance = (float) ($transaction->opening_balance ?? 0);
            
            if ($transactionOpeningBalance > 0) {
                // Opening balance is set - this becomes the new starting point
                $running = $transactionOpeningBalance;
            }
            
            // Add/subtract the transaction amount
            $amount  = (float) ($transaction->amount ?? 0);
            $running = $transaction->entry_type === 'credit'
                ? $running + $amount
                : $running - $amount;

            $isFirstTransaction = false;

            // Build a plain array manually — avoids toArray() which serializes all loaded relations
            return [
                'id'              => $transaction->id,
                'transaction_date'=> $transaction->transaction_date instanceof \Illuminate\Support\Carbon
                    ? $transaction->transaction_date->toDateString()
                    : $transaction->transaction_date,
                'account'         => $transaction->account,
                'account_holder'  => $transaction->account_holder,
                'entry_type'      => $transaction->entry_type,
                'amount'          => $transaction->amount,
                'fee'             => $transaction->fee,
                'net_amount'      => $transaction->net_amount,
                'opening_balance' => $transaction->opening_balance,
                'running_balance' => round($running, 2),
                'reference'       => $transaction->reference,
                'label'           => $transaction->label,
                'source_type'     => $transaction->source_type,
                'status'          => $transaction->status,
                'batch_id'        => $transaction->batch_id,
                'created_at'      => $transaction->created_at,
                // Batch-derived display fields (batch was eagerly loaded)
                'batch_label'     => $transaction->batch?->final_batch_number,
                'batch_name'      => $transaction->batch?->name,
                'display_label'   => $transaction->entry_type === 'debit'
                    ? ($transaction->label ?: 'Deduction')
                    : ($transaction->batch?->final_batch_number ?: '—'),
            ];
        })->values()->all();
    }
}
