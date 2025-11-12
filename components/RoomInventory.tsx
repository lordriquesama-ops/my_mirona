

import React, { useState, useMemo } from 'react';
// FIX: Add Currency and ExchangeRates to imports
import { RoomCategory, InventoryRoom, InventoryRoomStatus, UserRole, Currency, ExchangeRates } from '../types';
import { Modal } from './Modal';
import { BedIcon, CheckCircleIcon, WarningIcon, SettingsIcon } from './icons';
// FIX: Import currency utility functions
import { convertPrice, formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { canPerformAction } from '../utils/auth';


interface RoomsPageProps {
    userRole: UserRole;
    inventory: RoomCategory[];
    onUpdateStatus: (roomId: string, newStatus: InventoryRoomStatus) => void;
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

const RoomStatusUpdateModal: React.FC<{
    room: InventoryRoom;
    onClose: () => void;
    onSave: (roomId: string, newStatus: InventoryRoomStatus) => void;
}> = ({ room, onClose, onSave }) => {
    const [status, setStatus] = useState<InventoryRoomStatus>(room.status);
    const roomName = room.id.split('-').slice(1).join('-');
    
    const handleSave = () => {
        onSave(room.id, status);
    };

    return (
        <div className="space-y-4">
            <p>Update status for <strong className="font-serif text-lg">{roomName}</strong>:</p>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InventoryRoomStatus)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
            >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Dirty">Dirty</option>
                <option value="Maintenance">Maintenance</option>
            </select>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 transition-colors font-bold">
                    Cancel
                </button>
                <button onClick={handleSave} className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 transition-colors font-bold">
                    Save Status
                </button>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; color: string; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
    <div className={`bg-white rounded-lg shadow-lg p-4 flex items-center border-l-4 ${color}`}>
        <div className="p-3 bg-charcoal/10 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-charcoal/70 text-sm font-bold uppercase">{title}</p>
            <p className="font-serif text-3xl text-charcoal font-bold">{value}</p>
        </div>
    </div>
);

export const RoomsPage: React.FC<RoomsPageProps> = ({ userRole, inventory, onUpdateStatus, selectedCurrency, exchangeRates }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InventoryRoomStatus | 'all'>('all');
    const [selectedRoom, setSelectedRoom] = useState<InventoryRoom | null>(null);

    const allRooms = useMemo(() => inventory.flatMap(c => Object.values(c.inventory).flat()), [inventory]);
    
    const stats = useMemo(() => ({
        Available: allRooms.filter(r => r.status === 'Available').length,
        Occupied: allRooms.filter(r => r.status === 'Occupied').length,
        Dirty: allRooms.filter(r => r.status === 'Dirty').length,
        Maintenance: allRooms.filter(r => r.status === 'Maintenance').length,
    }), [allRooms]);
    
    const canUpdateStatus = canPerformAction(userRole, 'update_inventory_status');

    const handleRoomClick = (room: InventoryRoom) => {
        if (canUpdateStatus) {
            setSelectedRoom(room);
        }
    };
    
    const handleCloseModal = () => setSelectedRoom(null);

    const handleSaveStatus = (roomId: string, newStatus: InventoryRoomStatus) => {
        onUpdateStatus(roomId, newStatus);
        handleCloseModal();
    };

    const filteredInventory = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();

        const filterRoom = (room: InventoryRoom, categoryType: string): boolean => {
            const statusMatch = statusFilter === 'all' || room.status === statusFilter;
            if (!statusMatch) return false;

            if (lowercasedSearch === '') return true;

            const roomName = room.id.split('-').slice(1).join('-').toLowerCase();
            const typeName = categoryType.toLowerCase();
            const blockName = room.block.toLowerCase();

            return roomName.includes(lowercasedSearch) || typeName.includes(lowercasedSearch) || blockName.includes(lowercasedSearch);
        };

        return inventory.map(category => {
            const newInventory = {
                A: category.inventory.A.filter(room => filterRoom(room, category.type)),
                B: category.inventory.B.filter(room => filterRoom(room, category.type)),
                C: category.inventory.C.filter(room => filterRoom(room, category.type)),
                Single: category.inventory.Single.filter(room => filterRoom(room, category.type)),
            };
            return { ...category, inventory: newInventory };
        }).filter(category => {
            return Object.values(category.inventory).flat().length > 0;
        });
    }, [inventory, statusFilter, searchTerm]);
    
    const formatCurrency = (amount: number) => {
        const convertedAmount = convertPrice(amount, selectedCurrency, exchangeRates);
        return formatCurrencyUtil(convertedAmount, selectedCurrency);
    };

    const statusStyles: Record<InventoryRoomStatus, { border: string, text: string, bg: string }> = {
        Available: { border: 'border-green-500', text: 'text-green-800', bg: 'bg-green-50' },
        Occupied: { border: 'border-deep-navy', text: 'text-deep-navy', bg: 'bg-blue-50' },
        Dirty: { border: 'border-yellow-500', text: 'text-yellow-800', bg: 'bg-yellow-50' },
        Maintenance: { border: 'border-burgundy', text: 'text-burgundy', bg: 'bg-red-50' },
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 bg-white rounded-lg shadow-lg p-6 border-l-4 border-satin-gold">
                <h2 className="font-serif text-3xl text-charcoal">Room Management</h2>
                <p className="text-charcoal/70">Detailed overview of all hotel rooms, their status, and pricing.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Available" value={stats.Available} color="border-green-600" icon={<CheckCircleIcon className="h-6 w-6 text-green-600"/>} />
                <StatCard title="Occupied" value={stats.Occupied} color="border-deep-navy" icon={<BedIcon className="h-6 w-6 text-deep-navy"/>} />
                <StatCard title="Needs Cleaning" value={stats.Dirty} color="border-yellow-600" icon={<WarningIcon className="h-6 w-6 text-yellow-600"/>} />
                <StatCard title="Maintenance" value={stats.Maintenance} color="border-red-600" icon={<SettingsIcon className="h-6 w-6 text-red-600"/>} />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Search by Room, Type, or Block..."
                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                        <span className="font-bold text-sm text-charcoal mr-2">Status:</span>
                        {(['all', 'Available', 'Occupied', 'Dirty', 'Maintenance'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1 text-sm font-bold rounded-full transition-colors ${
                                    statusFilter === status
                                    ? 'bg-satin-gold text-white shadow-md'
                                    : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
                                }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {filteredInventory.map(category => (
                    <div key={category.type} className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <h3 className="font-serif text-2xl text-charcoal">{category.type}</h3>
                             <p className="font-mono text-lg font-bold text-satin-gold">{formatCurrency(category.price)}<span className="text-sm font-sans text-charcoal/60">/night</span></p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {Object.values(category.inventory).flat().map((room: InventoryRoom) => {
                                const roomName = room.id.split('-').slice(1).join('-');
                                const style = statusStyles[room.status];
                                return (
                                    <button
                                        key={room.id}
                                        onClick={() => handleRoomClick(room)}
                                        disabled={!canUpdateStatus}
                                        className={`p-3 rounded-lg text-left shadow border-l-4 transition-all duration-200 ease-in-out ${style.border} ${style.bg} disabled:cursor-not-allowed disabled:opacity-70 ${canUpdateStatus ? 'hover:shadow-lg hover:scale-105 transform' : ''}`}
                                        aria-label={`Update status for room ${roomName}`}
                                    >
                                        <p className="font-bold text-charcoal truncate" title={roomName}>{roomName}</p>
                                        <p className="text-xs text-charcoal/60">Block {room.block}</p>
                                        <div className={`mt-2 text-xs font-bold ${style.text}`}>{room.status}</div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {Object.values(category.inventory).flat().length === 0 && (
                            <p className="text-center py-4 text-charcoal/60">No rooms match the current filter in this category.</p>
                        )}
                    </div>
                ))}
                 {filteredInventory.length === 0 && (
                     <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <p className="text-charcoal/70">No rooms match the current filters.</p>
                    </div>
                )}
            </div>

            {selectedRoom && (
                <Modal isOpen={!!selectedRoom} onClose={handleCloseModal} title={`Update Room ${selectedRoom.id.split('-').slice(1).join('-')}`}>
                    <RoomStatusUpdateModal room={selectedRoom} onClose={handleCloseModal} onSave={handleSaveStatus} />
                </Modal>
            )}
        </div>
    );
};
