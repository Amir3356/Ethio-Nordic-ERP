import { AccessReview } from './types';

export const formatDate = (date: string | null): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString();
};

export const getStatus = (daysSinceLogin: number, inactiveDays: number): 'active' | 'flagged' => {
  return daysSinceLogin >= inactiveDays ? 'flagged' : 'active';
};

export const getStatusLabel = (daysSinceLogin: number, inactiveDays: number): string => {
  return daysSinceLogin >= inactiveDays ? 'Needs Review' : 'Active';
};

export const getDaysBadgeClass = (daysSinceLogin: number, inactiveDays: number): string => {
  return daysSinceLogin >= inactiveDays ? 'inactive' : 'active';
};

export const calculateStats = (reviews: AccessReview[], inactiveDays: number) => {
  const dormantCount = reviews.filter((r) => r.days_since_login >= inactiveDays).length;
  const activeCount = reviews.filter((r) => r.days_since_login < inactiveDays).length;
  return { total: reviews.length, activeCount, dormantCount };
};
