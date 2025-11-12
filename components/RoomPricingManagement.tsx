import React, { useState, useEffect } from 'react';
import { RoomCategory, Currency, ExchangeRates } from '../types';
import { convertPrice, formatCurrency } from '../utils/currency';

interface RoomPricingManagementProps {
    roomCategories: RoomCategory[];
    onUpdatePrices: (updates: { type: RoomCategory['type'], price: number }[]) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export const RoomPricingManagement: React.FC<RoomPricingManagementProps> = ({ roomCategories, onUpdatePrices, selectedCurrency, exchangeRates }) => {
    const [prices, setPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        const initialPrices = roomCategories.reduce((acc, category) => {
            acc[category.type] = category.price;
            return acc;
        }, {} as Record<string, number>);
        setPrices(initialPrices);
    }, [roomCategories]);

    const handlePriceChange = (roomType: string, value: string) => {
        const newPrice = Number(value);
        if (!isNaN(newPrice) && newPrice >= 0) {
            setPrices(prev => ({ ...prev, [roomType]: newPrice }));
        }
    };

    const handleSaveChanges = () => {
        const updates = Object.entries(prices)
            .map(([type, price]) => ({
                type: type as RoomCategory['type'],
                price
            }));
        onUpdatePrices(updates);
    };

    const getConvertedPrice = (ugxPrice: number) => {
        if (selectedCurrency === 'UGX') return null;
        const converted = convertPrice(ugxPrice, selectedCurrency, exchangeRates);
        return formatCurrency(converted, selectedCurrency);
    };

    return (
        <div>
            <p className="mb-4 text-charcoal/70">Set the base price (in UGX) for each room category. This will update the price for all rooms within that category.</p>
            <div className="space-y-4 max-w-2xl">
                {roomCategories.map(category => {
                    const currentPrice = prices[category.type] || 0;
                    const convertedPriceDisplay = getConvertedPrice(currentPrice);
                    return (
                        <div key={category.type} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-charcoal/5 p-3 rounded-md">
                            <label htmlFor={`price-${category.type}`} className="font-bold text-charcoal md:col-span-1">{category.type}</label>
                            <div className="relative md:col-span-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60">UGX</span>
                                <input
                                    id={`price-${category.type}`}
                                    type="number"
                                    value={currentPrice || ''}
                                    onChange={e => handlePriceChange(category.type, e.target.value)}
                                    className="w-full p-2 pl-10 border rounded-md"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div className="md:col-span-1 text-right md:text-left">
                                {convertedPriceDisplay && (
                                    <span className="text-sm font-mono text-charcoal/70">
                                        ≈ {convertedPriceDisplay}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6">
                <button
                    onClick={handleSaveChanges}
                    className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold transition-colors"
                >
                    Save Price Changes
                </button>
            </div>
        </div>
    );
};
