<?php

namespace App\Services;

class FeeCalculator
{
    /**
     * Calculate fee based on amount
     * - Less than 500: flat fee of 5
     * - 500 and above: 10 per 1000
     */
    public static function calculate($amount): float
    {
        if ($amount < 500) {
            return 5.00;
        }

        $fullThousands = floor($amount / 1000);
        return $fullThousands * 10;
    }
}
