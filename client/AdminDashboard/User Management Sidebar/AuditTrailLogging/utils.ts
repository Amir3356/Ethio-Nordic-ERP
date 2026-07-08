import { AuditLog } from './types';

export const getActionClass = (action: string): string => {
  return `content-audit-action action-${action?.toLowerCase() || 'unknown'}`;
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString();
};

export const filterLogs = (logs: AuditLog[], filter: string): AuditLog[] => {
  if (!filter.trim()) return logs;
  
  const lowerFilter = filter.toLowerCase();
  return logs.filter((log) =>
    log.full_name?.toLowerCase().includes(lowerFilter) ||
    log.email?.toLowerCase().includes(lowerFilter) ||
    log.action?.toLowerCase().includes(lowerFilter) ||
    log.model_type?.toLowerCase().includes(lowerFilter)
  );
};
