export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#22c55e',
    inactive: '#ef4444',
    pending: '#f59e0b',
    flagged: '#ef4444',
  };
  return colors[status.toLowerCase()] || '#6b7280';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
