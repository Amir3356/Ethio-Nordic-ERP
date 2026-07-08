import { AuditLog } from './types';

export const getActionClass = (action: string): string => {
  return `content-audit-action action-${action?.toLowerCase() || 'unknown'}`;
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString();
};

