import { useState, useEffect, useCallback } from 'react';
import { auditLogAPI } from '../../../../services';
import { AuditLog } from '../types';

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditLogAPI.getAll({ per_page: 100, sort: '-created_at' });
      const payload = response.data?.data;
      setAuditLogs(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
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

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogs,
  };
}
