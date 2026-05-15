<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('account_holder')->nullable()->after('account'); // Babily, Nicie, Kristien
            $table->string('entry_type')->default('credit')->after('account_holder'); // credit | debit
            $table->string('label')->nullable()->after('reference'); // text label (non-numeric identifier)
            $table->decimal('opening_balance', 12, 2)->default(0)->after('net_amount');
            $table->decimal('running_balance', 12, 2)->default(0)->after('opening_balance');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['account_holder', 'entry_type', 'label', 'opening_balance', 'running_balance']);
        });
    }
};
