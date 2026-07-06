import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../../../services/api';
import { AccessReview } from '../types';

export function useAccessReview() {
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inactiveDays, setInactiveDays] = useState(90);

  const fetchAccessReview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAccessReview(inactiveDays);
      setReviews(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError('Failed to load access review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inactiveDays]);

  useEffect(() => {
    fetchAccessReview();
  }, [fetchAccessReview]);

  return {
    reviews,
    loading,
    error,
    inactiveDays,
    setInactiveDays,
    fetchAccessReview,
  };
}
