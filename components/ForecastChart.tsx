import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ForecastPoint, Currency } from '../types';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/currency';

interface ForecastChartProps {
  data: ForecastPoint[];
  selectedCurrency: Currency;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data, selectedCurrency }) => {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="month" stroke={COLORS.charcoal} />
          <YAxis 
            stroke={COLORS.charcoal} 
            tickFormatter={(value) => {
                const num = value as number;
                if (num >= 1000000) return `${formatCurrency(0, selectedCurrency).replace(/0(\.00)?/, '')}${(num / 1000000).toFixed(0)}M`;
                if (num >= 1000) return `${formatCurrency(0, selectedCurrency).replace(/0(\.00)?/, '')}${(num / 1000).toFixed(0)}k`;
                return formatCurrency(num, selectedCurrency);
            }} 
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
          <Legend wrapperStyle={{ color: COLORS.charcoal }}/>
          <Line type="monotone" dataKey="Revenue" stroke={COLORS.satinGold} strokeWidth={3} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Profit" stroke={COLORS.charcoal} strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
