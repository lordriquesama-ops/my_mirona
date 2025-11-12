import { UserRole } from '../types';

type Page = 'dashboard' | 'bookings' | 'rooms' | 'customers' | 'feedback' | 'finance' | 'settings';

export const pagePermissions: Record<Page, UserRole[]> = {
  dashboard: ['admin', 'manager', 'receptionist', 'viewer'],
  bookings: ['admin', 'manager', 'receptionist', 'viewer'],
  rooms: ['admin', 'manager', 'receptionist', 'viewer'],
  customers: ['admin', 'manager', 'receptionist', 'viewer'],
  feedback: ['admin', 'manager', 'viewer'],
  finance: ['admin', 'manager', 'viewer'],
  settings: ['admin'],
};

export const hasPermission = (role: UserRole | undefined | null, page: Page): boolean => {
  if (!role) {
    return false;
  }
  const allowedRoles = pagePermissions[page];
  return allowedRoles ? allowedRoles.includes(role) : false;
};

// New granular permissions
export type Action =
    | 'create_booking'
    | 'edit_booking'
    | 'cancel_booking'
    | 'check_in_out'
    | 'update_inventory_status'
    | 'edit_customer'
    | 'manage_feedback_status'
    | 'manage_services'
    | 'manage_expenses'
    | 'manage_hotel_info'
    | 'manage_users'
    | 'manage_room_prices'
    | 'generate_reports'
    | 'download_backup';

const actionPermissions: Record<Action, UserRole[]> = {
    create_booking: ['admin', 'manager', 'receptionist'],
    edit_booking: ['admin', 'manager', 'receptionist'],
    cancel_booking: ['admin', 'manager'],
    check_in_out: ['admin', 'manager', 'receptionist'],
    update_inventory_status: ['admin', 'manager', 'receptionist'],
    edit_customer: ['admin'],
    manage_feedback_status: ['admin', 'manager'],
    manage_services: ['admin'],
    manage_expenses: ['admin'],
    manage_hotel_info: ['admin'],
    manage_users: ['admin'],
    manage_room_prices: ['admin'],
    generate_reports: ['admin', 'manager'],
    download_backup: ['admin', 'manager'],
};

export const canPerformAction = (role: UserRole, action: Action): boolean => {
    return actionPermissions[action]?.includes(role) || false;
};