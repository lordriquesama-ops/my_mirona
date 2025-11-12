import React, { useState } from 'react';
// FIX: Add Currency and ExchangeRates to imports
import { Transaction, expenseCategories, ExpenseCategoryName, Currency, ExchangeRates } from '../types';
import { Modal } from './Modal';
import { EditIcon, TrashIcon, WarningIcon } from './icons';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';

interface ExpenseManagementProps {
    expenses: Transaction[];
    onCreate: (expense: Omit<Transaction, 'id' | 'type'>) => void;
    onUpdate: (expense: Transaction) => void;
    onDelete: (transactionId: string) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

const AddExpenseForm: React.FC<{
    onAdd: ExpenseManagementProps['onCreate'];
    onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: expenseCategories[0] as ExpenseCategoryName,
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setError('');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description.trim() || !formData.date || formData.amount <= 0) {
            setError('Please provide a valid date, description, and a positive amount.');
            return;
        }
        onAdd({ ...formData, amount: Number(formData.amount) });
        setFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, category: expenseCategories[0] });
    };

    return (
        <div className="bg-charcoal/5 p-4 rounded-lg mb-6 border border-satin-gold/20">
            <h3 className="font-serif text-2xl text-charcoal mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div className="md:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" required placeholder="e.g., Linen Supply Co." />
                </div>
                <div className="md:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md">
                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Amount (UGX)</label>
                    <input type="number" name="amount" value={formData.amount || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required placeholder="e.g., 4621925" step="1" min="1" />
                </div>
                <div className="flex justify-end gap-2 md:col-span-1">
                    <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold text-sm w-full md:w-auto">Cancel</button>
                    <button type="submit" className="py-2 px-4 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold text-sm w-full md:w-auto">Add Expense</button>
                </div>
            </form>
            {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>
    );
};

const EditExpenseModal: React.FC<{
    expense: Transaction;
    onClose: () => void;
    onSave: ExpenseManagementProps['onUpdate'];
}> = ({ expense, onClose, onSave }) => {
    const [formData, setFormData] = useState({ 
        ...expense, 
        amount: Math.abs(expense.amount),
        category: expense.category || expenseCategories[0],
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Transaction);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Edit Expense: ${expense.description}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block font-bold mb-1">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block font-bold mb-1">Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                 <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md">
                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block font-bold mb-1">Amount (UGX)</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-2 border rounded-md" required step="1" min="1" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                    <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};


export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ expenses, onCreate, onUpdate, onDelete, selectedCurrency, exchangeRates }) => {
    const [isAddFormVisible, setIsAddFormVisible] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
        return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };

    const handleEditClick = (expense: Transaction) => setSelectedExpense(expense);
    const handleCloseModal = () => setSelectedExpense(null);

    const handleDeleteClick = (expense: Transaction) => {
        setSelectedExpense(expense);
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = () => {
        if (selectedExpense) {
            onDelete(selectedExpense.id);
            setIsDeleteModalOpen(false);
            setSelectedExpense(null);
        }
    };

    return (
        <div className="space-y-4">
            <p className="mb-4 text-charcoal/70">Track and manage all hotel expenditures.</p>
            {!isAddFormVisible && (
                <button onClick={() => setIsAddFormVisible(true)} className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors">
                    Add New Expense
                </button>
            )}
            {isAddFormVisible && <AddExpenseForm onAdd={onCreate} onCancel={() => setIsAddFormVisible(false)} />}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-charcoal/10 hidden md:table-header-group">
                        <tr>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Date</th>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Description</th>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Category</th>
                            <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Amount</th>
                            <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="responsive-table">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                                <td data-label="Date:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">{expense.date}</td>
                                <td data-label="Description:" className="p-4 md:py-2 md:px-4 block md:table-cell font-bold text-sm">{expense.description}</td>
                                <td data-label="Category:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-charcoal/10 text-charcoal">
                                        {expense.category || 'N/A'}
                                    </span>
                                </td>
                                <td data-label="Amount:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-right font-mono font-bold text-red-600 text-sm">{formatCurrency(expense.amount)}</td>
                                <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell">
                                    <div className="flex justify-end md:justify-center gap-2">
                                        <button onClick={() => handleEditClick(expense)} className="p-2 text-deep-navy hover:text-deep-navy/70"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteClick(expense)} className="p-2 text-red-600 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {selectedExpense && !isDeleteModalOpen && (
                <EditExpenseModal expense={selectedExpense} onClose={handleCloseModal} onSave={onUpdate} />
            )}
            
            {isDeleteModalOpen && selectedExpense && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Expense Deletion">
                    <div className="text-center">
                        <WarningIcon className="h-16 w-16 text-burgundy mx-auto mb-4" />
                        <p className="text-xl mb-4">
                            Are you sure you want to delete the expense for <strong className="font-serif font-bold">{selectedExpense.description}</strong>?
                        </p>
                        <p className="text-charcoal/70">This action cannot be undone.</p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                            <button onClick={confirmDelete} className="py-2 px-6 rounded-md bg-burgundy text-white font-bold hover:bg-burgundy/90">Delete Expense</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
