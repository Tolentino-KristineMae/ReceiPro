<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\Batch;
use App\Models\Transaction;
use App\Jobs\ProcessReceiptOcr;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptController extends Controller
{
    public function serveImage(Receipt $receipt, Request $request)
    {
        $type = $request->query('type', 'original');
        $filePath = ($type === 'crop' && $receipt->cropped_image) 
            ? $receipt->cropped_image 
            : $receipt->file_path;

        // Use correct Supabase Storage public URL format
        $publicUrl = env('SUPABASE_URL') . '/storage/v1/object/public/' . env('SUPABASE_BUCKET') . '/' . $filePath;

        // Redirect to Supabase public URL
        return redirect()->to($publicUrl);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'receipts' => 'required|array',
            'receipts.*' => 'required|file'
        ]);

        // Determine which batch to use: either existing or create a new one
        if ($request->has('batch_id')) {
            $batch = Batch::findOrFail($request->batch_id);
        } else {
            $batch = Batch::create([
                'batch_number'   => 'BATCH-' . now()->format('Ymd-His') . '-' . Str::random(4),
                'name'           => 'Auto-created Batch',
                'checker_status' => 'open',
            ]);
        }

        foreach ($request->file('receipts') as $file) {
            $path = $file->store('receipts', 'supabase');

            $receipt = Receipt::create([
                'file_path' => $path,
                'category' => 'unsorted',
                'batch_id' => $batch->id
            ]);

            ProcessReceiptOcr::dispatch($receipt);
        }

        // Force reload batch with all receipts (no limit) and include linked transactions
        $batch = Batch::with(['receipts' => function ($query) {
            $query->orderBy('created_at', 'asc')->with('transaction');
        }])->find($batch->id);

        return response()->json($batch, 201);
    }

    public function destroy(Receipt $receipt)
    {
        if ($receipt->cropped_image) {
            Storage::disk('supabase')->delete($receipt->cropped_image);
        }

        Storage::disk('supabase')->delete($receipt->file_path);

        if ($receipt->transaction_id) {
            Transaction::where('id', $receipt->transaction_id)
                ->where(function ($query) use ($receipt) {
                    $query->where('batch_id', $receipt->batch_id)
                        ->orWhereNull('batch_id');
                })
                ->update(['batch_id' => null, 'status' => 'pending']);
        }

        $receipt->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function assignAccount(Request $request, Receipt $receipt)    {
        $request->validate([
            'account_holder' => 'nullable|string|max:100'
        ]);

        $receipt->update([
            'account_holder' => $request->account_holder
        ]);

        return response()->json($receipt->fresh());
    }

    public function updateCategory(Request $request, Receipt $receipt)
    {
        $request->validate([
            'category'       => 'nullable|in:unsorted,gcash,others',
            'account_holder' => 'nullable|string|max:100',
            'cropped_image'  => 'nullable|string', // base64
            'ocr_status'     => 'nullable|string',
            'ocr_data'       => 'nullable|array',
        ]);

        $data = $request->only(['category', 'account_holder', 'ocr_status', 'ocr_data']);
        
        // Handle cropped image if provided
        if ($request->has('cropped_image')) {
            $base64 = $request->cropped_image;
            if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
                $base64 = substr($base64, strpos($base64, ',') + 1);
                $type = strtolower($type[1]); // png, jpg, etc.
                $base64 = base64_decode($base64);
                
                $fileName = 'crops/' . Str::random(40) . '.' . $type;
                Storage::disk('supabase')->put($fileName, $base64);
                
                // We store the path in cropped_image column for the frontend to use
                $data['cropped_image'] = $fileName;
            } else {
                // If it's already a path or other string
                $data['cropped_image'] = $base64;
            }
        }

        $receipt->update($data);

        return response()->json($receipt->fresh());
    }

    public function updateOcrData(Request $request, Receipt $receipt)
    {
        $request->validate([
            'ocr_data' => 'required|array'
        ]);

        $receipt->update([
            'ocr_data' => $request->ocr_data,
            'ocr_status' => 'completed'
        ]);

        return response()->json($receipt->fresh());
    }

    public function index(Request $request)
    {
        $query = Receipt::with(['batch', 'transaction']);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('ocr_status')) {
            $query->where('ocr_status', $request->ocr_status);
        }

        if ($request->has('match_status')) {
            $query->where('match_status', $request->match_status);
        }

        $receipts = $query->orderBy('created_at', 'desc')->get();

        return response()->json($receipts);
    }

    public function bulkUpdateCategory(Request $request)
    {
        $request->validate([
            'receipts' => 'required|array',
            'receipts.*.id' => 'required|exists:receipts,id',
            'receipts.*.category' => 'required|in:unsorted,gcash,others',
            'receipts.*.account_holder' => 'nullable|string|max:100',
        ]);

        foreach ($request->receipts as $receiptData) {
            Receipt::where('id', $receiptData['id'])->update([
                'category' => $receiptData['category'],
                'account_holder' => $receiptData['account_holder'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Receipts updated successfully'], 200);
    }
}
