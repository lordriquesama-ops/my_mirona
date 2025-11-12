import React from 'react';
import { MenuIcon } from './icons';
import { Currency } from '../types';

interface HeaderProps {
  userName: string;
  title: string;
  onMenuClick: () => void;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, title, onMenuClick, selectedCurrency, onCurrencyChange }) => {
  const currencies: Currency[] = ['UGX', 'USD', 'EUR', 'GBP'];

  return (
    <header className="bg-white text-charcoal shadow-md px-6 md:px-8 lg:px-12 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
            <button onClick={onMenuClick} className="lg:hidden text-charcoal mr-4">
                <MenuIcon className="h-6 w-6" />
            </button>
            <h2 className="font-serif text-xl md:text-2xl font-bold">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <select
                value={selectedCurrency}
                onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                className="appearance-none bg-charcoal/5 font-bold text-charcoal py-2 pl-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold text-sm"
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-charcoal">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
          </div>
          <span className="hidden md:inline font-bold text-sm">{userName}</span>
          <img
            className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover border-2 border-satin-gold"
            src="https://picsum.photos/100"
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
};
