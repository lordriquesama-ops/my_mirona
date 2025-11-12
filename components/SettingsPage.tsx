import React, { useState } from 'react';
import { User, UserRole, Service, Transaction, HotelInfo, Currency, ExchangeRates, UserStatus, RoomCategory } from '../types';
import { UserManagement } from './UserManagement';
import { RoomPricingManagement } from './RoomPricingManagement';
import { ServiceManagement } from './ServiceManagement';
import { ExpenseManagement } from './ExpenseManagement';

type Tab = 'users' | 'pricing' | 'services' | 'expenses' | 'system';

interface SettingsPageProps {
  user: User;
  hotelInfo: HotelInfo;
  onUpdateHotelInfo: (info: HotelInfo) => void;
  services: Service[];
  transactions: Transaction[];
  onCreateService: (service: Omit<Service, 'id'>) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onCreateExpense: (expense: Omit<Transaction, 'id' | 'type'>) => void;
  onUpdateExpense: (expense: Transaction) => void;
  onDeleteExpense: (transactionId: string) => void;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
  users: User[];
  onCreateUser: (user: Omit<User, 'id' | 'status'>) => void;
  onUpdateUser: (user: User) => void;
  onUpdateUserStatus: (userId: number, newStatus: UserStatus) => void;
  roomCategories: RoomCategory[];
  onUpdateRoomPrices: (updates: { type: RoomCategory['type'], price: number }[]) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal">
      <h2 className="font-serif text-3xl text-charcoal mb-6">System Settings</h2>
      
      <div className="border-b border-charcoal/20 mb-6">
        <nav className="flex space-x-2 sm:space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('users')} className={`font-serif py-3 px-1 border-b-2 text-base sm:text-lg ${activeTab === 'users' ? 'border-satin-gold text-charcoal' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}>
            Users
          </button>
          <button onClick={() => setActiveTab('pricing')} className={`font-serif py-3 px-1 border-b-2 text-base sm:text-lg ${activeTab === 'pricing' ? 'border-satin-gold text-charcoal' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}>
            Pricing
          </button>
          <button onClick={() => setActiveTab('services')} className={`font-serif py-3 px-1 border-b-2 text-base sm:text-lg ${activeTab === 'services' ? 'border-satin-gold text-charcoal' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}>
            Services
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`font-serif py-3 px-1 border-b-2 text-base sm:text-lg ${activeTab === 'expenses' ? 'border-satin-gold text-charcoal' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}>
            Expenses
          </button>
          <button onClick={() => setActiveTab('system')} className={`font-serif py-3 px-1 border-b-2 text-base sm:text-lg ${activeTab === 'system' ? 'border-satin-gold text-charcoal' : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}>
            System
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'users' && <UserManagement user={props.user} users={props.users} onCreate={props.onCreateUser} onUpdate={props.onUpdateUser} onUpdateStatus={props.onUpdateUserStatus} />}
        {activeTab === 'pricing' && <RoomPricingManagement roomCategories={props.roomCategories} onUpdatePrices={props.onUpdateRoomPrices} selectedCurrency={props.selectedCurrency} exchangeRates={props.exchangeRates} />}
        {activeTab === 'services' && <ServiceManagement services={props.services} onCreate={props.onCreateService} onUpdate={props.onUpdateService} onDelete={props.onDeleteService} selectedCurrency={props.selectedCurrency} exchangeRates={props.exchangeRates}/>}
        {activeTab === 'expenses' && <ExpenseManagement expenses={props.transactions.filter(t => t.type === 'Expense')} onCreate={props.onCreateExpense} onUpdate={props.onUpdateExpense} onDelete={props.onDeleteExpense} selectedCurrency={props.selectedCurrency} exchangeRates={props.exchangeRates}/>}
        {activeTab === 'system' && <SystemAndBranding hotelInfo={props.hotelInfo} onUpdateHotelInfo={props.onUpdateHotelInfo} />}
      </div>
    </div>
  );
};

const SystemAndBranding: React.FC<{hotelInfo: HotelInfo, onUpdateHotelInfo: (info: HotelInfo) => void}> = ({ hotelInfo, onUpdateHotelInfo }) => {
    const [formData, setFormData] = useState<HotelInfo>(hotelInfo);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateHotelInfo(formData);
    };
    
    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="font-serif text-2xl text-charcoal mb-4">Hotel Information & Branding</h3>
                <p className="mb-4 text-charcoal/70">Update the hotel's primary information and logo.</p>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                    <div>
                        <label className="block font-bold mb-1">Hotel Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block font-bold mb-1">Logo URL</label>
                        <input type="text" name="logoUrl" value={formData.logoUrl} placeholder="https://example.com/logo.png" className="w-full p-2 border rounded-md"/>
                         {formData.logoUrl && <img src={formData.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain border p-2 rounded-md bg-gray-50"/>}
                    </div>
                    <div>
                        <label className="block font-bold mb-1">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block font-bold mb-1">Contact Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
            <div>
                 <h3 className="font-serif text-2xl text-charcoal mb-4">System Settings</h3>
                 <p className="mb-4 text-charcoal/70">Configure system-wide settings and preferences.</p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                            <p className="font-bold">Automated Guest Notifications</p>
                            <p className="text-sm text-charcoal/60">Send pre-arrival and post-stay emails automatically.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked/>
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-satin-gold/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-satin-gold"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                            <p className="font-bold">Enable Dynamic Pricing</p>
                            <p className="text-sm text-charcoal/60">Allow system to adjust room rates based on demand.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-satin-gold/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-satin-gold"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};