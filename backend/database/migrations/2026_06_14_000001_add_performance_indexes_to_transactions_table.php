<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Primary filter column — most queries filter by this
            $table->index('account_holder', 'idx_transactions_account_holder');

            // Composite index for the common query pattern:
            // WHERE account_holder = ? ORDER BY transaction_date, id
            $table->index(
                ['account_holder', 'transaction_date', 'id'],
                'idx_transactions_account_holder_date_id'
            );

            // Standalone date index for ordering without account_holder filter
            $table->index('transaction_date', 'idx_transactions_date');

            // batch_id is a FK — ensures JOIN/whereHas on batches is fast
            // (MySQL creates an index for FK automatically, but explicit is safer)
            // Only add if not already present from FK definition
            // $table->index('batch_id'); // skip — Laravel FK adds this automatically

            // entry_type filter
            $table->index('entry_type', 'idx_transactions_entry_type');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_account_holder');
            $table->dropIndex('idx_transactions_account_holder_date_id');
            $table->dropIndex('idx_transactions_date');
            $table->dropIndex('idx_transactions_entry_type');
        });
    }
};
