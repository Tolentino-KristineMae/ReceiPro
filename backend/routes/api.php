<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\DB;

// Test DB connection
Route::get('/test-db', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['status' => 'ok', 'database' => DB::connection()->getDatabaseName()]);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
});

// Test env vars
Route::get('/test-env', function () {
    return response()->json([
        'DB_HOST' => env('DB_HOST'),
        'DB_PORT' => env('DB_PORT'),
        'DB_DATABASE' => env('DB_DATABASE'),
        'DB_USERNAME' => env('DB_USERNAME'),
        'APP_KEY' => substr(env('APP_KEY'), 0, 20) . '...',
        'SUPABASE_URL' => env('SUPABASE_URL'),
    ]);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Settings routes
Route::prefix('settings')->group(function () {
    Route::get('/accounts', [SettingsController::class, 'getAccounts']);
    Route::post('/accounts', [SettingsController::class, 'addAccount']);
    Route::delete('/accounts/{accountName}', [SettingsController::class, 'deleteAccount']);
    
    Route::get('/deduction-types', [SettingsController::class, 'getDeductionTypes']);
    Route::post('/deduction-types', [SettingsController::class, 'addDeductionType']);
    Route::delete('/deduction-types/{key}', [SettingsController::class, 'deleteDeductionType']);
});

// Batch routes
Route::prefix('batches')->group(function () {
    Route::get('/', [BatchController::class, 'index']);
    Route::post('/', [BatchController::class, 'store']);
    Route::post('/bulk-download-summaries', [BatchController::class, 'bulkDownloadSummaries']);
    Route::get('/{batch}', [BatchController::class, 'show']);
    Route::patch('/{batch}', [BatchController::class, 'update']);
    Route::patch('/{batch}/status', [BatchController::class, 'updateStatus']);
    Route::patch('/{batch}/receipts/{receipt}/label', [BatchController::class, 'updateReceiptLabel']);
    Route::delete('/{batch}', [BatchController::class, 'destroy']);
    Route::post('/{batch}/process', [BatchController::class, 'process']);
    Route::post('/{batch}/receipts/{receipt}/manual-verify', [BatchController::class, 'manualVerify']);
    Route::post('/{batch}/reset', [BatchController::class, 'reset']);
});

// Receipt routes
Route::prefix('receipts')->group(function () {
    Route::post('/upload', [ReceiptController::class, 'upload']);
    Route::post('/bulk-update-category', [ReceiptController::class, 'bulkUpdateCategory']);
    Route::get('/', [ReceiptController::class, 'index']);
    Route::get('/{receipt}/image', [ReceiptController::class, 'serveImage'])->name('receipts.image');
    Route::patch('/{receipt}', [ReceiptController::class, 'updateCategory'])->name('receipts.update-category');
    Route::patch('/{receipt}/account', [ReceiptController::class, 'assignAccount'])->name('receipts.assign-account');
    Route::patch('/{receipt}/ocr', [ReceiptController::class, 'updateOcrData'])->name('receipts.update-ocr');
    Route::delete('/{receipt}', [ReceiptController::class, 'destroy'])->name('receipts.destroy');
});

// Transaction routes
Route::prefix('transactions')->group(function () {
    Route::post('/', [TransactionController::class, 'store']);
    Route::get('/report', [TransactionController::class, 'report']);
    Route::get('/', [TransactionController::class, 'index']);
    Route::post('/bulk-delete', [TransactionController::class, 'bulkDestroy']);
    Route::get('/{transaction}', [TransactionController::class, 'show']);
    Route::patch('/{transaction}', [TransactionController::class, 'update']);
    Route::put('/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/{transaction}', [TransactionController::class, 'destroy']);
});
