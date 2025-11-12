import React from 'react';
import { LockIcon } from './icons';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-lg shadow-lg">
      <LockIcon className="h-24 w-24 text-satin-gold mb-6" />
      <h2 className="font-serif text-4xl text-charcoal mb-2">Access Denied</h2>
      <p className="text-charcoal/70 max-w-md">
        You do not have the necessary permissions to view this page. Please contact your administrator if you believe this is an error.
      </p>
    </div>
  );
};
