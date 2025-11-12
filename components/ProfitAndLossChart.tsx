import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProfitAndLossData, Currency } from '../types';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/currency';

interface ProfitAndLossChartProps {
  data: ProfitAndLossData[];
  selectedCurrency: Currency;
}

export const ProfitAndLossChart: React.FC<ProfitAndLossChartProps> = ({ data, selectedCurrency }) => {
  const yAxisFormatter = (value: number) => {
    if (Math.abs(value) >= 1000000) {
        return `${formatCurrency(0, selectedCurrency).replace(/0(\.00|,00)?/, '')}${(value / 1000000).toFixed(0)}M`;
    }
    if (Math.abs(value) >= 1000) {
        return `${formatCurrency(0, selectedCurrency).replace(/0(\.00|,00)?/, '')}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value, selectedCurrency);
  };

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" stroke={COLORS.charcoal} />
          <YAxis 
            stroke={COLORS.charcoal} 
            tickFormatter={yAxisFormatter} 
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value, selectedCurrency)}
            contentStyle={{
              backgroundColor: COLORS.charcoal,
              color: COLORS.ivory,
              borderRadius: '0.5rem',
              borderColor: COLORS.satinGold,
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.charcoal }} />
          <Bar dataKey="revenue" name="Revenue" fill={COLORS.satinGold} stroke={COLORS['charcoal-light']} strokeWidth={1} />
          <Bar dataKey="expenses" name="Expenses" fill={COLORS.burgundy} stroke={COLORS['charcoal-light']} strokeWidth={1} />
          <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke={COLORS.charcoal} strokeWidth={3} dot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};