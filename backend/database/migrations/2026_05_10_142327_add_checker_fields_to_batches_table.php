<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            // checker_status: open | claiming | verified | finalized
            $table->string('checker_status')->default('open')->after('status');
            // finalized batch number e.g. "B-0001"
            $table->string('final_batch_number')->nullable()->after('checker_status');
            // name given by user when creating the batch
            $table->string('name')->nullable()->after('batch_number');
        });

        // Add source_label to receipts for manual "Others" entries
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('source_label')->nullable()->after('account_holder');
            // Int, Go Tyme, Unionbank, Other
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn(['checker_status', 'final_batch_number', 'name']);
        });
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn('source_label');
        });
    }
};
