<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Receipt;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
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

        if ($request->has('receipt_id')) {
            $receipt = Receipt::find($request->receipt_id);
            if ($receipt) {
                $receipt->update([
                    'transaction_id' => $transaction->id,
                    'match_status'   => 'matched',
                ]);
            }
        }

        return response()->json($transaction->load(['receipts', 'batch']), 201);
    }

    public function index(Request $request)
    {
        $query = Transaction::with(['batch', 'receipts']);

        if ($request->has('account_holder')) {
            $query->where('account_holder', $request->account_holder);
        }
        if ($request->has('entry_type')) {
            $query->where('entry_type', $request->entry_type);
        }
        if ($request->has('source_type')) {
            $query->where('source_type', $request->source_type);
        }
        if ($request->has('account')) {
            $query->where('account', $request->account);
        }

        $transactions = $query->orderBy('transaction_date', 'asc')
                              ->orderBy('created_at', 'asc')
                              ->get();

        return response()->json($transactions);
    }

    public function show($id)
    {
        $transaction = Transaction::with(['receipts', 'batch'])->findOrFail($id);
        return response()->json($transaction);
    }

    public function destroy($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
