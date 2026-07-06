import { AuditLog } from './types';

export const getActionClass = (action: string): string => {
  return `content-audit-action action-${action?.toLowerCase() || 'unknown'}`;
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString();
};

export const formatDetails = (log: AuditLog): string => {
  return `Before: ${JSON.stringify(log.old_values || {})}\nAfter: ${JSON.stringify(log.new_values || {})}`;
};

export const filterLogs = (logs: AuditLog[], filter: string): AuditLog[] => {
  if (!filter.trim()) return logs;
  
  const lowerFilter = filter.toLowerCase();
  return logs.filter((log) =>
    log.user_email?.toLowerCase().includes(lowerFilter) ||
    log.action?.toLowerCase().includes(lowerFilter) ||
    log.model_type?.toLowerCase().includes(lowerFilter)
  );
};
