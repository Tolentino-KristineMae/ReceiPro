<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    private const ACCOUNT_HOLDERS = ['Babilyn', 'Nixie', 'Kristine'];

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

        return response()->json($transaction->load(['receipts', 'batch']), 201);
    }

    public function index(Request $request)
    {
        $query = $this->buildQuery($request);
        $sortOrder = strtolower((string) $request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy('transaction_date', $sortOrder)
              ->orderBy('created_at', $sortOrder)
              ->orderBy('id', $sortOrder);

        $transactions = $query->get();
        $ascSorted = $transactions->sortBy(function ($transaction) {
            return sprintf('%s-%010d', $transaction->transaction_date, $transaction->id);
        })->values();
        $withBalances = collect($this->appendRunningBalances($ascSorted));

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
        $accounts = [];

        foreach (self::ACCOUNT_HOLDERS as $accountHolder) {
            $transactions = Transaction::with(['batch'])
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

        $completedBatches = Transaction::whereHas('batch', function ($q) {
                $q->whereNotNull('final_batch_number');
            })
            ->with('batch:id,final_batch_number')
            ->get()
            ->pluck('batch.final_batch_number')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return response()->json([
            'accounts'          => $accounts,
            'completed_batches' => $completedBatches,
            'can_print'         => count($completedBatches) >= 5,
        ]);
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

        return response()->json($transaction->load(['receipts', 'batch']));
    }

    public function destroy($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function buildQuery(Request $request)
    {
        $query = Transaction::with(['batch', 'receipts']);

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
        $totalDebit = (float) $collection->where('entry_type', 'debit')->sum('amount');

        return [
            'opening_balance'  => $openingBalance,
            'total_credit'     => $totalCredit,
            'total_debit'      => $totalDebit,
            'current_balance'  => $openingBalance + $totalCredit - $totalDebit,
            'transaction_count'=> $collection->count(),
        ];
    }

    private function appendRunningBalances($transactions)
    {
        $running = 0.0;
        $first = $transactions->first();
        if ($first) {
            $running = (float) ($first->opening_balance ?? 0);
        }

        return $transactions->map(function ($transaction) use (&$running) {
            $amount = (float) ($transaction->amount ?? 0);
            $running = $transaction->entry_type === 'credit'
                ? $running + $amount
                : $running - $amount;

            $row = $transaction->toArray();
            $row['running_balance'] = round($running, 2);
            $row['batch_label'] = $transaction->batch?->final_batch_number;
            $row['display_label'] = $transaction->entry_type === 'debit'
                ? ($transaction->label ?: 'Deduction')
                : ($transaction->batch?->final_batch_number ?: '—');

            return $row;
        })->values();
    }
}
