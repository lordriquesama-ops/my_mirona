import { Currency, ExchangeRates } from '../types';

/**
 * Converts an amount from UGX (the base currency) to a target currency.
 * @param amountInUgx The amount in UGX.
 * @param targetCurrency The currency to convert to.
 * @param rates The exchange rates object.
 * @returns The converted amount.
 */
export const convertPrice = (amountInUgx: number, targetCurrency: Currency, rates: ExchangeRates): number => {
    const rate = rates[targetCurrency];
    return amountInUgx * rate;
};

/**
 * Formats a number as a currency string according to the specified currency code.
 * @param amount The numerical amount.
 * @param currency The currency code (e.g., 'UGX', 'USD').
 * @returns A formatted currency string.
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            // UGX doesn't typically use decimal places
            maximumFractionDigits: currency === 'UGX' ? 0 : 2,
        }).format(amount);
    } catch (error) {
        // Fallback for environments that might not support the currency code
        console.warn(`Could not format currency for ${currency}. Falling back to default.`);
        return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: currency === 'UGX' ? 0 : 2 })}`;
    }
};
