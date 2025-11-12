import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceMetric, Currency } from '../types';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/currency';

interface PerformanceChartProps {
  data: PerformanceMetric[];
  selectedCurrency: Currency;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, selectedCurrency }) => {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke={COLORS.charcoal} />
          <YAxis 
            stroke={COLORS.charcoal} 
            tickFormatter={(value) => formatCurrency(value as number, selectedCurrency).replace(/(\.00|,00$)/, '')}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.charcoal,
              color: COLORS.ivory,
              borderRadius: '0.5rem',
              borderColor: COLORS.satinGold,
            }}
            formatter={(value: number, name: string) => {
               if (name === 'Occupancy') return `${value}%`;
               return formatCurrency(value, selectedCurrency);
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.charcoal }} />
          <Bar dataKey="Occupancy" fill={COLORS.satinGold} stroke={COLORS['charcoal-light']} strokeWidth={1} unit="%" />
          <Bar dataKey="ADR" fill={COLORS.deepNavy} stroke={COLORS['charcoal-light']} strokeWidth={1}/>
          <Bar dataKey="RevPAR" fill={COLORS.burgundy} stroke={COLORS['charcoal-light']} strokeWidth={1}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
