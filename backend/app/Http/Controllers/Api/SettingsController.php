<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountHolder;
use App\Models\DeductionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get all accounts
     */
    public function getAccounts()
    {
        $accounts = AccountHolder::active()
            ->orderBy('name')
            ->get(['name', 'short_code'])
            ->toArray();

        return response()->json(['accounts' => $accounts]);
    }

    /**
     * Add a new account
     */
    public function addAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:account_holders,name',
            'short_code' => 'required|string|size:3|unique:account_holders,short_code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed', 
                'errors' => $validator->errors()
            ], 422);
        }

        $account = AccountHolder::create([
            'name' => $request->name,
            'short_code' => strtoupper($request->short_code),
            'is_active' => true,
        ]);

        $accounts = AccountHolder::active()
            ->orderBy('name')
            ->get(['name', 'short_code'])
            ->toArray();

        return response()->json([
            'message' => 'Account added successfully',
            'accounts' => $accounts
        ], 201);
    }

    /**
     * Delete an account (soft delete by setting is_active to false)
     */
    public function deleteAccount($accountName)
    {
        $account = AccountHolder::where('name', $accountName)->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        // Soft delete by setting is_active to false
        $account->is_active = false;
        $account->save();

        $accounts = AccountHolder::active()
            ->orderBy('name')
            ->get(['name', 'short_code'])
            ->toArray();

        return response()->json([
            'message' => 'Account deleted successfully',
            'accounts' => $accounts
        ]);
    }

    /**
     * Get all deduction types
     */
    public function getDeductionTypes()
    {
        $deductionTypes = DeductionType::active()
            ->orderBy('label')
            ->get(['key', 'label'])
            ->toArray();

        return response()->json(['deduction_types' => $deductionTypes]);
    }

    /**
     * Add a new deduction type
     */
    public function addDeductionType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string|max:255|unique:deduction_types,key',
            'label' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $deductionType = DeductionType::create([
            'key' => strtolower($request->key),
            'label' => $request->label,
            'is_active' => true,
        ]);

        $deductionTypes = DeductionType::active()
            ->orderBy('label')
            ->get(['key', 'label'])
            ->toArray();

        return response()->json([
            'message' => 'Deduction type added successfully',
            'deduction_types' => $deductionTypes
        ], 201);
    }

    /**
     * Delete a deduction type (soft delete by setting is_active to false)
     */
    public function deleteDeductionType($key)
    {
        $deductionType = DeductionType::where('key', $key)->first();

        if (!$deductionType) {
            return response()->json(['message' => 'Deduction type not found'], 404);
        }

        // Soft delete by setting is_active to false
        $deductionType->is_active = false;
        $deductionType->save();

        $deductionTypes = DeductionType::active()
            ->orderBy('label')
            ->get(['key', 'label'])
            ->toArray();

        return response()->json([
            'message' => 'Deduction type deleted successfully',
            'deduction_types' => $deductionTypes
        ]);
    }
}
