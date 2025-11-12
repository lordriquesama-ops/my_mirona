

import React, { useMemo, useState } from 'react';
import { KpiCard } from './KpiCard';
import { DollarSignIcon, PrintIcon, TrendingUpIcon, DownloadIcon } from './icons';
import { DataTable } from './DataTable';
import { financialKpiData, receiptsData, profitAndLossData } from '../constants';
import { Receipt, Transaction, ExpenseCategoryName, Currency, ExchangeRates, Booking, Service, RoomCategory, Customer, FinancialReportData, UserRole } from '../types';
import { generateReceiptHtml } from '../utils/print';
import { ProfitAndLossChart } from './ProfitAndLossChart';
import { ExpenseChart } from './ExpenseChart';
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { downloadJsonBackup } from '../utils/backup';
import { FinancialReportModal } from './FinancialReportModal';
import { AssetGrowthChart } from './AssetGrowthChart';
import { canPerformAction } from '../utils/auth';

interface FinanceDashboardProps {
  userRole: UserRole;
  transactions: Transaction[];
  bookings: Booking[];
  services: Service[];
  inventory: RoomCategory[];
  customers: Customer[];
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ userRole, transactions: originalTransactions, bookings, services, inventory, customers, selectedCurrency, exchangeRates }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Note: The `transactions` prop is already converted to the selected currency.
  // For reporting, we want to work with the original UGX values.
  const transactions = useMemo(() => {
    // The prop `transactions` is the state from App.tsx. It is already converted there in a memo.
    // The state in `App.tsx` is the source of truth in UGX. The `convertedTransactions` is what's passed to `DataTable`.
    // The `transactions` prop here is the original `transactions` state from App.tsx, which is in UGX.
    // So this component receives UGX values.
    // Let me check App.tsx `renderPage` for finance.
    // `transactions={transactions}` is passed. This is the main state, which is UGX. So no conversion needed here.
    // The `originalTransactions` name is confusing. I will just use `transactions`.
    return originalTransactions;
  }, [originalTransactions]);

  const handlePrintReceipt = (receipt: Receipt) => {
    const receiptHtml = generateReceiptHtml(receipt, selectedCurrency, exchangeRates);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDownloadData = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      bookings,
      transactions,
      services,
      inventory,
      customers,
    };
    const date = new Date().toISOString().split('T')[0];
    downloadJsonBackup(backupData, `mirona_hotel_backup_${date}.json`);
  };

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select a valid start and end date.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });

    const totalRevenue = filteredTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseSummaryMap: { [key in ExpenseCategoryName]?: number } = {};
    filteredTransactions
      .filter(t => t.type === 'Expense' && t.category)
      .forEach(t => {
        if (t.category) {
          expenseSummaryMap[t.category] = (expenseSummaryMap[t.category] || 0) + Math.abs(t.amount);
        }
      });
    
    const expenseSummary = Object.entries(expenseSummaryMap).map(([category, total]) => ({
      category: category as ExpenseCategoryName,
      total
    })).sort((a,b) => b.total - a.total);

    setReportData({
      startDate,
      endDate,
      totalRevenue,
      totalExpenses: Math.abs(totalExpenses),
      netProfit: totalRevenue + totalExpenses, // expenses are negative
      transactions: filteredTransactions,
      expenseSummary,
    });
    setIsReportModalOpen(true);
  };


  const expenseBreakdown = useMemo(() => {
    const categoryTotals: { [key in ExpenseCategoryName]?: number } = {};
    
    transactions
        .filter(t => t.type === 'Expense' && t.category)
        .forEach(t => {
            if (t.category) { // type guard
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
            }
        });

    return Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
    }));
  }, [transactions]);

  const convertedProfitAndLossData = useMemo(() => {
    if (!exchangeRates) return profitAndLossData;
    return profitAndLossData.map(item => ({
      ...item,
      revenue: convertPrice(item.revenue, selectedCurrency, exchangeRates),
      expenses: convertPrice(item.expenses, selectedCurrency, exchangeRates),
      netProfit: convertPrice(item.netProfit, selectedCurrency, exchangeRates),
    }));
  }, [selectedCurrency, exchangeRates]);

  const assetGrowthData = useMemo(() => {
    let cumulativeProfit = 0;
    return profitAndLossData.map(item => {
        cumulativeProfit += item.netProfit;
        return {
            month: item.month,
            value: cumulativeProfit,
        };
    });
  }, []);

  const convertedAssetGrowthData = useMemo(() => {
    if (!exchangeRates) return assetGrowthData;
    return assetGrowthData.map(item => ({
        ...item,
        value: convertPrice(item.value, selectedCurrency, exchangeRates),
    }));
  }, [assetGrowthData, selectedCurrency, exchangeRates]);

  const formatCurrency = (amount: number) => {
    const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
    return formatCurrencyUtil(convertedAmount, selectedCurrency);
  }

  const convertedTransactions = useMemo(() => {
      if (!exchangeRates) return transactions;
      return transactions.map(t => ({
          ...t,
          amount: convertPrice(t.amount, selectedCurrency, exchangeRates)
      }));
  }, [transactions, selectedCurrency, exchangeRates]);

  return (
    <>
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-satin-gold">
        <h2 className="font-serif text-3xl text-charcoal">Financial Overview</h2>
        <p className="text-charcoal/70">A summary of the hotel's financial performance, year-to-date.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard 
          title={financialKpiData.totalRevenue.title} 
          value={financialKpiData.totalRevenue.value} 
          change={financialKpiData.totalRevenue.change}
          icon={<DollarSignIcon className="h-8 w-8 text-satin-gold/80" />}
          formatAs={financialKpiData.totalRevenue.formatAs}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
        <KpiCard 
          title={financialKpiData.totalExpenses.title} 
          value={financialKpiData.totalExpenses.value}
          change={financialKpiData.totalExpenses.change}
          icon={<DollarSignIcon className="h-8 w-8 text-satin-gold/80" />}
          changeIsPositive={false}
          formatAs={financialKpiData.totalExpenses.formatAs}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
        <KpiCard 
          title={financialKpiData.netProfit.title} 
          value={financialKpiData.netProfit.value} 
          change={financialKpiData.netProfit.change}
          icon={<TrendingUpIcon className="h-8 w-8 text-satin-gold/80" />}
          formatAs={financialKpiData.netProfit.formatAs}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
        <KpiCard 
          title={financialKpiData.adr.title} 
          value={financialKpiData.adr.value} 
          change={financialKpiData.adr.change}
          icon={<TrendingUpIcon className="h-8 w-8 text-satin-gold/80" />}
          formatAs={financialKpiData.adr.formatAs}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
      </div>
      
      {/* Reporting and Backup */}
      <div className="my-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h3 className="font-serif text-2xl text-charcoal mb-4">Financial Reporting & Data Backup</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-bold text-charcoal mb-1">Start Date</label>
              <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-bold text-charcoal mb-1">End Date</label>
              <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-start md:justify-end">
            {canPerformAction(userRole, 'generate_reports') && (
                <button onClick={handleGenerateReport} className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                <PrintIcon className="h-5 w-5" />
                Generate Report
                </button>
            )}
            {canPerformAction(userRole, 'download_backup') && (
                <button onClick={handleDownloadData} className="py-2 px-4 bg-deep-navy text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                <DownloadIcon className="h-5 w-5" />
                Download Data Backup
                </button>
            )}
          </div>
        </div>
      </div>


      {/* Profit & Loss and Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="font-serif text-2xl text-charcoal mb-4">Profit & Loss Analysis (YTD)</h3>
          <ProfitAndLossChart data={convertedProfitAndLossData} selectedCurrency={selectedCurrency} />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="font-serif text-2xl text-charcoal mb-4">Expense Breakdown</h3>
          {expenseBreakdown.length > 0 ? (
            <ExpenseChart data={expenseBreakdown} />
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-charcoal/70 text-center py-8">No categorized expense data available.</p>
             </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h3 className="font-serif text-2xl text-charcoal mb-4">Business Value Growth (Cumulative Net Profit)</h3>
        <AssetGrowthChart data={convertedAssetGrowthData} selectedCurrency={selectedCurrency} />
      </div>

      {/* Data Table */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h3 className="font-serif text-2xl text-charcoal mb-4">Detailed Transaction Log</h3>
        <DataTable data={convertedTransactions} selectedCurrency={selectedCurrency} exchangeRates={exchangeRates} />
      </div>

      {/* Receipt History */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h3 className="font-serif text-2xl text-charcoal mb-4">Receipt History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-charcoal/10 hidden md:table-header-group">
              <tr>
                <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Receipt ID</th>
                <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Guest Name</th>
                <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Date Issued</th>
                <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Amount</th>
                <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="responsive-table">
              {receiptsData.map((receipt) => (
                <tr key={receipt.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                  <td data-label="Receipt ID:" className="p-4 md:py-2 md:px-4 block md:table-cell font-mono text-sm">{receipt.id}</td>
                  <td data-label="Guest Name:" className="p-4 md:py-2 md:px-4 block md:table-cell font-bold text-sm">{receipt.guestName}</td>
                  <td data-label="Date Issued:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">{receipt.issueDate}</td>
                  <td data-label="Amount:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-right font-mono font-bold text-sm">{formatCurrency(receipt.grandTotal)}</td>
                  <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-center">
                    <div className="flex justify-end md:justify-center">
                        <button 
                          onClick={() => handlePrintReceipt(receipt)} 
                          className="bg-deep-navy text-white text-xs font-bold py-2 px-3 rounded hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
                        >
                          <PrintIcon className="h-4 w-4" /> Print
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {receiptsData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-charcoal/70">No receipts have been generated yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {isReportModalOpen && reportData && (
        <FinancialReportModal 
          reportData={reportData}
          onClose={() => setIsReportModalOpen(false)}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
      )}
    </>
  );
};
