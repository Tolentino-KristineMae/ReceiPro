<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('file_path');
            $table->string('category')->default('unsorted');
            $table->string('ocr_status')->default('pending');
            $table->json('ocr_data')->nullable();
            $table->string('match_status')->default('unmatched');
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
