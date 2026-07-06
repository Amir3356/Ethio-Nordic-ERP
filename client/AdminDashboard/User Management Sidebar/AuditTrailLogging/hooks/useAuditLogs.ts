import { useState, useEffect, useCallback } from 'react';
import { auditLogAPI } from '../../../../services/api';
import { AuditLog } from '../types';
import { filterLogs } from '../utils';

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditLogAPI.getAll({ per_page: 100, sort: '-created_at' });
      setAuditLogs(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = filterLogs(auditLogs, filter);

  return {
    auditLogs,
    filteredLogs,
    loading,
    error,
    filter,
    setFilter,
    fetchAuditLogs,
  };
}
