<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Account holders table
        Schema::create('account_holders', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('short_code', 3)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Deduction types table
        Schema::create('deduction_types', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default account holders
        DB::table('account_holders')->insert([
            ['name' => 'Babilyn', 'short_code' => 'BAB', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nixie', 'short_code' => 'NIX', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kristine', 'short_code' => 'KRI', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Insert default deduction types
        DB::table('deduction_types')->insert([
            ['key' => 'royal', 'label' => 'Cash in Royal Cable', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'bills', 'label' => 'Bills', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'others', 'label' => 'Others', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_types');
        Schema::dropIfExists('account_holders');
    }
};
