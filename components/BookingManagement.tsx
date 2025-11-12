

import React, { useState, useMemo } from 'react';
import { roomData, inventoryData } from '../constants';
// FIX: Add Currency and ExchangeRates to imports
import { Booking, BookingStatus, User, Service, PaymentMethod, AuditLogEntry, Room, InventoryRoom, Currency, ExchangeRates } from '../types';
import { Modal } from './Modal';
import { PrintIcon, TrashIcon, PlusCircleIcon, WarningIcon } from './icons';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { BookingDetailsModal, StatusBadge } from './BookingDetailsModal';
import { canPerformAction } from '../utils/auth';

const calculateGrandTotal = (booking: Booking): number => {
    const servicesTotal = booking.services.reduce((acc, service) => acc + service.price, 0);
    return booking.roomTotal + servicesTotal;
};

const AddBookingModal: React.FC<{
    onClose: () => void;
    onCreate: (bookingData: Omit<Booking, 'id' | 'auditLog' | 'status'> & { id?: string; guestEmail: string; guestPhone: string; }) => void;
    services: Service[];
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}> = ({ onClose, onCreate, services, selectedCurrency, exchangeRates }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        id: '',
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        checkIn: '',
        checkOut: '',
        roomType: '' as Room['roomType'] | '',
        roomNumber: '',
        roomTotal: 0,
        services: [] as Service[],
        guestPreferences: '',
        paymentMethod: 'Pending' as PaymentMethod,
    });
    const [selectedRoomTypeForSelection, setSelectedRoomTypeForSelection] = useState<Room['roomType'] | null>(null);
    const [error, setError] = useState('');

    const formatCurrency = (amount: number) => {
      const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
      return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };

    const roomTypesAvailable = useMemo(() => {
        const types = new Map<Room['roomType'], { price: number }>();
        roomData.forEach(room => {
            if (!types.has(room.roomType)) {
                types.set(room.roomType, { price: room.price });
            }
        });
        return Array.from(types.entries()).map(([type, data]) => ({ type, ...data }));
    }, []);
    
    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!formData.guestName || !formData.guestEmail || !formData.guestPhone || !formData.checkIn || !formData.checkOut) {
                setError('All fields are required.');
                return;
            }
            if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
                setError('Check-out date must be after the check-in date.');
                return;
            }
        }
        if (step === 2) {
            if (!formData.roomType || !formData.roomNumber) {
                setError('Please select a room category and a specific room.');
                return;
            }
        }
        setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step === 2 && selectedRoomTypeForSelection) {
            setSelectedRoomTypeForSelection(null);
            setFormData(prev => ({ ...prev, roomType: '', roomTotal: 0, roomNumber: '' }));
        } else {
            setStep(s => s - 1);
        }
    };
    
    const handleSubmit = () => {
        const { guestEmail, guestPhone, ...bookingData } = formData;
        onCreate({ ...bookingData, guestEmail, guestPhone });
        onClose();
    };

    const handleServiceToggle = (service: Service) => {
        setFormData(prev => {
            const hasService = prev.services.some(s => s.id === service.id);
            if (hasService) {
                return { ...prev, services: prev.services.filter(s => s.id !== service.id) };
            } else {
                return { ...prev, services: [...prev.services, service] };
            }
        });
    };
    
    const finalTotal = useMemo(() => {
        const servicesTotal = formData.services.reduce((acc, s) => acc + s.price, 0);
        const subtotal = formData.roomTotal + servicesTotal;
        const tax = subtotal * 0.10;
        return subtotal + tax;
    }, [formData]);

    const stepTitles = ["Guest & Dates", "Room Selection", "Add-ons & Preferences", "Confirmation"];
    
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block font-bold mb-1">Guest Full Name</label>
                                <input type="text" value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Guest Email</label>
                                <input type="email" value={formData.guestEmail} onChange={e => setFormData({...formData, guestEmail: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            </div>
                         </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold mb-1">Guest Phone</label>
                                <input type="tel" value={formData.guestPhone} onChange={e => setFormData({...formData, guestPhone: e.target.value})} className="w-full p-2 border rounded-md" required/>
                            </div>
                             <div>
                                <label className="block font-bold mb-1">Booking ID <span className="font-normal text-charcoal/70">(Optional)</span></label>
                                <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} className="w-full p-2 border rounded-md" placeholder="Auto-generated if empty"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label className="block font-bold mb-1">Check-in Date</label>
                                <input type="date" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} className="w-full p-2 border rounded-md" required min={new Date().toISOString().split('T')[0]}/>
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Check-out Date</label>
                                <input type="date" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} className="w-full p-2 border rounded-md" required min={formData.checkIn ? new Date(new Date(formData.checkIn).getTime() + 86400000).toISOString().split('T')[0] : ''} />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                const categoryFromInventory = inventoryData.find(c => c.type === selectedRoomTypeForSelection);
                let availableRooms: InventoryRoom[] = [];
                if (categoryFromInventory) {
                    availableRooms = Object.values(categoryFromInventory.inventory)
                        .flat()
                        .filter(room => room.status === 'Available');
                }

                return (
                    <div>
                        {!selectedRoomTypeForSelection ? (
                            <>
                                <p className="mb-4 text-charcoal/70">First, select a room category.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roomTypesAvailable.map(({ type, price }) => (
                                        <button key={type} onClick={() => {
                                            setFormData(prev => ({ ...prev, roomType: type, roomTotal: price, roomNumber: '' }));
                                            setSelectedRoomTypeForSelection(type);
                                        }} className={'p-4 border-2 rounded-lg text-left transition-colors border-gray-300 hover:border-satin-gold/50'}>
                                            <h4 className="font-serif text-lg font-bold">{type}</h4>
                                            <p className="font-mono text-base">{formatCurrency(price)}/night</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-serif text-lg font-bold">Available Rooms for {selectedRoomTypeForSelection}</h4>
                                </div>
                                {availableRooms.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-2">
                                        {availableRooms.map(room => {
                                            const roomName = room.id.split('-').slice(1).join('-');
                                            return (
                                                <button key={room.id} onClick={() => setFormData(prev => ({...prev, roomNumber: roomName}))}
                                                    className={`p-3 border-2 rounded-lg text-center transition-colors ${formData.roomNumber === roomName ? 'border-satin-gold bg-satin-gold/10' : 'border-gray-300 hover:border-satin-gold/50'}`}>
                                                    <p className="font-bold text-sm">{roomName}</p>
                                                    <p className="text-xs text-charcoal/60">Block {room.block}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-charcoal/70 text-center py-8 bg-charcoal/5 rounded-md">No available rooms in this category.</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-serif text-lg mb-2">Additional Services</h4>
                            <div className="space-y-2">
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={formData.services.some(s => s.id === service.id)} onChange={() => handleServiceToggle(service)} className="h-5 w-5 rounded text-satin-gold focus:ring-satin-gold"/>
                                        <span className="ml-3 flex-grow text-sm">{service.name}</span>
                                        <span className="font-mono text-sm">{formatCurrency(service.price)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block font-serif text-lg mb-2">Guest Preferences</label>
                            <textarea value={formData.guestPreferences} onChange={e => setFormData({...formData, guestPreferences: e.target.value})} className="w-full p-2 border rounded-md h-24" placeholder="e.g., High floor, extra pillows..."/>
                        </div>
                    </div>
                );
            case 4:
                return (
                     <div className="space-y-4">
                        <h4 className="font-serif text-xl border-b pb-2">Booking Summary</h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-base">
                            <strong className="font-serif">Guest:</strong><span>{formData.guestName}</span>
                            <strong className="font-serif">Check-in:</strong><span>{formData.checkIn}</span>
                            <strong className="font-serif">Check-out:</strong><span>{formData.checkOut}</span>
                            <strong className="font-serif">Room:</strong><span>{formData.roomType} (Room {formData.roomNumber})</span>
                        </div>
                        <div className="border-t pt-4 mt-4 text-sm">
                            <div className="flex justify-between"><span>Room Total:</span> <span>{formatCurrency(formData.roomTotal)}</span></div>
                            {formData.services.map(s => <div key={s.id} className="flex justify-between text-xs"><span>{s.name}</span> <span>{formatCurrency(s.price)}</span></div>)}
                            <div className="flex justify-between font-bold pt-2 border-t mt-2"><span>Subtotal:</span> <span>{formatCurrency(formData.roomTotal + formData.services.reduce((acc, s) => acc + s.price, 0))}</span></div>
                            <div className="flex justify-between text-xs"><span>Taxes (10%):</span> <span>{formatCurrency((formData.roomTotal + formData.services.reduce((acc, s) => acc + s.price, 0)) * 0.10)}</span></div>
                            <div className="flex justify-between font-bold text-xl font-serif mt-2"><span>Grand Total:</span> <span>{formatCurrency(finalTotal)}</span></div>
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Payment Method</label>
                            <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})} className="w-full p-2 border rounded-md">
                                <option>Pending</option><option>Credit Card</option><option>Cash</option><option>Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Add New Booking - Step ${step} of 4: ${stepTitles[step-1]}`}>
            <div className="min-h-[300px]">
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                {renderStepContent()}
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div>
                    {step > 1 && <button onClick={handleBack} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Back</button>}
                </div>
                <div>
                    {step < 4 && <button onClick={handleNext} className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">Next</button>}
                    {step === 4 && <button onClick={handleSubmit} className="py-2 px-6 rounded-md bg-green-600 text-white hover:bg-green-700 font-bold">Confirm Booking</button>}
                </div>
            </div>
        </Modal>
    );
};

interface BookingManagementProps {
    user: User;
    bookings: Booking[];
    services: Service[];
    onCheckIn: (bookingId: string) => void;
    onCheckOut: (bookingId: string) => void;
    onCancelBooking: (bookingId: string, reason: string) => void;
    onSaveBooking: (updatedBooking: Booking, logMessage: string) => void;
    onCreateBooking: (bookingData: Omit<Booking, 'id' | 'auditLog' | 'status'> & { id?: string; guestEmail: string; guestPhone: string; }) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export const BookingManagement: React.FC<BookingManagementProps> = ({ 
    user, 
    bookings, 
    services,
    onCheckIn, 
    onCheckOut, 
    onCancelBooking,
    onSaveBooking, 
    onCreateBooking,
    selectedCurrency,
    exchangeRates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const formatCurrency = (amount: number) => {
    const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
    return formatCurrencyUtil(convertedAmount, selectedCurrency);
  };

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(booking => 
        statusFilter === 'all' || booking.status === statusFilter
      )
      .filter(booking => 
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [bookings, searchTerm, statusFilter]);
  
  const handlePrintReceipt = (booking: Booking) => {
    const grandTotal = calculateGrandTotal(booking);
    const tax = grandTotal * 0.10;
    const finalTotal = grandTotal + tax;
    
    let servicesHtml = booking.services.map(s => `
        <tr class="item">
            <td>${s.name}</td>
            <td class="text-right">${formatCurrency(s.price)}</td>
        </tr>
    `).join('');

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt for Booking ${booking.id}</title>
          <style>
            body { font-family: 'Lato', sans-serif; color: #2F4F4F; margin: 0; padding: 2rem; background: #fdfdfa; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; background: white; }
            h1 { font-family: 'Cormorant', serif; color: #CFB53B; text-align: center; margin-bottom: 0; }
            .header { text-align: center; margin-bottom: 2rem; }
            .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .invoice-box table td { padding: 5px; vertical-align: top; }
            .invoice-box table tr.top table td { padding-bottom: 20px; }
            .invoice-box table tr.information table td { padding-bottom: 40px; }
            .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .invoice-box table tr.details td { padding-bottom: 20px; }
            .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
            .invoice-box table tr.item.last td { border-bottom: none; }
            .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 3rem; font-size: 0.9rem; color: #777; }
          </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1>MIRONA</h1>
                    <p>Timeless Luxury & Elegance</p>
                </div>
                <table>
                    <tr class="top">
                        <td colspan="2">
                            <table>
                                <tr>
                                    <td>
                                        Booking ID: <strong>${booking.id}</strong><br>
                                        Date Issued: ${new Date().toLocaleDateString()}<br>
                                        Guest: ${booking.guestName}
                                    </td>
                                    <td class="text-right">
                                        Check-in: ${booking.checkIn}<br>
                                        Check-out: ${booking.checkOut}<br>
                                        Room Type: ${booking.roomType}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class="heading">
                        <td>Item</td>
                        <td class="text-right">Price</td>
                    </tr>
                    <tr class="item">
                        <td>Room Charge</td>
                        <td class="text-right">${formatCurrency(booking.roomTotal)}</td>
                    </tr>
                    ${servicesHtml}
                    <tr class="total">
                        <td></td>
                        <td class="text-right">Subtotal: ${formatCurrency(grandTotal)}</td>
                    </tr>
                     <tr class="item">
                        <td></td>
                        <td class="text-right">Taxes (10%): ${formatCurrency(tax)}</td>
                    </tr>
                    <tr class="total">
                        <td></td>
                        <td class="text-right"><strong>Grand Total: ${formatCurrency(finalTotal)}</strong></td>
                    </tr>
                    <tr>
                         <td colspan="2" style="padding-top: 20px;"><strong>Payment Method:</strong> ${booking.paymentMethod}</td>
                    </tr>
                </table>
                <div class="footer">
                    <p>Thank you for choosing Mirona Hotel. We hope to welcome you back soon.</p>
                </div>
            </div>
        </body>
      </html>
    `;
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

  const handleOpenModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal relative">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by Guest or ID..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Checked-out">Checked-out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {canPerformAction(user.role, 'create_booking') && (
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
                <PlusCircleIcon className="h-5 w-5" />
                Add Booking
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-charcoal/10 hidden md:table-header-group">
            <tr>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Booking ID</th>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Guest</th>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Dates</th>
              <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Room Type</th>
              <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Status</th>
              <th className="py-2 px-4 text-right font-bold uppercase tracking-wider text-sm">Total</th>
              <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="responsive-table">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                <td data-label="Booking ID:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap text-sm">
                   {booking.id}
                </td>
                <td data-label="Guest:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap font-bold text-sm">
                    {booking.guestName}
                </td>
                <td data-label="Dates:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap text-sm">
                    {booking.checkIn} to {booking.checkOut}
                </td>
                <td data-label="Room Type:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap text-sm">
                    {booking.roomType} <span className="text-xs text-charcoal/60">({booking.roomNumber})</span>
                </td>
                <td data-label="Status:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap md:text-center text-sm">
                    <StatusBadge status={booking.status} />
                </td>
                <td data-label="Total:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap font-bold md:text-right text-sm">
                    {formatCurrency(calculateGrandTotal(booking))}
                </td>
                <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell whitespace-nowrap md:text-center text-sm">
                    <div className="flex flex-col items-end md:flex-row md:justify-center md:items-center gap-2">
                       <button 
                         onClick={() => handleOpenModal(booking)}
                         className="bg-deep-navy text-white text-xs font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors w-full md:w-auto">
                        Details
                      </button>
                      {booking.status === 'Confirmed' && canPerformAction(user.role, 'check_in_out') && (
                        <button
                          onClick={() => onCheckIn(booking.id)}
                          className="bg-green-600 text-white text-xs font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors w-full md:w-auto"
                        >
                          Check-in
                        </button>
                      )}
                      {booking.status === 'Checked-in' && canPerformAction(user.role, 'check_in_out') && (
                        <button
                          onClick={() => onCheckOut(booking.id)}
                          className="bg-charcoal text-white text-xs font-bold py-2 px-4 rounded hover:bg-charcoal/80 transition-colors w-full md:w-auto"
                        >
                          Check-out
                        </button>
                      )}
                       {booking.status === 'Checked-out' && (
                        <button
                          onClick={() => handlePrintReceipt(booking)}
                          className="bg-satin-gold text-white text-xs font-bold py-2 px-4 rounded hover:bg-satin-gold/90 transition-colors w-full md:w-auto flex items-center justify-center gap-1"
                        >
                          <PrintIcon className="h-4 w-4" /> Receipt
                        </button>
                      )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {filteredBookings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-charcoal/70">No bookings match your criteria.</p>
          </div>
        )}
      </div>

      {selectedBooking && (
        <Modal 
          isOpen={isModalOpen} 
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

      {isAddModalOpen && (
        <AddBookingModal 
            onClose={() => setIsAddModalOpen(false)}
            onCreate={onCreateBooking}
            services={services}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
        />
      )}
    </div>
  );
};