<?php

namespace App\Services;

class FeeCalculator
{
    /**
     * Calculate fee based on amount
     */
    public static function calculate($amount): float
    {
        if ($amount < 500) {
            return 5.00;
        } elseif ($amount < 1500) {
            return 10.00;
        } elseif ($amount < 2500) {
            return 20.00;
        } elseif ($amount < 3500) {
            return 30.00;
        } elseif ($amount < 4500) {
            return 40.00;
        } elseif ($amount < 5500) {
            return 50.00;
        } else {
            // For amounts 5500 and above, continue the pattern
            $fullThousands = floor($amount / 1000);
            return $fullThousands * 10;
        }
    }
}
