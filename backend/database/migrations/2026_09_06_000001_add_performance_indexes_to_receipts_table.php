<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $existing = array_map(
                fn($i) => $i->getName(),
                $sm->listTableIndexes('receipts')
            );

            $batchIdx = 'idx_receipts_batch_id';
            if (!in_array($batchIdx, $existing, true) &&
                !in_array(strtoupper($batchIdx), array_map('strtoupper', $existing), true)) {
                $table->index('batch_id', $batchIdx);
            }

            $txIdx = 'idx_receipts_transaction_id';
            if (!in_array($txIdx, $existing, true) &&
                !in_array(strtoupper($txIdx), array_map('strtoupper', $existing), true)) {
                $table->index('transaction_id', $txIdx);
            }

            $createdIdx = 'idx_receipts_created_at';
            if (!in_array($createdIdx, $existing, true) &&
                !in_array(strtoupper($createdIdx), array_map('strtoupper', $existing), true)) {
                $table->index('created_at', $createdIdx);
            }

            $matchIdx = 'idx_receipts_match_status';
            if (!in_array($matchIdx, $existing, true) &&
                !in_array(strtoupper($matchIdx), array_map('strtoupper', $existing), true)) {
                $table->index('match_status', $matchIdx);
            }
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $existing = array_map(
                fn($i) => $i->getName(),
                $sm->listTableIndexes('receipts')
            );
            foreach (['idx_receipts_batch_id', 'idx_receipts_transaction_id', 'idx_receipts_created_at', 'idx_receipts_match_status'] as $idx) {
                if (in_array($idx, $existing, true) ||
                    in_array(strtoupper($idx), array_map('strtoupper', $existing), true)) {
                    $table->dropIndex($idx);
                }
            }
        });
    }
};
