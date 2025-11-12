

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCard } from './components/KpiCard';
import { PerformanceChart } from './components/PerformanceChart';
import { ForecastChart } from './components/ForecastChart';
import { ExpenseChart } from './components/ExpenseChart';
import { DataTable } from './components/DataTable';
import { kpiData, performanceData, forecastData, expenseData, transactionData, bookingData, servicesData, hotelInfoData, inventoryData, customerData, usersData } from './constants';
import { BedIcon, DollarSignIcon, TrendingUpIcon, UsersIcon } from './components/icons';
import { LoginPage } from './components/LoginPage';
import { BookingManagement } from './components/BookingManagement';
import { User, Booking, AuditLogEntry, Service, Transaction, HotelInfo, RoomCategory, InventoryRoomStatus, Currency, ExchangeRates, BookingStatus, Customer, UserStatus } from './types';
import { AccessDenied } from './components/AccessDenied';
import { hasPermission } from './utils/auth';
import { CustomerManagement } from './components/CustomerManagement';
import { FinanceDashboard } from './components/FinanceDashboard';
import { SettingsPage } from './components/SettingsPage';
import { RoomsPage } from './components/RoomInventory';
import { FeedbackManagement } from './components/FeedbackManagement';
import { ReceptionistDashboard } from './components/ReceptionistDashboard';
import { Notification } from './components/Notification';
import { convertPrice } from './utils/currency';

