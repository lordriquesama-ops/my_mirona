import React, { useState, useMemo } from 'react';
import { roomData, roomTypeImages } from '../constants';
import { Room, RoomStatus, UserRole } from '../types';
import { Modal } from './Modal';
import { Notification } from './Notification';
import { EditIcon, TrashIcon, WarningIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from './icons';

const StatusBadge: React.FC<{ status: RoomStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-bold rounded-full text-white uppercase tracking-wider";
  const statusColors: Record<RoomStatus, string> = {
    'Clean': 'bg-green-600',
    'Occupied': 'bg-deep-navy',
    'Dirty': 'bg-yellow-600',
    'Maintenance': 'bg-red-600',
  };
  return <span className={`${baseClasses} ${statusColors[status]}`}>{status}</span>;
};

interface RoomManagementProps {
    userRole: UserRole;
}

type SortKey = 'roomNumber' | 'roomType' | 'price';
type SortDirection = 'asc' | 'desc';


const AddRoomForm: React.FC<{ 
    onAdd: (room: Omit<Room, 'id'>) => void; 
    onCancel: () => void;
    roomTypesWithPrices: { type: Room['roomType'], price: number }[];
}> = ({ onAdd, onCancel, roomTypesWithPrices }) => {
    const [formData, setFormData] = useState<Omit<Room, 'id' | 'price'>>({
        roomNumber: '',
        roomType: 'Standard Queen',
        status: 'Clean'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = roomTypesWithPrices.find(rt => rt.type === formData.roomType)?.price || 0;
        if (!formData.roomNumber) {
            alert('Please fill in a valid room number.');
            return;
        }
        onAdd({ ...formData, price });
    }

    return (
        <div className="bg-charcoal/5 p-6 rounded-lg mb-6 border border-satin-gold/20 animate-fade-in-down">
            <h3 className="font-serif text-2xl text-charcoal mb-4">Add New Room</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Room Number</label>
                    <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full p-2 border rounded-md" required/>
                </div>
                <div className="lg:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Room Type</label>
                    <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full p-2 border rounded-md">
                        <option>Standard Queen</option>
                        <option>Deluxe King</option>
                        <option>Junior Suite</option>
                        <option>Grand Suite</option>
                    </select>
                </div>
                 <div className="lg:col-span-1">
                    <label className="block font-bold mb-1 text-sm">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
                        <option>Clean</option>
                        <option>Dirty</option>
                        <option>Occupied</option>
                        <option>Maintenance</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 lg:col-span-1">
                    <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold text-sm w-full md:w-auto">Cancel</button>
                    <button type="submit" className="py-2 px-4 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold text-sm w-full md:w-auto">Save Room</button>
                </div>
            </form>
        </div>
    )
}

const RoomCard: React.FC<{
    room: Room;
    userRole: UserRole;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onStatusUpdate: (roomId: string, newStatus: RoomStatus) => void;
}> = ({ room, userRole, onEdit, onDelete, onStatusUpdate }) => {
    
    const can = (action: 'edit' | 'delete' | 'update_status') => {
        if (userRole === 'admin') return true;
        if (userRole === 'manager') return action === 'update_status';
        return false;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col transition-transform transform hover:-translate-y-1">
            <div className="relative">
                <img src={roomTypeImages[room.roomType]} alt={room.roomType} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2">
                    {can('update_status') && !can('edit') ? (
                        <select 
                            value={room.status} 
                            onChange={(e) => onStatusUpdate(room.id, e.target.value as RoomStatus)}
                            className="text-xs font-bold rounded-full text-white uppercase tracking-wider border-0 focus:ring-0"
                            style={{
                                backgroundColor: {
                                    'Clean': '#16a34a', 'Occupied': '#000080', 'Dirty': '#ca8a04', 'Maintenance': '#dc2626'
                                }[room.status],
                                appearance: 'none',
                                padding: '0.25rem 0.75rem',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="Clean">Clean</option>
                            <option value="Dirty">Dirty</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    ) : (
                        <StatusBadge status={room.status} />
                    )}
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <p className="text-sm text-charcoal/60">{room.roomType}</p>
                <h3 className="font-serif text-2xl text-charcoal font-bold">Room {room.roomNumber}</h3>
                <div className="flex-grow"></div>
                <div className="flex justify-between items-center mt-4">
                    <p className="text-xl font-bold text-satin-gold font-mono">
                        {formatCurrency(room.price)}
                        <span className="text-sm font-sans text-charcoal/60">/night</span>
                    </p>
                    <div className="flex items-center gap-2">
                         {can('edit') && (
                            <button onClick={() => onEdit(room)} className="text-deep-navy hover:text-deep-navy/70 p-1"><EditIcon className="h-5 w-5"/></button>
                        )}
                        {can('delete') && (
                            <button onClick={() => onDelete(room)} className="text-red-600 hover:text-red-400 p-1"><TrashIcon className="h-5 w-5"/></button>
                        )}
                        {userRole === 'receptionist' && <span className="text-xs text-charcoal/50 italic">View Only</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const RoomManagement: React.FC<RoomManagementProps> = ({ userRole }) => {
  const [rooms, setRooms] = useState<Room[]>(roomData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'roomNumber', direction: 'asc' });

  const roomTypesWithPrices = useMemo(() => {
    const types = new Map<Room['roomType'], number>();
    rooms.forEach(room => {
        if (!types.has(room.roomType)) {
            types.set(room.roomType, room.price);
        }
    });
    return Array.from(types.entries()).map(([type, price]) => ({ type, price }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => 
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rooms, searchTerm]);

  const sortedRooms = useMemo(() => {
    let sortableItems = [...filteredRooms];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
  
        if (sortConfig.key === 'roomNumber') {
          aValue = parseInt(a.roomNumber, 10);
          bValue = parseInt(b.roomNumber, 10);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
  
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRooms, sortConfig]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };
  
  const handleOpenEditModal = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };
  
  const handleOpenDeleteModal = (room: Room) => {
    setSelectedRoom(room);
    setDeleteConfirmationInput('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRoom(null);
  };
  
  const handleAddRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = { id: `R${Date.now()}`, ...roomData };
    setRooms(prev => [newRoom, ...prev]);
    showNotification(`Room ${newRoom.roomNumber} added successfully.`);
    setIsAddFormVisible(false);
  };
  
  const handleUpdateRoom = (roomToUpdate: Room) => {
    setRooms(rooms.map(r => r.id === roomToUpdate.id ? roomToUpdate : r));
    showNotification(`Room ${roomToUpdate.roomNumber} updated successfully.`);
    handleCloseModal();
  };
  
  const handleDeleteRoom = () => {
    if (!selectedRoom || deleteConfirmationInput !== selectedRoom.roomNumber) return;
    setRooms(rooms.filter(r => r.id !== selectedRoom.id));
    showNotification(`Room ${selectedRoom.roomNumber} has been deleted.`, 'error');
    handleCloseDeleteModal();
  };
  
  const handleStatusUpdate = (roomId: string, newStatus: RoomStatus) => {
      setRooms(rooms.map(r => r.id === roomId ? {...r, status: newStatus} : r));
      showNotification(`Room status updated to ${newStatus}.`);
  };

  const handleUpdateRoomTypePrices = (updates: { type: Room['roomType'], price: number }[]) => {
    const updatedPricesMap = new Map(updates.map(u => [u.type, u.price]));
    setRooms(prevRooms => prevRooms.map(room => {
        if (updatedPricesMap.has(room.roomType)) {
            return { ...room, price: updatedPricesMap.get(room.roomType)! };
        }
        return room;
    }));
    showNotification(`Base prices for ${updates.length} room type(s) updated successfully.`);
    setIsPriceModalOpen(false);
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDownIcon className="h-4 w-4 text-charcoal/40" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUpIcon className="h-4 w-4" />;
    }
    return <ArrowDownIcon className="h-4 w-4" />;
  };

  const can = (action: 'create') => {
      return userRole === 'admin';
  }

  return (
    <div className="space-y-6">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-charcoal">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <input
            type="text"
            placeholder="Search by Room Number or Type..."
            className="w-full md:w-1/3 pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {can('create') && (
                    <button onClick={() => setIsAddFormVisible(prev => !prev)} className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors">
                        {isAddFormVisible ? 'Cancel Adding' : 'Add New Room'}
                    </button>
                )}
                {userRole === 'admin' && (
                     <button onClick={() => setIsPriceModalOpen(true)} className="py-2 px-4 bg-deep-navy text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                        <EditIcon className="h-4 w-4" />
                        Manage Prices
                    </button>
                )}
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-charcoal/10 pt-4">
            <span className="font-bold text-sm text-charcoal/80 mr-2">Sort by:</span>
            <button
                onClick={() => requestSort('roomNumber')}
                className={`flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full transition-colors ${sortConfig?.key === 'roomNumber' ? 'bg-satin-gold text-white' : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'}`}
            >
                Room Number {getSortIndicator('roomNumber')}
            </button>
            <button
                onClick={() => requestSort('roomType')}
                className={`flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full transition-colors ${sortConfig?.key === 'roomType' ? 'bg-satin-gold text-white' : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'}`}
            >
                Room Type {getSortIndicator('roomType')}
            </button>
            <button
                onClick={() => requestSort('price')}
                className={`flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full transition-colors ${sortConfig?.key === 'price' ? 'bg-satin-gold text-white' : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'}`}
            >
                Price {getSortIndicator('price')}
            </button>
        </div>
      </div>

      {isAddFormVisible && <AddRoomForm onAdd={handleAddRoom} onCancel={() => setIsAddFormVisible(false)} roomTypesWithPrices={roomTypesWithPrices} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedRooms.map((room) => (
            <RoomCard
                key={room.id}
                room={room}
                userRole={userRole}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onStatusUpdate={handleStatusUpdate}
            />
        ))}
      </div>
      {sortedRooms.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-lg">
            <p className="text-charcoal/70">No rooms match your search criteria.</p>
          </div>
        )}

      {isModalOpen && selectedRoom && <RoomFormModal room={selectedRoom} onSave={handleUpdateRoom} onClose={handleCloseModal} roomTypesWithPrices={roomTypesWithPrices} />}
      
      {isPriceModalOpen && <RoomTypePriceModal roomTypes={roomTypesWithPrices} onSave={handleUpdateRoomTypePrices} onClose={() => setIsPriceModalOpen(false)} />}
      
      {isDeleteModalOpen && selectedRoom && (
        <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Confirm Room Deletion">
             <div className="text-center flex flex-col items-center">
                <WarningIcon className="h-16 w-16 text-burgundy mb-4" />
                <p className="text-xl mb-2">
                    Permanently Delete <strong className="font-serif font-bold">Room {selectedRoom.roomNumber}</strong>?
                </p>
                <p className="text-charcoal/70 max-w-md mx-auto">
                    This action is irreversible. To confirm deletion, please type the room number{' '}
                    <strong className="font-mono bg-charcoal/10 px-2 py-1 rounded">{selectedRoom.roomNumber}</strong> below.
                </p>
                <div className="mt-6 w-full max-w-xs mx-auto">
                    <label htmlFor="delete-confirm" className="sr-only">Type room number to confirm</label>
                    <input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-center font-mono text-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy"
                        placeholder={selectedRoom.roomNumber}
                        autoFocus
                    />
                </div>
                <div className="flex justify-center gap-4 mt-8 w-full">
                    <button 
                        onClick={handleCloseDeleteModal} 
                        className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold w-1/2"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDeleteRoom} 
                        disabled={deleteConfirmationInput !== selectedRoom.roomNumber}
                        className="py-2 px-6 rounded-md bg-burgundy text-white font-bold w-1/2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-burgundy/90"
                    >
                        Delete Room
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

const RoomFormModal: React.FC<{ 
    room: Room; 
    onSave: (room: Room) => void; 
    onClose: () => void;
    roomTypesWithPrices: { type: Room['roomType'], price: number }[];
}> = ({ room, onSave, onClose, roomTypesWithPrices }) => {
    const [formData, setFormData] = useState({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: room.status,
    });
    
    const currentPrice = useMemo(() => {
        return roomTypesWithPrices.find(rt => rt.type === formData.roomType)?.price || 0;
    }, [formData.roomType, roomTypesWithPrices]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: room.id, ...formData, price: currentPrice });
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={`Edit Room ${room.roomNumber}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-bold mb-1">Room Number</label>
                    <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full p-2 border rounded-md" required/>
                </div>
                <div>
                    <label className="block font-bold mb-1">Room Type</label>
                    <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full p-2 border rounded-md">
                        <option>Standard Queen</option>
                        <option>Deluxe King</option>
                        <option>Junior Suite</option>
                        <option>Grand Suite</option>
                    </select>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Price per Night</label>
                    <input 
                        type="text" 
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentPrice)} 
                        className="w-full p-2 border rounded-md bg-gray-100 text-charcoal/80" 
                        readOnly
                    />
                     <p className="text-sm text-charcoal/60 mt-1">Base price is set automatically based on Room Type.</p>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
                        <option>Clean</option>
                        <option>Dirty</option>
                        <option>Occupied</option>
                        <option>Maintenance</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                    <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">Save Changes</button>
                </div>
            </form>
        </Modal>
    )
}

const RoomTypePriceModal: React.FC<{
    roomTypes: { type: Room['roomType']; price: number }[];
    onClose: () => void;
    onSave: (updates: { type: Room['roomType'], price: number }[]) => void;
}> = ({ roomTypes, onClose, onSave }) => {
    const [prices, setPrices] = useState<Record<string, number>>(() =>
        roomTypes.reduce((acc, rt) => {
            acc[rt.type] = rt.price;
            return acc;
        }, {} as Record<string, number>)
    );

    const handlePriceChange = (roomType: string, value: string) => {
        setPrices(prev => ({ ...prev, [roomType]: Number(value) }));
    };

    const handleSave = () => {
        const updates = Object.entries(prices)
            .map(([type, price]) => ({ type: type as Room['roomType'], price }))
            .filter(update => {
                const original = roomTypes.find(rt => rt.type === update.type);
                return original && original.price !== update.price;
            });
        
        if (updates.length > 0) {
            onSave(updates);
        }
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Manage Room Base Prices">
            <div className="space-y-4">
                <p className="text-charcoal/70">Set the base price for each room type. This will update the price for all existing rooms in that category.</p>
                {Object.entries(prices).map(([type, price]) => (
                    <div key={type} className="flex justify-between items-center bg-charcoal/5 p-3 rounded-md">
                        <label htmlFor={`price-${type}`} className="font-bold text-charcoal">{type}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60">$</span>
                            <input
                                id={`price-${type}`}
                                type="number"
                                value={price}
                                onChange={e => handlePriceChange(type, e.target.value)}
                                className="w-32 p-2 pl-6 border rounded-md"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                <button type="button" onClick={handleSave} className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">Save Changes</button>
            </div>
        </Modal>
    );
};