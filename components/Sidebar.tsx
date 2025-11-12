import React from 'react';
import { AnalyticsIcon, BedIcon, DollarSignIcon, UsersIcon, SettingsIcon, XIcon, LogOutIcon, KeyIcon, ClipboardListIcon, MessageSquareIcon } from './icons';
import { UserRole, HotelInfo } from '../types';
import { hasPermission } from '../utils/auth';

type Page = 'dashboard' | 'bookings' | 'rooms' | 'customers' | 'feedback' | 'finance' | 'settings';

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, page, currentPage, onNavigate }) => (
  <button
    onClick={() => onNavigate(page)}
    className={`flex items-center p-3 text-base transition-colors duration-300 w-full text-left ${
      currentPage === page
        ? 'bg-black/20 text-satin-gold border-r-4 border-satin-gold'
        : 'text-ivory/70 hover:bg-black/10 hover:text-ivory'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

interface SidebarProps {
  hotelInfo: HotelInfo;
  userRole: UserRole;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ hotelInfo, userRole, currentPage, onNavigate, isOpen, onClose, onLogout }) => {
  const navLinks: { page: Page, label: string, icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <AnalyticsIcon className="h-6 w-6" /> },
    { page: 'bookings', label: 'Bookings', icon: <BedIcon className="h-6 w-6" /> },
    { page: 'rooms', label: 'Rooms', icon: <ClipboardListIcon className="h-6 w-6" /> },
    { page: 'customers', label: 'Customers', icon: <UsersIcon className="h-6 w-6" /> },
    { page: 'feedback', label: 'Feedback', icon: <MessageSquareIcon className="h-6 w-6" /> },
    { page: 'finance', label: 'Finance', icon: <DollarSignIcon className="h-6 w-6" /> },
    { page: 'settings', label: 'Settings', icon: <SettingsIcon className="h-6 w-6" /> },
  ];

  return (
    <div className={`fixed lg:static inset-y-0 left-0 flex flex-col w-60 bg-charcoal shadow-2xl z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
      <div className="flex items-center justify-center h-20 border-b border-ivory/10 px-4 relative">
        {hotelInfo.logoUrl ? (
            <img src={hotelInfo.logoUrl} alt={`${hotelInfo.name} Logo`} className="h-12 max-w-full object-contain" />
        ) : (
            <h1 className="font-serif text-3xl text-satin-gold tracking-wider">{hotelInfo.name.toUpperCase()}</h1>
        )}
        <button onClick={onClose} className="lg:hidden text-ivory/70 hover:text-ivory absolute right-4 top-1/2 -translate-y-1/2">
          <XIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 mt-6">
        {navLinks.filter(link => hasPermission(userRole, link.page)).map(link => (
          <NavLink 
            key={link.page}
            icon={link.icon} 
            label={link.label} 
            page={link.page} 
            currentPage={currentPage} 
            onNavigate={onNavigate} 
          />
        ))}
      </nav>
      <div className="p-4 border-t border-ivory/10">
         <button
          onClick={onLogout}
          className="flex items-center p-3 text-base transition-colors duration-300 w-full text-left text-ivory/70 hover:bg-black/10 hover:text-ivory"
        >
          <LogOutIcon className="h-6 w-6" />
          <span className="ml-4">Logout</span>
        </button>
        <p className="text-center text-ivory/50 text-xs mt-3">&copy; 2024 Mirona Hotel</p>
      </div>
    </div>
  );
};