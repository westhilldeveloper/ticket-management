// src/app/tickets/new/constants.js

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md']
};

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-50 text-gray-600 border-gray-200', badge: '●', description: 'Non-urgent issues' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200', badge: '●●', description: 'Standard response time' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-50 text-amber-600 border-amber-200', badge: '●●●', description: 'Urgent attention needed' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-50 text-red-600 border-red-200', badge: '●●●●', description: 'System down or major issue' }
];

export const CATEGORY_OPTIONS = [
   { value: 'ENATHU', label: 'ENATHU', icon: '📍', description: '' },
  { value: 'POOVATTOOR', label: 'POOVATTOOR', icon: '📍', description: '' },
  { value: 'KODUMON', label: 'KODUMON', icon: '📍', description: '' },
  { value: 'HARIPAD', label: 'HARIPAD', icon: '📍', description: '' },
  { value: 'THRIPPUNITHURA', label: 'THRIPPUNITHURA', icon: '📍', description: '' },
  { value: 'CHETTIKULANGARA', label: 'CHETTIKULANGARA', icon: '📍', description: '' },
  { value: 'MUTHUKULAM', label: 'MUTHUKULAM', icon: '📍', description: '' },
  { value: 'KARUNAGAPALLY', label: 'KARUNAGAPALLY', icon: '📍', description: '' },
  { value: 'CHETTIKULANGARA MAIN', label: 'CHETTIKULANGARA MAIN', icon: '📍', description: '' },
  { value: 'KULATHUPUZHA', label: 'KULATHUPUZHA', icon: '📍', description: '' },
  { value: 'MULAKKUZHA', label: 'MULAKKUZHA', icon: '📍', description: '' },
  { value: 'KATTANAM', label: 'KATTANAM', icon: '📍', description: '' },
  { value: 'KUMBANAD', label: 'KUMBANAD', icon: '📍', description: '' },
  { value: 'RANNI', label: 'RANNI', icon: '📍', description: '' },
  { value: 'VAIKOM', label: 'VAIKOM', icon: '📍', description: '' },
  { value: 'ALAPPUZHA', label: 'ALAPPUZHA', icon: '📍', description: '' },
  { value: 'PALLIKATHODU', label: 'PALLIKATHODU', icon: '📍', description: '' },
  { value: 'PUTHOOR', label: 'PUTHOOR', icon: '📍', description: '' },
  { value: 'PATHANAMTHITTA', label: 'PATHANAMTHITTA', icon: '📍', description: '' },
  { value: 'MANNAR', label: 'MANNAR', icon: '📍', description: '' },
  { value: 'PRAVINKODU', label: 'PRAVINKODU', icon: '📍', description: '' },
  { value: 'KOTTARAKKARA', label: 'KOTTARAKKARA', icon: '📍', description: '' },
  { value: 'ANCHAL', label: 'ANCHAL', icon: '📍', description: '' },
  { value: 'THRIPPUNITHURA TOWN', label: 'THRIPPUNITHURA TOWN', icon: '📍', description: '' },
  { value: 'MUVATTUPUZHA', label: 'MUVATTUPUZHA', icon: '📍', description: '' },
  { value: 'KOTHAMANGALAM', label: 'KOTHAMANGALAM', icon: '📍', description: '' },
  { value: 'THOPPUMPODY', label: 'THOPPUMPODY', icon: '📍', description: '' },
  { value: 'PATHANAPURAM', label: 'PATHANAPURAM', icon: '📍', description: '' },
  { value: 'MATTANCHERRY', label: 'MATTANCHERRY', icon: '📍', description: '' },
  { value: 'ATHANI', label: 'ATHANI', icon: '📍', description: '' },
  { value: 'KECHERY', label: 'KECHERY', icon: '📍', description: '' },
  { value: 'VADANAPALLI', label: 'VADANAPALLI', icon: '📍', description: '' },
  { value: 'KALMANDAPAM', label: 'KALMANDAPAM', icon: '📍', description: '' },
];