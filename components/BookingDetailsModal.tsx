import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus, User, Service, PaymentMethod, Currency, ExchangeRates } from '../types';
import { TrashIcon, PlusCircleIcon, WarningIcon } from './icons';
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { canPerformAction } from '../utils/auth';

export const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-bold rounded-full text-white uppercase tracking-wider";
  const statusColors: Record<BookingStatus, string> = {
    'Confirmed': 'bg-deep-navy',
    'Checked-in': 'bg-green-600',
    'Checked-out': 'bg-charcoal/80',
    'Cancelled': 'bg-red-600',
  };
  return <span className={`${baseClasses} ${statusColors[status]}`}>{status}</span>;
};

export const BookingDetailsModal: React.FC<{
  booking: Booking;
  onClose: () => void;
  onSave: (updatedBooking: Booking, logMessage: string) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  user: User;
  services: Service[];
  selectedCurrency: Currency;
  exchangeRates: ExchangeRates;
}> = ({ booking, onClose, onSave, onCancelBooking, user, services, selectedCurrency, exchangeRates }) => {
    const [preferences, setPreferences] = useState(booking.guestPreferences || '');
    const [currentServices, setCurrentServices] = useState<Service[]>(booking.services);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(booking.paymentMethod);
    const [serviceToAdd, setServiceToAdd] = useState<string>('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    
    const isReadOnly = !canPerformAction(user.role, 'edit_booking');
    const canCancel = canPerformAction(user.role, 'cancel_booking');

    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
        return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };

    const grandTotal = useMemo(() => {
        const servicesTotal = currentServices.reduce((acc, s) => acc + s.price, 0);
        return booking.roomTotal + servicesTotal;
    }, [currentServices, booking.roomTotal]);
    const tax = grandTotal * 0.10;
    const finalTotal = grandTotal + tax;

    const handleAddService = () => {
        if (serviceToAdd) {
            const service = services.find(s => s.id === serviceToAdd);
            if (service && !currentServices.find(s => s.id === service.id)) {
                setCurrentServices([...currentServices, service]);
                setServiceToAdd('');
            }
        }
    };
    
    const handleRemoveService = (serviceId: string) => {
        setCurrentServices(currentServices.filter(s => s.id !== serviceId));
    };

    const handleSave = () => {
        if (isReadOnly) return;
        
        const updatedBooking: Booking = { 
            ...booking, 
            guestPreferences: preferences,
            services: currentServices,
            paymentMethod: paymentMethod,
        };
        
        const logParts: string[] = [];
        if (preferences !== (booking.guestPreferences || '')) logParts.push("updated guest preferences");
        if (paymentMethod !== booking.paymentMethod) logParts.push(`set payment method to ${paymentMethod}`);
        
        const addedServices = currentServices.filter(cs => !booking.services.find(bs => bs.id === cs.id));
        const removedServices = booking.services.filter(bs => !currentServices.find(cs => cs.id === bs.id));
        if (addedServices.length > 0) logParts.push(`added service(s): ${addedServices.map(s => s.name).join(', ')}`);
        if (removedServices.length > 0) logParts.push(`removed service(s): ${removedServices.map(s => s.name).join(', ')}`);

        if (logParts.length === 0) {
            onClose();
            return;
        }
        
        const actionDescription = logParts.join(', ');
        const logMessage = `${actionDescription.charAt(0).toUpperCase() + actionDescription.slice(1)}.`;

        onSave(updatedBooking, logMessage);
        onClose();
    };

    const handleConfirmCancellation = () => {
        if (cancellationReason.trim()) {
            onCancelBooking(booking.id, cancellationReason);
            onClose();
        }
    };

    if (isCancelling) {
        return (
            <div className="space-y-4 text-charcoal">
                <div className="text-center">
                    <WarningIcon className="h-16 w-16 text-burgundy mx-auto mb-4" />
                    <h3 className="font-serif text-2xl text-burgundy">Confirm Cancellation</h3>
                </div>
                <p className="text-center">You are about to cancel the booking for <strong>{booking.guestName}</strong> (ID: {booking.id}). This action is irreversible.</p>
                <div>
                    <label htmlFor="cancellationReason" className="block text-lg font-serif mb-2">Reason for Cancellation</label>
                    <textarea
                        id="cancellationReason"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy h-24"
                        placeholder="e.g., Guest request, payment issue, no-show..."
                        autoFocus
                    />
                </div>
                 <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setIsCancelling(false)} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors font-bold">
                        Back to Details
                    </button>
                    <button 
                        onClick={handleConfirmCancellation} 
                        disabled={!cancellationReason.trim()}
                        className="py-2 px-6 rounded-md bg-burgundy text-white hover:bg-opacity-90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 text-charcoal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><strong className="font-serif">Guest:</strong> {booking.guestName}</div>
                <div><strong className="font-serif">Room:</strong> {booking.roomType} ({booking.roomNumber})</div>
                <div><strong className="font-serif">Check-in:</strong> {booking.checkIn}</div>
                <div><strong className="font-serif">Check-out:</strong> {booking.checkOut}</div>
                 <div><strong className="font-serif">Status:</strong> <StatusBadge status={booking.status} /></div>
            </div>

            <div className="border-t border-b border-charcoal/10 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm">
                     <h4 className="font-serif text-lg border-b border-charcoal/20 pb-1 mb-2">Bill Summary</h4>
                     <div className="flex justify-between"><span>Room Total:</span> <span>{formatCurrency(booking.roomTotal)}</span></div>
                     {currentServices.map(s => (
                         <div key={s.id} className="flex justify-between text-xs"><span>{s.name}</span> <span>{formatCurrency(s.price)}</span></div>
                     ))}
                     <div className="flex justify-between font-bold pt-2 border-t border-charcoal/10"><span>Subtotal:</span> <span>{formatCurrency(grandTotal)}</span></div>
                     <div className="flex justify-between text-xs"><span>Taxes (10%):</span> <span>{formatCurrency(tax)}</span></div>
                     <div className="flex justify-between font-bold text-base font-serif"><span>Grand Total:</span> <span>{formatCurrency(finalTotal)}</span></div>
                </div>
                <div>
                     <h4 className="font-serif text-lg border-b border-charcoal/20 pb-1 mb-2">Payment</h4>
                     <label htmlFor="paymentMethod" className="block text-sm font-bold mb-1">Payment Method</label>
                     <select 
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        disabled={isReadOnly}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold disabled:bg-gray-100"
                     >
                        <option>Pending</option>
                        <option>Credit Card</option>
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                     </select>
                </div>
            </div>

            <div className="space-y-2">
                 <h4 className="font-serif text-lg">Manage Services</h4>
                 {!isReadOnly && (
                 <div className="flex gap-2">
                    <select 
                        value={serviceToAdd}
                        onChange={(e) => setServiceToAdd(e.target.value)}
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
                    >
                        <option value="">Select a service to add...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id} disabled={!!currentServices.find(cs => cs.id === s.id)}>
                                {s.name} - {formatCurrency(s.price)}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAddService} className="py-2 px-4 rounded-md bg-deep-navy text-white hover:bg-opacity-90 font-bold flex items-center gap-1"><PlusCircleIcon className="h-4 w-4"/> Add</button>
                 </div>
                 )}
                 <div className="flex flex-wrap gap-2 pt-2">
                    {currentServices.map(s => (
                        <div key={s.id} className="bg-charcoal/10 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                            <span>{s.name}</span>
                            {!isReadOnly && <button onClick={() => handleRemoveService(s.id)} className="text-red-600 hover:text-red-400"><TrashIcon className="h-4 w-4"/></button>}
                        </div>
                    ))}
                 </div>
            </div>
            
            <div>
                <label htmlFor="preferences" className="block text-lg font-serif mb-2">Guest Preferences</label>
                <textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold h-24 disabled:bg-gray-100"
                    placeholder="e.g., High floor, extra pillows..."
                    disabled={isReadOnly}
                />
            </div>
            
            <div>
                 <h4 className="font-serif text-lg">Activity Log</h4>
                 <div className="bg-charcoal/5 p-3 rounded-md max-h-32 overflow-y-auto space-y-2 text-sm">
                    {booking.auditLog.slice().reverse().map((log, index) => (
                        <p key={index} className="border-b border-charcoal/10 pb-1">
                            <span className="font-bold">{log.user}:</span> {log.action} <span className="text-xs text-charcoal/60 float-right">{log.timestamp}</span>
                        </p>
                    ))}
                 </div>
            </div>
            
            <div className="flex justify-between items-center gap-4 mt-6">
                <div>
                    {canCancel && !isReadOnly && booking.status === 'Confirmed' && (
                        <button 
                            onClick={() => setIsCancelling(true)}
                            className="py-2 px-6 rounded-md bg-burgundy/10 text-burgundy hover:bg-burgundy/20 font-bold transition-colors"
                        >
                            Cancel Booking
                        </button>
                    )}
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors font-bold">
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button onClick={handleSave} className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 transition-colors font-bold">
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}