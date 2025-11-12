import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Currency } from '../types';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/currency';

interface AssetGrowthDataPoint {
  month: string;
  value: number;
}

interface AssetGrowthChartProps {
  data: AssetGrowthDataPoint[];
  selectedCurrency: Currency;
}

export const AssetGrowthChart: React.FC<AssetGrowthChartProps> = ({ data, selectedCurrency }) => {
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
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.satinGold} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.satinGold} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" stroke={COLORS.charcoal} />
          <YAxis 
            stroke={COLORS.charcoal} 
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, selectedCurrency), 'Cumulative Profit']}
            contentStyle={{
              backgroundColor: COLORS.charcoal,
              color: COLORS.ivory,
              borderRadius: '0.5rem',
              borderColor: COLORS.satinGold,
            }}
            labelStyle={{ fontWeight: 'bold' }}
            itemStyle={{ color: COLORS.satinGold }}
          />
          <Area type="monotone" dataKey="value" stroke={COLORS.satinGold} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
