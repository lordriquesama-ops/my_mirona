import React, { useState } from 'react';
// FIX: Add Currency and ExchangeRates to imports
import { Service, Currency, ExchangeRates } from '../types';
import { Modal } from './Modal';
import { EditIcon, TrashIcon, WarningIcon } from './icons';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';

interface ServiceManagementProps {
    services: Service[];
    onCreate: (service: Omit<Service, 'id'>) => void;
    onUpdate: (service: Service) => void;
    onDelete: (serviceId: string) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

const AddServiceForm: React.FC<{
    onAdd: (service: Omit<Service, 'id'>) => void;
    onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', price: 0 });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setError('');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || formData.price <= 0) {
            setError('Please provide a valid name and a positive price.');
            return;
        }
        onAdd({ ...formData, price: Number(formData.price) });
        setFormData({ name: '', price: 0 });
    };

    return (
        <div className="bg-charcoal/5 p-4 rounded-lg mb-6 border border-satin-gold/20">
            <h3 className="font-serif text-2xl text-charcoal mb-4">Add New Service</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block font-bold mb-1 text-sm">Service Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required placeholder="e.g., Valet Parking" />
                </div>
                <div className="md:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Price (UGX)</label>
                    <input type="number" name="price" value={formData.price || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required placeholder="e.g., 50000" step="1000" min="0" />
                </div>
                <div className="flex justify-end gap-2 md:col-span-1">
                    <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold text-sm w-full md:w-auto">Cancel</button>
                    <button type="submit" className="py-2 px-4 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold text-sm w-full md:w-auto">Add Service</button>
                </div>
            </form>
            {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>
    );
};

const EditServiceModal: React.FC<{
    service: Service;
    onClose: () => void;
    onSave: ServiceManagementProps['onUpdate'];
}> = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState(service);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Edit Service: ${service.name}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block font-bold mb-1">Service Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block font-bold mb-1">Price (UGX)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md" required step="1000" min="0" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                    <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};


export const ServiceManagement: React.FC<ServiceManagementProps> = ({ services, onCreate, onUpdate, onDelete, selectedCurrency, exchangeRates }) => {
    const [isAddFormVisible, setIsAddFormVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
        return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };

    const handleEditClick = (service: Service) => setSelectedService(service);
    const handleCloseModal = () => setSelectedService(null);

    const handleDeleteClick = (service: Service) => {
        setSelectedService(service);
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = () => {
        if (selectedService) {
            onDelete(selectedService.id);
            setIsDeleteModalOpen(false);
            setSelectedService(null);
        }
    };

    return (
        <div className="space-y-4">
            <p className="mb-4 text-charcoal/70">Add, edit, or remove guest services offered by the hotel.</p>
            {!isAddFormVisible && (
                <button onClick={() => setIsAddFormVisible(true)} className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors">
                    Add New Service
                </button>
            )}
            {isAddFormVisible && <AddServiceForm onAdd={onCreate} onCancel={() => setIsAddFormVisible(false)} />}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-charcoal/10 hidden md:table-header-group">
                        <tr>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Service Name</th>
                            <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Price</th>
                            <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="responsive-table">
                        {services.map(service => (
                            <tr key={service.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                                <td data-label="Service Name:" className="p-4 md:py-2 md:px-4 block md:table-cell font-bold text-sm">{service.name}</td>
                                <td data-label="Price:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-right font-mono font-bold text-sm">{formatCurrency(service.price)}</td>
                                <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell">
                                    <div className="flex justify-end md:justify-center gap-2">
                                        <button onClick={() => handleEditClick(service)} className="p-2 text-deep-navy hover:text-deep-navy/70"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteClick(service)} className="p-2 text-red-600 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {selectedService && !isDeleteModalOpen && (
                <EditServiceModal service={selectedService} onClose={handleCloseModal} onSave={onUpdate} />
            )}
            
            {isDeleteModalOpen && selectedService && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Service Deletion">
                    <div className="text-center">
                        <WarningIcon className="h-16 w-16 text-burgundy mx-auto mb-4" />
                        <p className="text-xl mb-4">
                            Are you sure you want to delete the service <strong className="font-serif font-bold">{selectedService.name}</strong>?
                        </p>
                        <p className="text-charcoal/70">This will not affect past bookings, but it will be unavailable for future bookings.</p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                            <button onClick={confirmDelete} className="py-2 px-6 rounded-md bg-burgundy text-white font-bold hover:bg-burgundy/90">Delete Service</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
