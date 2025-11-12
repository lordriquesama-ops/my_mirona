

import React, { useState, useMemo } from 'react';
// FIX: Add Currency and ExchangeRates to imports
import { Customer, UserRole, Currency, ExchangeRates } from '../types';
import { Modal } from './Modal';
import { Notification } from './Notification';
import { EditIcon, MailIcon, PhoneIcon } from './icons';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { canPerformAction } from '../utils/auth';

interface CustomerManagementProps {
    userRole: UserRole;
    customers: Customer[];
    onSaveCustomer: (customer: Customer) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ userRole, customers, onSaveCustomer, selectedCurrency, exchangeRates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };
  
  const handleOpenModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };
  
  const handleSaveCustomer = (customerToSave: Customer) => {
    onSaveCustomer(customerToSave);
    handleCloseModal();
  };

  const formatCurrency = (amount: number) => {
    // FIX: Perform currency conversion before formatting
    const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
    return formatCurrencyUtil(convertedAmount, selectedCurrency);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal relative">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <h2 className="font-serif text-3xl text-charcoal">Customer Database</h2>
        <input
          type="text"
          placeholder="Search by Name or Email..."
          className="w-full md:w-1/3 pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-charcoal/10 hidden md:table-header-group">
            <tr>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Customer Name</th>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Contact Info</th>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Member Since</th>
              <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Total Bookings</th>
              <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Lifetime Value</th>
              <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="responsive-table">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                <td data-label="Customer Name:" className="p-4 md:py-2 md:px-4 block md:table-cell font-bold text-sm">{customer.name}</td>
                <td data-label="Contact Info:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">
                    <div className="flex items-center justify-end md:justify-start gap-2 text-xs text-charcoal/80">
                        <MailIcon className="h-4 w-4"/> {customer.email}
                    </div>
                     <div className="flex items-center justify-end md:justify-start gap-2 text-xs text-charcoal/80 mt-1">
                        <PhoneIcon className="h-4 w-4"/> {customer.phone}
                    </div>
                </td>
                <td data-label="Member Since:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">{customer.joinDate}</td>
                <td data-label="Total Bookings:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-center font-mono font-bold text-base">{customer.totalBookings}</td>
                <td data-label="Lifetime Value:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-right font-mono font-bold text-base">{formatCurrency(customer.totalSpent)}</td>
                <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-center">
                   <div className="flex justify-end md:justify-center">
                        <button onClick={() => handleOpenModal(customer)} className="bg-deep-navy text-white text-xs font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors">
                            View Details
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedCustomer && (
        <CustomerFormModal 
            customer={selectedCustomer} 
            onSave={handleSaveCustomer} 
            onClose={handleCloseModal} 
            isReadOnly={!canPerformAction(userRole, 'edit_customer')}
        />
      )}
    </div>
  );
};

const CustomerFormModal: React.FC<{ 
    customer: Customer; 
    onSave: (customer: Customer) => void; 
    onClose: () => void;
    isReadOnly: boolean;
}> = ({ customer, onSave, onClose, isReadOnly }) => {
    const [formData, setFormData] = useState<Customer>(customer);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={isReadOnly ? `Details for ${customer.name}` : `Edit Customer: ${customer.name}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block font-bold mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isReadOnly}/>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isReadOnly}/>
                </div>
                <div>
                    <label className="block font-bold mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isReadOnly}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-bold mb-1">Total Bookings</label>
                        <input type="number" name="totalBookings" value={formData.totalBookings} onChange={handleChange} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isReadOnly}/>
                    </div>
                    <div>
                        <label className="block font-bold mb-1">Total Spent</label>
                        <input type="number" name="totalSpent" value={formData.totalSpent} onChange={handleChange} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isReadOnly}/>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">
                            Save Changes
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    )
}
