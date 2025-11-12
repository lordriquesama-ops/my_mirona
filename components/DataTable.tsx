import React from 'react';
import { Transaction, Currency, ExchangeRates } from '../types';
import { formatCurrency, convertPrice } from '../utils/currency';

interface DataTableProps {
    data: Transaction[];
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export const DataTable: React.FC<DataTableProps> = ({ data, selectedCurrency, exchangeRates }) => {
  
  return (
    <div className="overflow-x-auto text-charcoal">
      <table className="min-w-full bg-white">
        <thead className="bg-charcoal/10 hidden md:table-header-group">
          <tr>
            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Transaction ID</th>
            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Date</th>
            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Description</th>
            <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Amount</th>
          </tr>
        </thead>
        <tbody className="responsive-table">
          {data.map((transaction) => {
            const convertedAmount = convertPrice(transaction.amount, selectedCurrency, exchangeRates);
            return (
                <tr key={transaction.id} className="md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                <td data-label="Transaction ID:" className="md:py-2 md:px-4 md:table-cell whitespace-nowrap text-sm">
                    {transaction.id}
                </td>
                <td data-label="Date:" className="md:py-2 md:px-4 md:table-cell whitespace-nowrap text-sm">
                    {transaction.date}
                </td>
                <td data-label="Description:" className="md:py-2 md:px-4 md:table-cell whitespace-nowrap text-sm">
                    {transaction.description}
                </td>
                <td data-label="Amount:" className={`md:py-2 md:px-4 md:table-cell whitespace-nowrap md:text-right font-bold text-sm ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(convertedAmount, selectedCurrency)}
                </td>
                </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};
