
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExpenseCategory } from '../types';
import { COLORS } from '../constants';

interface ExpenseChartProps {
  data: ExpenseCategory[];
}

const PIE_COLORS = [COLORS.charcoal, COLORS.satinGold, COLORS.deepNavy, COLORS.burgundy, '#4c6c6c'];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{
              backgroundColor: COLORS.charcoal,
              color: COLORS.ivory,
              borderRadius: '0.5rem',
              borderColor: COLORS.satinGold,
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.charcoal, paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
