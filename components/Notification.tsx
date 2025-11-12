import React, { useEffect } from 'react';
import { XIcon, CheckCircleIcon } from './icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed top-24 right-4 md:right-8 lg:right-12 z-50 transform transition-transform animate-fade-in-down`}>
      <div className={`${bgColor} text-white font-bold rounded-lg shadow-2xl p-4 flex items-center`}>
        <CheckCircleIcon className="h-6 w-6 mr-3" />
        <p>{message}</p>
        <button onClick={onClose} className="ml-4 text-white/80 hover:text-white">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
       <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
