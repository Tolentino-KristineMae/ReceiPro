<?php

namespace Tests\Feature;

use App\Jobs\ProcessReceiptOcr;
use App\Models\Batch;
use App\Models\Receipt;
use App\Models\Transaction;
use App\Services\BatchStatsService;
use App\Services\BatchSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PerformanceReliabilityTest extends TestCase
{
    use RefreshDatabase;

    private function batch(string $name = 'Batch #001'): Batch
    {
        return Batch::create(['name' => $name, 'batch_number' => uniqid('BATCH-'), 'checker_status' => 'open']);
    }

    private function receipt(Batch $batch, array $attributes = []): Receipt
    {
        return Receipt::create(array_merge(['batch_id' => $batch->id, 'file_path' => 'receipts/test.png'], $attributes));
    }

    private function transaction(Batch $batch, array $attributes = []): Transaction
    {
        return Transaction::create(array_merge([
            'batch_id' => $batch->id, 'account' => 'Account 1', 'account_holder' => 'Kristine',
            'entry_type' => 'credit', 'transaction_date' => '2026-10-14',
            'amount' => 1234.56, 'net_amount' => 1234.56, 'source_type' => 'gcash',
            'status' => 'claimed',
        ], $attributes));
    }

    public function test_upload_leaves_receipts_pending_without_fake_ocr(): void
    {
        Storage::fake('supabase');
        Queue::fake();
        $batch = $this->batch();
        $this->post('/api/receipts/upload', [
            'batch_id' => $batch->id,
            'receipts' => [UploadedFile::fake()->image('receipt.png')],
        ], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('receipts.0.ocr_status', 'pending')
            ->assertJsonPath('receipts.0.ocr_data', null);
        Queue::assertNothingPushed();
    }

    public function test_old_jobs_do_not_overwrite_real_receipt_data(): void
    {
        $receipt = $this->receipt($this->batch(), ['ocr_status' => 'completed', 'ocr_data' => ['amount' => 900]]);
        (new ProcessReceiptOcr($receipt))->handle();
        $this->assertSame(['amount' => 900], $receipt->fresh()->ocr_data);
        $receipt->update(['ocr_status' => 'processing', 'ocr_data' => null]);
        (new ProcessReceiptOcr($receipt))->handle();
        $this->assertSame('pending', $receipt->fresh()->ocr_status);
        $this->assertNull($receipt->fresh()->ocr_data);
    }

    public function test_dashboard_activity_omits_heavy_data_and_relations(): void
    {
        $this->receipt($this->batch(), ['ocr_data' => ['raw_text' => str_repeat('text', 1000)]]);
        DB::enableQueryLog();
        DB::flushQueryLog();
        $row = $this->getJson('/api/receipts?view=activity')->assertOk()->json('0');
        $this->assertEqualsCanonicalizing(['id', 'created_at', 'match_status'], array_keys($row));
        $this->assertCount(1, DB::getQueryLog());
    }

    public function test_repairs_preserve_verified_claims_and_use_bounded_queries(): void
    {
        $batch = $this->batch();
        $other = $this->batch('Batch #002');
        $claimed = $this->transaction($batch);
        $this->receipt($batch, ['transaction_id' => $claimed->id, 'match_status' => 'verified']);
        $invalid = $this->receipt($batch, ['match_status' => 'verified']);
        $orphans = collect(range(1, 15))->map(fn () => $this->transaction($batch));
        // A receipt in another batch cannot preserve this batch's orphan link.
        $this->receipt($other, ['transaction_id' => $orphans->first()->id, 'match_status' => 'verified']);
        $batch->load('receipts');
        Cache::put('transactions_report', ['stale' => true]);
        DB::enableQueryLog();
        DB::flushQueryLog();
        $result = app(BatchSyncService::class)->repairBatch($batch);
        $this->assertCount(2, DB::getQueryLog());
        $this->assertSame(['fixed_receipts' => 1, 'unlinked_transactions' => 15], $result);
        $this->assertSame($batch->id, $claimed->fresh()->batch_id);
        $this->assertSame('matched', $invalid->fresh()->match_status);
        foreach ($orphans as $orphan) {
            $this->assertNull($orphan->fresh()->batch_id);
            $this->assertSame('pending', $orphan->fresh()->status);
        }
        $this->assertNull(Cache::get('transactions_report'));
        $this->assertSame(0, app(BatchSyncService::class)->repairBatch($batch->fresh())['unlinked_transactions']);
    }

    public function test_repair_preserves_a_claim_created_after_receipts_were_loaded(): void
    {
        $batch = $this->batch();
        $transaction = $this->transaction($batch);
        $receipt = $this->receipt($batch, ['match_status' => 'verified']);
        $batch->load('receipts');
        $receipt->update(['transaction_id' => $transaction->id]);
        $result = app(BatchSyncService::class)->repairBatch($batch);
        $this->assertSame(0, $result['fixed_receipts']);
        $this->assertSame(0, $result['unlinked_transactions']);
        $this->assertSame('verified', $receipt->fresh()->match_status);
        $this->assertSame($batch->id, $transaction->fresh()->batch_id);
    }

    public function test_processing_is_not_counted_as_finished_ocr(): void
    {
        $batch = $this->batch();
        $this->receipt($batch, ['category' => 'gcash', 'ocr_status' => 'processing']);
        $this->assertSame(0, app(BatchStatsService::class)->calculateStats($batch)['ocr_finished']);
    }

    public function test_batch_pagination_bounds_and_next_number(): void
    {
        $this->batch('Batch #052');
        $this->batch('A custom name 999');
        $this->getJson('/api/batches?per_page=0')->assertOk()
            ->assertJsonPath('pagination.per_page', 1)->assertJsonCount(1, 'batches')
            ->assertJsonPath('next_batch_number', 53)->assertJsonPath('dashboard.active_batches', 2)
            ->assertJsonMissingPath('batches.0.transactions');
        $this->getJson('/api/batches?per_page=10000')->assertOk()->assertJsonPath('pagination.per_page', 100);
        $this->getJson('/api/batches?per_page=1&page=2')->assertOk()->assertJsonPath('batches.0.name', 'Batch #052');
    }

    public function test_ledger_search_handles_dates_and_full_numeric_amounts(): void
    {
        $this->transaction($this->batch());
        foreach (['2026-10', '234.5'] as $search) {
            $this->getJson('/api/transactions?account_holder=Kristine&search=' . urlencode($search))
                ->assertOk()->assertJsonCount(1, 'data');
        }
        $this->getJson('/api/transactions?search=does-not-exist')->assertOk()->assertJsonCount(0, 'data');
    }
}
