import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Currency, ExchangeRates } from '../types';
import { convertPrice, formatCurrency } from '../utils/currency';

interface KpiCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  changeIsPositive?: boolean;
  formatAs?: 'currency' | 'percentage';
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

const formatDisplayValue = (value: number, format: 'currency' | 'percentage' | undefined, currency: Currency, rates: ExchangeRates) => {
  if (format === 'currency') {
    const convertedValue = convertPrice(value, currency, rates);
    
    // Custom K/M formatting for large numbers
    if (convertedValue >= 1000000) {
      const millions = (convertedValue / 1000000).toFixed(1);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(0).replace('0', '') + millions + 'M';
    }
    if (convertedValue >= 100000) {
      const thousands = Math.round(convertedValue / 1000);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(0).replace('0', '') + thousands + 'K';
    }
    
    return formatCurrency(convertedValue, currency);
  }
  if (format === 'percentage') {
    return `${value}%`;
  }
  return value.toString();
};


export const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, icon, changeIsPositive = true, formatAs, selectedCurrency, exchangeRates }) => {
  const isIncrease = change >= 0;
  const isGoodChange = changeIsPositive ? isIncrease : !isIncrease;
  const formattedValue = formatDisplayValue(value, formatAs, selectedCurrency, exchangeRates);

  return (
    <div className="bg-charcoal text-ivory rounded-lg shadow-lg p-4 flex flex-col justify-between transition-transform transform hover:-translate-y-1 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-repeat opacity-5" 
        style={{backgroundImage: `url('data:image/svg+xml;utf8,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23CFB53B" fill-opacity="0.4"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>')`}}
      ></div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="font-sans uppercase tracking-wider text-ivory/80 text-sm">{title}</p>
          {icon}
        </div>
        <div className="flex-grow flex flex-col items-start justify-center">
          <span className="font-serif text-4xl font-bold text-satin-gold">{formattedValue}</span>
        </div>
        <div className="flex items-center mt-2">
          {change !== 0 && (
            <>
              <span className={`flex items-center text-sm font-bold ${isGoodChange ? 'text-green-400' : 'text-red-400'}`}>
                {isIncrease ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(change)}%
              </span>
              <span className="text-ivory/60 ml-2 text-xs">vs last month</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
