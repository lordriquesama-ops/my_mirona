import React, { useState } from 'react';
import { User } from '../types';
import { usersData } from '../constants';
import { MailIcon, LockIcon } from './icons';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
        setError('Please enter both email and password.');
        return;
    }

    const user = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
        setError('Invalid email or password.');
        return;
    }

    if (user.status !== 'active') {
        setError('This user account is not active. Please contact an administrator.');
        return;
    }
    
    onLogin(user);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-charcoal font-sans p-4">
      <div className="w-full max-w-md p-6 space-y-6 sm:p-8 sm:space-y-8 bg-ivory/90 rounded-lg shadow-2xl">
        <div className="text-center">
          <h1 className="font-serif text-4xl sm:text-5xl text-satin-gold tracking-wider">MIRONA</h1>
          <p className="mt-2 text-charcoal/80">Admin Dashboard Login</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 text-charcoal bg-white focus:outline-none focus:ring-satin-gold focus:border-satin-gold focus:z-10 sm:text-sm rounded-md"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
             <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 text-charcoal bg-white focus:outline-none focus:ring-satin-gold focus:border-satin-gold focus:z-10 sm:text-sm rounded-md"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-ivory bg-satin-gold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-satin-gold transition-colors duration-300"
            >
              Sign In
            </button>
          </div>
           <div className="text-center text-xs text-charcoal/60">
              <p>Demo Admin: admin@mironahotel.com / adminpass</p>
            </div>
        </form>
      </div>
    </div>
  );
};
