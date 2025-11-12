import React, { useState, useMemo } from 'react';
import { KpiCard } from './KpiCard';
import { BedIcon, ClipboardListIcon, LogOutIcon, UsersIcon, TrashIcon, PlusCircleIcon, WarningIcon } from './icons';
import { roomData } from '../constants';
// FIX: Add Currency and ExchangeRates to imports
import { Booking, BookingStatus, User, Service, PaymentMethod, Currency, ExchangeRates, UserRole } from '../types';
import { Modal } from './Modal';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { BookingDetailsModal, StatusBadge } from './BookingDetailsModal';
import { canPerformAction } from '../utils/auth';

// FIX: Changed 'inventory' to 'rooms' to match the Page type definition across the application.
type Page = 'dashboard' | 'bookings' | 'rooms' | 'customers' | 'feedback' | 'finance' | 'settings';

interface ReceptionistDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  bookings: Booking[];
  services: Service[];
  onCheckIn: (bookingId: string) => void;
  onCheckOut: (bookingId: string) => void;
  onSaveBooking: (updatedBooking: Booking, logMessage: string) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}

const ActivityList: React.FC<{ 
  title: string; 
  bookings: Booking[];
  actionType: 'check-in' | 'check-out';
  onAction: (id: string) => void;
  onViewDetails: (booking: Booking) => void;
  userRole: UserRole;
}> = ({ title, bookings, actionType, onAction, onViewDetails, userRole }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
    <h3 className="font-serif text-2xl text-charcoal mb-4">{title}</h3>
    {bookings.length > 0 ? (
      <ul className="space-y-3">
        {bookings.map(booking => (
          <li key={booking.id} className="p-3 bg-charcoal/5 rounded-md transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p className="font-bold text-charcoal">{booking.guestName}</p>
                  <p className="text-sm text-charcoal/70">
                    {booking.roomType} ({booking.roomNumber}) - ID: {booking.id}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <StatusBadge status={booking.status} />
                </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-charcoal/10">
                 <button 
                    onClick={() => onViewDetails(booking)}
                    className="flex-1 bg-deep-navy/10 text-deep-navy text-xs font-bold py-2 px-3 rounded hover:bg-deep-navy/20 transition-colors"
                >
                    Details
                </button>
                {canPerformAction(userRole, 'check_in_out') && actionType === 'check-in' && (
                    <button
                        onClick={() => onAction(booking.id)}
                        className="flex-1 bg-green-600 text-white text-xs font-bold py-2 px-3 rounded hover:bg-green-700 transition-colors"
                    >
                        Check-in
                    </button>
                )}
                 {canPerformAction(userRole, 'check_in_out') && actionType === 'check-out' && (
                    <button
                        onClick={() => onAction(booking.id)}
                        className="flex-1 bg-charcoal text-white text-xs font-bold py-2 px-3 rounded hover:bg-charcoal/80 transition-colors"
                    >
                        Check-out
                    </button>
                )}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-charcoal/60 text-center py-4">No bookings to display.</p>
    )}
  </div>
);

export const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({ user, onNavigate, bookings, services, onCheckIn, onCheckOut, onSaveBooking, onCancelBooking, selectedCurrency, exchangeRates }) => {
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const pendingCheckOuts = bookings.filter(b => b.status === 'Checked-in').length;
    const roomsToClean = roomData.filter(r => r.status === 'Dirty').length;
    const occupiedRooms = roomData.filter(r => r.status === 'Occupied').length;
    const pendingCheckIns = bookings.filter(b => b.status === 'Confirmed').length;

    const upcomingArrivals = bookings.filter(b => b.status === 'Confirmed').sort((a,b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    const currentGuests = bookings.filter(b => b.status === 'Checked-in');
    
    const handleOpenModal = (booking: Booking) => {
        setSelectedBooking(booking);
    };

    const handleCloseModal = () => {
        setSelectedBooking(null);
    };
    
  return (
    <>
      {/* Welcome Header */}
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-satin-gold">
        <h2 className="font-serif text-3xl text-charcoal">Welcome, {user.name}!</h2>
        <p className="text-charcoal/70">This is your operational dashboard for today's activities.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard 
          title="Pending Check-ins"
          value={pendingCheckIns}
          change={0}
          icon={<UsersIcon className="h-8 w-8 text-satin-gold/80" />}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
        <KpiCard 
          title="Guests to Check-out"
          value={pendingCheckOuts}
          change={0}
          icon={<LogOutIcon className="h-8 w-8 text-satin-gold/80" />}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
        <KpiCard 
          title="Rooms to Clean"
          value={roomsToClean}
          change={0}
          icon={<ClipboardListIcon className="h-8 w-8 text-satin-gold/80" />}
          changeIsPositive={false}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
         <KpiCard 
          title="Occupied Rooms"
          value={occupiedRooms}
          change={0}
          icon={<BedIcon className="h-8 w-8 text-satin-gold/80" />}
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
      </div>
      
       {/* Quick Actions */}
      <div className="mb-8">
        <button
            onClick={() => onNavigate('bookings')}
            className="w-full md:w-auto py-3 px-6 bg-satin-gold text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all transform hover:scale-105"
        >
            Manage All Bookings
        </button>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ActivityList 
            title="Upcoming Arrivals" 
            bookings={upcomingArrivals} 
            actionType="check-in"
            onAction={onCheckIn}
            onViewDetails={handleOpenModal}
            userRole={user.role}
        />
        <ActivityList 
            title="Current In-House Guests" 
            bookings={currentGuests} 
            actionType="check-out"
            onAction={onCheckOut}
            onViewDetails={handleOpenModal}
            userRole={user.role}
        />
      </div>

       {selectedBooking && (
        <Modal 
          isOpen={!!selectedBooking} 
          onClose={handleCloseModal} 
          title={`Booking Details: ${selectedBooking.id}`}
        >
          <BookingDetailsModal 
            booking={selectedBooking} 
            onClose={handleCloseModal} 
            onSave={onSaveBooking} 
            onCancelBooking={onCancelBooking}
            user={user}
            services={services}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
          />
        </Modal>
      )}
    </>
  );
};