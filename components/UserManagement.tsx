import React, { useState, useMemo } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Modal } from './Modal';
import { canPerformAction } from '../utils/auth';
import { PlusCircleIcon, EditIcon, TrashIcon, WarningIcon, EyeIcon, EyeOffIcon } from './icons';

interface UserManagementProps {
    user: User; // The currently logged-in user
    users: User[];
    onCreate: (user: Omit<User, 'id' | 'status'>) => void;
    onUpdate: (user: User) => void;
    onUpdateStatus: (userId: number, newStatus: UserStatus) => void;
}

const UserFormModal: React.FC<{
    user?: User | null;
    onSave: (user: User) => void;
    onCreate: (user: Omit<User, 'id'| 'status'>) => void;
    onClose: () => void;
}> = ({ user, onSave, onCreate, onClose }) => {
    const isEditing = !!user;
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || ('receptionist' as UserRole),
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && user) {
            const payload: any = { ...formData };
            if (!formData.password) {
                // If password field is blank, don't update it by deleting the property
                // so the parent update handler knows to keep the old one.
                delete payload.password;
            }
            onSave({ ...user, ...payload });
        } else {
            if (!formData.password) {
                alert("Password is required for new users.");
                return;
            }
            onCreate(formData as Omit<User, 'id' | 'status'>);
        }
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? `Edit User: ${user.name}` : 'Create New User'}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-bold mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required/>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md" required/>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded-md" 
                            placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                            required={!isEditing}
                            autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-charcoal/60">
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                 <div>
                    <label className="block font-bold mb-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md">
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                    <button type="submit" className="py-2 px-6 rounded-md bg-satin-gold text-white hover:bg-opacity-90 font-bold">
                        {isEditing ? 'Save Changes' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const statusStyles: Record<UserStatus, { text: string, bg: string }> = {
    'active': { text: 'text-green-800', bg: 'bg-green-100' },
    'blocked': { text: 'text-yellow-800', bg: 'bg-yellow-100' },
    'deleted': { text: 'text-red-800', bg: 'bg-red-100' },
  };
  const style = statusStyles[status];
  return <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${style.text} ${style.bg}`}>{status}</span>;
};

export const UserManagement: React.FC<UserManagementProps> = ({ user: currentUser, users, onCreate, onUpdate, onUpdateStatus }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [action, setAction] = useState<'block' | 'unblock' | 'delete' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const canManage = canPerformAction(currentUser.role, 'manage_users');
    
    const handleOpenFormModal = (user: User | null = null) => {
        setSelectedUser(user);
        setIsFormModalOpen(true);
    };

    const handleOpenConfirmModal = (user: User, actionType: 'block' | 'unblock' | 'delete') => {
        setSelectedUser(user);
        setAction(actionType);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAction = () => {
        if (!selectedUser || !action) return;

        let newStatus: UserStatus;
        if (action === 'delete') newStatus = 'deleted';
        else if (action === 'block') newStatus = 'blocked';
        else newStatus = 'active';

        onUpdateStatus(selectedUser.id, newStatus);
        setIsConfirmModalOpen(false);
        setSelectedUser(null);
        setAction(null);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);
    
    const confirmMessages = {
        block: { title: 'Block User', text: 'Blocking this user will prevent them from logging in.', color: 'burgundy' },
        unblock: { title: 'Unblock User', text: 'This user will regain access to the system.', color: 'green-600' },
        delete: { title: 'Delete User', text: 'This action is irreversible and will permanently mark the user as deleted.', color: 'burgundy' },
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-charcoal/70">Manage user accounts and their permissions within the system.</p>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-satin-gold"
                    />
                    {canManage && (
                        <button onClick={() => handleOpenFormModal()} className="py-2 px-4 bg-satin-gold text-white font-bold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                            <PlusCircleIcon className="h-5 w-5"/> Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-charcoal/10 hidden md:table-header-group">
                        <tr>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">User</th>
                            <th className="py-2 px-4 text-left font-bold uppercase tracking-wider text-sm">Role</th>
                            <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Status</th>
                            <th className="py-2 px-4 text-center font-bold uppercase tracking-wider text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="responsive-table">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="block md:table-row hover:bg-satin-gold/10 md:border-b md:border-gray-200">
                                <td data-label="User:" className="p-4 md:py-2 md:px-4 block md:table-cell">
                                    <p className="font-bold text-sm">{user.name}</p>
                                    <p className="text-charcoal/80 text-xs">{user.email}</p>
                                </td>
                                <td data-label="Role:" className="p-4 md:py-2 md:px-4 block md:table-cell text-sm">{user.role}</td>
                                <td data-label="Status:" className="p-4 md:py-2 md:px-4 block md:table-cell md:text-center"><StatusBadge status={user.status} /></td>
                                <td data-label="Actions:" className="p-4 md:py-2 md:px-4 block md:table-cell">
                                    <div className="flex justify-end md:justify-center gap-2">
                                        <button onClick={() => handleOpenFormModal(user)} disabled={!canManage} className="p-2 text-deep-navy hover:text-deep-navy/70 disabled:opacity-50 disabled:cursor-not-allowed"><EditIcon className="h-5 w-5"/></button>
                                        {user.status === 'active' && <button onClick={() => handleOpenConfirmModal(user, 'block')} disabled={!canManage || user.id === currentUser.id} className="p-2 text-yellow-600 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed">Block</button>}
                                        {user.status === 'blocked' && <button onClick={() => handleOpenConfirmModal(user, 'unblock')} disabled={!canManage} className="p-2 text-green-600 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed">Unblock</button>}
                                        {user.status !== 'deleted' && <button onClick={() => handleOpenConfirmModal(user, 'delete')} disabled={!canManage || user.id === currentUser.id} className="p-2 text-red-600 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="h-5 w-5"/></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && <UserFormModal user={selectedUser} onSave={(updatedUser) => { onUpdate(updatedUser); setIsFormModalOpen(false); }} onCreate={(newUser) => { onCreate(newUser); setIsFormModalOpen(false); }} onClose={() => setIsFormModalOpen(false)} />}
            
            {isConfirmModalOpen && selectedUser && action && (
                <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={`Confirm ${action}`}>
                     <div className="text-center">
                        <WarningIcon className={`h-16 w-16 text-${confirmMessages[action].color} mx-auto mb-4`} />
                        <p className="text-xl mb-4">Are you sure you want to {action} <strong className="font-serif font-bold">{selectedUser.name}</strong>?</p>
                        <p className="text-charcoal/70">{confirmMessages[action].text}</p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setIsConfirmModalOpen(false)} className="py-2 px-6 rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 font-bold">Cancel</button>
                            <button onClick={handleConfirmAction} className={`py-2 px-6 rounded-md bg-${confirmMessages[action].color} text-white font-bold hover:bg-opacity-90`}>Confirm {action}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};