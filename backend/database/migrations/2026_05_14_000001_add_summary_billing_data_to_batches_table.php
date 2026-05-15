<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->json('summary_data')->nullable()->after('final_batch_number');
            $table->json('billing_data')->nullable()->after('summary_data');
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn(['summary_data', 'billing_data']);
        });
    }
};