type Page = 'dashboard' | 'bookings' | 'rooms' | 'customers' | 'feedback' | 'finance' | 'settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // State lifted to App component
  const [bookings, setBookings] = useState<Booking[]>(bookingData);
  const [services, setServices] = useState<Service[]>(servicesData);
  const [transactions, setTransactions] = useState<Transaction[]>(transactionData);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo>(hotelInfoData);
  const [roomInventory, setRoomInventory] = useState<RoomCategory[]>(inventoryData);
  const [customers, setCustomers] = useState<Customer[]>(customerData);
  const [users, setUsers] = useState<User[]>(usersData);

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('UGX');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    // In a real app, this would be an API call.
    // Base currency for all data in constants.ts is UGX.
    const mockRates: ExchangeRates = {
      'UGX': 1,
      'USD': 1 / 3850,
      'EUR': 0.92 / 3850,
      'GBP': 0.79 / 3850,
    };
    setExchangeRates(mockRates);
  }, []);

  const updateRoomStatusForBooking = (booking: Booking, newStatus: InventoryRoomStatus) => {
    if (!booking.roomNumber || !booking.roomType) return;

    setRoomInventory(prevInventory =>
        prevInventory.map(category => {
            if (category.type !== booking.roomType) {
                return category;
            }

            const updatedInventory = { ...category.inventory };
            let roomFound = false;

            for (const block of Object.keys(updatedInventory) as Array<keyof typeof updatedInventory>) {
                updatedInventory[block] = updatedInventory[block].map(room => {
                    const roomName = room.id.split('-').slice(1).join('-');
                    if (roomName === booking.roomNumber) {
                        roomFound = true;
                        return { ...room, status: newStatus };
                    }
                    return room;
                });
                if (roomFound) break; 
            }

            return { ...category, inventory: updatedInventory };
        })
    );
  };

  useEffect(() => {
    if (!user) return; // Only run when a user is logged in

    const runAutomaticStatusChecks = () => {
      const now = new Date();
      // A date representing the start of today for checkout comparison
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const checkedInGuests: string[] = [];
      const checkedOutGuests: string[] = [];
      const roomUpdates: { booking: Booking; newStatus: InventoryRoomStatus }[] = [];
      let updatesMade = false;
      
      const updatedBookings = bookings.map(booking => {
        let newBooking = { ...booking };
        
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);

        // Auto check-in: if status is 'Confirmed' and check-in date is today or in the past.
        if (newBooking.status === 'Confirmed' && checkInDate <= now) {
          updatesMade = true;
          checkedInGuests.push(newBooking.guestName);
          newBooking.status = 'Checked-in';
          newBooking.auditLog = [...newBooking.auditLog, createAuditLogEntry('Automatically checked-in as check-in date has passed.')];
          roomUpdates.push({ booking, newStatus: 'Occupied' });
        }

        // Auto check-out: if status is 'Checked-in' and check-out date is before the start of today.
        if (newBooking.status === 'Checked-in' && checkOutDate < startOfToday) {
          updatesMade = true;
          checkedOutGuests.push(newBooking.guestName);
          newBooking.status = 'Checked-out';
          newBooking.auditLog = [...newBooking.auditLog, createAuditLogEntry('Automatically checked-out as check-out date has passed.')];
          roomUpdates.push({ booking, newStatus: 'Dirty' });
        }
        
        return newBooking;
      });

      if (updatesMade) {
        setBookings(updatedBookings);
        roomUpdates.forEach(update => updateRoomStatusForBooking(update.booking, update.newStatus));
        
        const messages: string[] = [];
        if (checkedInGuests.length > 0) {
            messages.push(`auto-checked in ${checkedInGuests.length} guest(s)`);
        }
        if (checkedOutGuests.length > 0) {
            messages.push(`auto-checked out ${checkedOutGuests.length} guest(s)`);
        }
        
        if (messages.length > 0) {
            showNotification(`System: ${messages.join(' and ')}.`, 'success');
        }
      }
    };

    // Run once on login and then set up an interval to check every minute
    runAutomaticStatusChecks();
    const intervalId = setInterval(runAutomaticStatusChecks, 60000); 

    // Cleanup interval on component unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [user, bookings]);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const createAuditLogEntry = (action: string): AuditLogEntry => {
    return {
        timestamp: new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
        user: user?.name || 'System',
        action: action,
    };
  };

  const updateBookingWithLog = (bookingId: string, updates: Partial<Booking>, logMessage: string) => {
      setBookings(prev => prev.map(b => {
          if (b.id === bookingId) {
              return {
                  ...b,
                  ...updates,
                  auditLog: [...b.auditLog, createAuditLogEntry(logMessage)]
              }
          }
          return b;
      }));
  };

  const handleCheckIn = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'Confirmed') {
        updateBookingWithLog(bookingId, { status: 'Checked-in' }, 'Guest checked-in.');
        updateRoomStatusForBooking(booking, 'Occupied');
        showNotification(`Guest ${booking.guestName} checked in successfully.`);
    }
  };

  const handleCheckOut = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'Checked-in') {
        updateBookingWithLog(bookingId, { status: 'Checked-out' }, 'Guest checked-out.');
        updateRoomStatusForBooking(booking, 'Dirty');
        showNotification(`Guest ${booking.guestName} checked out successfully.`);
    }
  };

  const handleCancelBooking = (bookingId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        if (booking.status === 'Confirmed') {
          updateRoomStatusForBooking(booking, 'Available');
        } else if (booking.status === 'Checked-in') {
          updateRoomStatusForBooking(booking, 'Dirty');
        }
        
        updateBookingWithLog(bookingId, { status: 'Cancelled' }, `Booking cancelled. Reason: ${reason}`);
        showNotification(`Booking for ${booking.guestName} has been cancelled.`, 'error');

        // Update customer total spent
        if (booking.status !== 'Cancelled') { // Only deduct if it wasn't already cancelled
            const customer = customers.find(c => c.name.toLowerCase() === booking.guestName.toLowerCase());
            if (customer) {
                const servicesTotal = booking.services.reduce((acc, s) => acc + s.price, 0);
                const subTotal = booking.roomTotal + servicesTotal;
                const tax = subTotal * 0.10;
                const grandTotal = subTotal + tax;

                const updatedCustomer = {
                    ...customer,
                    totalSpent: Math.max(0, customer.totalSpent - grandTotal),
                };
                setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
            }
        }
    }
  };
  
  const handleSaveBooking = (updatedBooking: Booking, logMessage: string) => {
    updateBookingWithLog(updatedBooking.id, updatedBooking, logMessage);
    showNotification('Booking details updated successfully.');
  };
  
  const handleCreateBooking = (bookingDetails: Omit<Booking, 'id' | 'auditLog' | 'status'> & { id?: string; guestEmail: string; guestPhone: string; }) => {
    const { id, guestEmail, guestPhone, ...restDetails } = bookingDetails;
    
    const trimmedId = id?.trim().toUpperCase();
    if (trimmedId && bookings.some(b => b.id.toUpperCase() === trimmedId)) {
        showNotification(`Booking ID "${trimmedId}" already exists. Please use a different one.`, 'error');
        return;
    }

    const newBooking: Booking = {
        id: trimmedId || `BK${Date.now()}`,
        status: 'Confirmed',
        auditLog: [createAuditLogEntry('Booking created.')],
        ...restDetails
    };

    setBookings(prev => [newBooking, ...prev]);
    showNotification(`Booking for ${newBooking.guestName} created successfully.`);
    
    // Update customer database
    const servicesTotal = newBooking.services.reduce((acc, s) => acc + s.price, 0);
    const subTotal = newBooking.roomTotal + servicesTotal;
    const tax = subTotal * 0.10;
    const grandTotal = subTotal + tax;
    
    const existingCustomer = customers.find(c => c.name.toLowerCase() === newBooking.guestName.toLowerCase());

    if (existingCustomer) {
        const updatedCustomer = {
            ...existingCustomer,
            totalBookings: existingCustomer.totalBookings + 1,
            totalSpent: existingCustomer.totalSpent + grandTotal,
        };
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    } else {
        const newCustomer: Customer = {
            id: `C${Date.now()}`,
            name: newBooking.guestName,
            email: guestEmail,
            phone: guestPhone,
            totalBookings: 1,
            totalSpent: grandTotal,
            joinDate: new Date().toISOString().split('T')[0],
        };
        setCustomers(prev => [...prev, newCustomer]);
    }
  };

  const handleCreateService = (service: Omit<Service, 'id'>) => {
    const newService: Service = { id: `SVC${Date.now()}`, ...service };
    setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
    showNotification(`Service "${newService.name}" created successfully.`);
  };

  const handleUpdateService = (updatedService: Service) => {
      setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
      showNotification(`Service "${updatedService.name}" updated successfully.`);
  };
  
  const handleDeleteService = (serviceId: string) => {
      const serviceName = services.find(s => s.id === serviceId)?.name || 'Service';
      setServices(prev => prev.filter(s => s.id !== serviceId));
      showNotification(`"${serviceName}" has been deleted.`, 'error');
  };

  const handleCreateExpense = (expense: Omit<Transaction, 'id' | 'type'>) => {
      const newExpense: Transaction = {
          id: `TXN${Date.now()}`,
          ...expense,
          amount: -Math.abs(expense.amount),
          type: 'Expense'
      };
      setTransactions(prev => [newExpense, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      showNotification(`Expense "${newExpense.description}" added successfully.`);
  };

  const handleUpdateExpense = (updatedExpense: Transaction) => {
      setTransactions(prev => prev.map(t => t.id === updatedExpense.id ? { ...updatedExpense, amount: -Math.abs(updatedExpense.amount), type: 'Expense' } : t));
      showNotification(`Expense "${updatedExpense.description}" updated successfully.`);
  };

  const handleDeleteExpense = (transactionId: string) => {
      const expenseDescription = transactions.find(t => t.id === transactionId)?.description || 'Expense';
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      showNotification(`"${expenseDescription}" has been deleted.`, 'error');
  };

  const handleUpdateInventoryStatus = (roomId: string, newStatus: InventoryRoomStatus) => {
    setRoomInventory(prevInventory =>
        prevInventory.map(category => ({
            ...category,
            inventory: {
                A: category.inventory.A.map(r => r.id === roomId ? { ...r, status: newStatus } : r),
                B: category.inventory.B.map(r => r.id === roomId ? { ...r, status: newStatus } : r),
                C: category.inventory.C.map(r => r.id === roomId ? { ...r, status: newStatus } : r),
                Single: category.inventory.Single.map(r => r.id === roomId ? { ...r, status: newStatus } : r),
            },
        }))
    );
    showNotification(`Room status updated successfully.`);
  };
  
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    showNotification(`Customer ${updatedCustomer.name} updated successfully.`);
  };
  
  const handleUpdateRoomPrices = (updates: { type: RoomCategory['type'], price: number }[]) => {
    const updatedPricesMap = new Map(updates.map(u => [u.type, u.price]));
    setRoomInventory(prevInventory => prevInventory.map(category => {
      if (updatedPricesMap.has(category.type)) {
        return { ...category, price: updatedPricesMap.get(category.type)! };
      }
      return category;
    }));
    showNotification(`Base prices for room categories updated successfully.`);
  };

  const handleCreateUser = (newUser: Omit<User, 'id' | 'status'>) => {
    const userWithId: User = { ...newUser, id: Date.now(), status: 'active' };
    setUsers(prev => [...prev, userWithId]);
    showNotification(`User "${newUser.name}" created successfully.`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    showNotification(`User "${updatedUser.name}" updated successfully.`);
  };

  const handleUpdateUserStatus = (userId: number, newStatus: UserStatus) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    showNotification(`${userToUpdate.name}'s status has been changed to ${newStatus}.`, newStatus === 'active' ? 'success' : 'error');
  };


  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };
  
  const handleLogout = () => {
    setUser(null);
  }

  const handleUpdateHotelInfo = (newInfo: HotelInfo) => {
    setHotelInfo(newInfo);
    showNotification('Hotel information updated successfully.');
  };
  
  const convertedPerformanceData = useMemo(() => {
    if (!exchangeRates) return performanceData;
    return performanceData.map(metric => ({
      ...metric,
      ADR: convertPrice(metric.ADR, selectedCurrency, exchangeRates),
      RevPAR: convertPrice(metric.RevPAR, selectedCurrency, exchangeRates),
    }));
  }, [selectedCurrency, exchangeRates]);

  const convertedForecastData = useMemo(() => {
    if (!exchangeRates) return forecastData;
    return forecastData.map(point => ({
      ...point,
      Revenue: convertPrice(point.Revenue, selectedCurrency, exchangeRates),
      Profit: convertPrice(point.Profit, selectedCurrency, exchangeRates),
    }));
  }, [selectedCurrency, exchangeRates]);

  const convertedTransactions = useMemo(() => {
    if (!exchangeRates) return transactions;
    return transactions.map(t => ({
      ...t,
      amount: convertPrice(t.amount, selectedCurrency, exchangeRates),
    }));
  }, [transactions, selectedCurrency, exchangeRates]);


  const renderPage = () => {
    if (!user || !exchangeRates) return null;

    if (!hasPermission(user.role, currentPage)) {
      return <AccessDenied />;
    }

    switch (currentPage) {
      case 'dashboard':
        if (user.role === 'receptionist' || user.role === 'viewer') {
          return <ReceptionistDashboard 
            user={user}
            onNavigate={handleNavigation}
            bookings={bookings}
            services={services}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onSaveBooking={handleSaveBooking}
            onCancelBooking={handleCancelBooking}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
           />;
        }
        return (
          <>
            {/* Welcome Header */}
            <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-satin-gold">
              <h2 className="font-serif text-3xl text-charcoal">Welcome back, {user.name}!</h2>
              <p className="text-charcoal/70">Here's your real-time performance overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard 
                title={kpiData.revenue.title} 
                value={kpiData.revenue.value} 
                change={kpiData.revenue.change}
                icon={<DollarSignIcon className="h-8 w-8 text-satin-gold/80" />}
                formatAs={kpiData.revenue.formatAs}
                selectedCurrency={selectedCurrency}
                exchangeRates={exchangeRates}
              />
              <KpiCard 
                title={kpiData.occupancy.title} 
                value={kpiData.occupancy.value}
                change={kpiData.occupancy.change}
                icon={<BedIcon className="h-8 w-8 text-satin-gold/80" />}
                formatAs={kpiData.occupancy.formatAs}
                selectedCurrency={selectedCurrency}
                exchangeRates={exchangeRates}
              />
              <KpiCard 
                title={kpiData.revPAR.title} 
                value={kpiData.revPAR.value} 
                change={kpiData.revPAR.change}
                icon={<TrendingUpIcon className="h-8 w-8 text-satin-gold/80" />}
                formatAs={kpiData.revPAR.formatAs}
                selectedCurrency={selectedCurrency}
                exchangeRates={exchangeRates}
              />
              <KpiCard 
                title={kpiData.checkIns.title} 
                value={bookings.filter(b => b.status === 'Confirmed').length} 
                change={kpiData.checkIns.change}
                icon={<UsersIcon className="h-8 w-8 text-satin-gold/80" />}
                changeIsPositive={false}
                selectedCurrency={selectedCurrency}
                exchangeRates={exchangeRates}
              />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                 <h3 className="font-serif text-2xl text-charcoal mb-4">Performance Metrics</h3>
                <PerformanceChart data={convertedPerformanceData} selectedCurrency={selectedCurrency} />
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h3 className="font-serif text-2xl text-charcoal mb-4">Expense Breakdown</h3>
                <ExpenseChart data={expenseData} />
              </div>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
               <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h3 className="font-serif text-2xl text-charcoal mb-4">Revenue & Profit Forecast</h3>
                <ForecastChart data={convertedForecastData} selectedCurrency={selectedCurrency} />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="font-serif text-2xl text-charcoal mb-4">Recent Transactions</h3>
              <DataTable data={transactions} selectedCurrency={selectedCurrency} exchangeRates={exchangeRates} />
            </div>
          </>
        );
      case 'bookings':
        return <BookingManagement 
            user={user} 
            bookings={bookings}
            services={services}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onCancelBooking={handleCancelBooking}
            onSaveBooking={handleSaveBooking}
            onCreateBooking={handleCreateBooking}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
        />;
      case 'rooms':
        return <RoomsPage 
            userRole={user.role} 
            inventory={roomInventory}
            onUpdateStatus={handleUpdateInventoryStatus}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
        />;
      case 'customers':
        return <CustomerManagement 
            userRole={user.role} 
            customers={customers}
            onSaveCustomer={handleUpdateCustomer}
            selectedCurrency={selectedCurrency} 
            exchangeRates={exchangeRates} 
        />;
      case 'feedback':
        return <FeedbackManagement userRole={user.role} />;
      case 'finance':
        return <FinanceDashboard 
          userRole={user.role}
          transactions={transactions}
          bookings={bookings}
          services={services}
          inventory={roomInventory}
          customers={customers}
          selectedCurrency={selectedCurrency} 
          exchangeRates={exchangeRates} 
        />;
      case 'settings':
        return <SettingsPage
            user={user}
            hotelInfo={hotelInfo}
            onUpdateHotelInfo={handleUpdateHotelInfo}
            services={services}
            transactions={transactions}
            onCreateService={handleCreateService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onCreateExpense={handleCreateExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            selectedCurrency={selectedCurrency}
            exchangeRates={exchangeRates}
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onUpdateUserStatus={handleUpdateUserStatus}
            roomCategories={roomInventory}
            onUpdateRoomPrices={handleUpdateRoomPrices}
        />;
      default:
        return <div className="text-charcoal font-serif text-3xl">Page coming soon...</div>;
    }
  };

  const getPageTitle = () => {
    if (currentPage === 'rooms') return 'Rooms';
    if (currentPage === 'feedback') return 'Feedback Management';
    const title = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
    return title.replace(/([A-Z])/g, ' $1').trim();
  }
  
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on navigation
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }
  
  if (!exchangeRates) {
    return (
        <div className="flex items-center justify-center h-screen bg-charcoal text-ivory font-serif text-2xl">
            Loading exchange rates...
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-charcoal text-ivory">
      <Sidebar 
        hotelInfo={hotelInfo}
        userRole={user.role}
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          userName={user.name} 
          title={getPageTitle()}
          onMenuClick={() => setIsSidebarOpen(true)}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-ivory p-4 md:p-6 lg:p-8">
            {notification && (
                <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
                />
            )}
          <div className="container mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
