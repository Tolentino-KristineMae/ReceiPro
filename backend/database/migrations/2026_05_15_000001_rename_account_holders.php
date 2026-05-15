<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration renames stored account_holder values to the corrected spellings
     * without altering other data. It updates both `transactions` and `receipts` tables.
     */
    public function up()
    {
        // Transactions
        DB::table('transactions')->where('account_holder', 'Babily')->update(['account_holder' => 'Babilyn']);
        DB::table('transactions')->where('account_holder', 'Nicie')->update(['account_holder' => 'Nixie']);
        DB::table('transactions')->where('account_holder', 'Kristien')->update(['account_holder' => 'Kristine']);

        // Receipts
        DB::table('receipts')->where('account_holder', 'Babily')->update(['account_holder' => 'Babilyn']);
        DB::table('receipts')->where('account_holder', 'Nicie')->update(['account_holder' => 'Nixie']);
        DB::table('receipts')->where('account_holder', 'Kristien')->update(['account_holder' => 'Kristine']);
    }

    /**
     * Reverse the migrations.
     *
     * Revert names back to original spellings if needed.
     */
    public function down()
    {
        DB::table('transactions')->where('account_holder', 'Babilyn')->update(['account_holder' => 'Babily']);
        DB::table('transactions')->where('account_holder', 'Nixie')->update(['account_holder' => 'Nicie']);
        DB::table('transactions')->where('account_holder', 'Kristine')->update(['account_holder' => 'Kristien']);

        DB::table('receipts')->where('account_holder', 'Babilyn')->update(['account_holder' => 'Babily']);
        DB::table('receipts')->where('account_holder', 'Nixie')->update(['account_holder' => 'Nicie']);
        DB::table('receipts')->where('account_holder', 'Kristine')->update(['account_holder' => 'Kristien']);
    }
};
