
import React from 'react';
import { Modal } from './Modal';
import { FinancialReportData, Currency, ExchangeRates, Transaction } from '../types';
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { PrintIcon } from './icons';

interface FinancialReportModalProps {
  reportData: FinancialReportData;
  onClose: () => void;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

const Kpi: React.FC<{ title: string; value: string; color?: string }> = ({ title, value, color = 'text-charcoal' }) => (
    <div className="bg-charcoal/5 p-4 rounded-lg text-center">
        <p className="text-sm uppercase font-bold text-charcoal/70">{title}</p>
        <p className={`font-serif text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({ reportData, onClose, selectedCurrency, exchangeRates }) => {
    
    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
        return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={`Financial Report`}
        >
            <div className="printable-area">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl">
                        Period: {new Date(reportData.startDate).toLocaleDateString()} to {new Date(reportData.endDate).toLocaleDateString()}
                    </h3>
                    <button onClick={handlePrint} className="no-print py-2 px-4 bg-deep-navy text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                        <PrintIcon className="h-5 w-5" />
                        Print Report
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Kpi title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} color="text-green-600" />
                    <Kpi title="Total Expenses" value={formatCurrency(reportData.totalExpenses)} color="text-red-600" />
                    <Kpi 
                        title="Net Profit" 
                        value={formatCurrency(reportData.netProfit)} 
                        color={reportData.netProfit >= 0 ? 'text-charcoal' : 'text-red-600'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction List */}
                    <div className="lg:col-span-2">
                        <h4 className="font-serif text-xl mb-2">Detailed Transactions</h4>
                        <div className="overflow-auto max-h-96 border rounded-lg">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-charcoal/10 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-bold">Date</th>
                                        <th className="py-2 px-3 text-left font-bold">Description</th>
                                        <th className="py-2 px-3 text-right font-bold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.transactions.map((t: Transaction) => (
                                        <tr key={t.id} className="border-b last:border-b-0 hover:bg-satin-gold/10">
                                            <td className="py-2 px-3 whitespace-nowrap">{t.date}</td>
                                            <td className="py-2 px-3">{t.description}</td>
                                            <td className={`py-2 px-3 text-right font-mono font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Expense Summary */}
                    <div>
                        <h4 className="font-serif text-xl mb-2">Expense Summary</h4>
                        <div className="bg-charcoal/5 p-4 rounded-lg">
                           {reportData.expenseSummary.length > 0 ? (
                             <ul className="space-y-2">
                                {reportData.expenseSummary.map(summary => (
                                    <li key={summary.category} className="flex justify-between items-center text-sm border-b border-charcoal/10 pb-1">
                                        <span className="font-bold">{summary.category}</span>
                                        <span className="font-mono">{formatCurrency(summary.total)}</span>
                                    </li>
                                ))}
                            </ul>
                           ) : (
                            <p className="text-charcoal/70 text-center py-4">No categorized expenses in this period.</p>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
