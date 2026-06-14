<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();

        Cache::forget('transactions_report');

        return response()->json(['message' => 'Deleted']);
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
        $first = $transactions->first();
        if ($first) {
            $running = (float) ($first->opening_balance ?? 0);
        }

        return $transactions->map(function ($transaction) use (&$running) {
            $amount  = (float) ($transaction->amount ?? 0);
            $running = $transaction->entry_type === 'credit'
                ? $running + $amount
                : $running - $amount;

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
