import { AccessReview } from './types';
import { calculateStats } from './utils';

interface AccessReviewSummaryProps {
  reviews: AccessReview[];
  inactiveDays: number;
}

export default function AccessReviewSummary({ reviews, inactiveDays }: AccessReviewSummaryProps) {
  const { total, activeCount, dormantCount } = calculateStats(reviews, inactiveDays);

  return (
    <div className="content-summary-grid">
      <div className="content-summary-card">
        <span className="content-summary-value">{total}</span>
        <span className="content-summary-label">Total Users</span>
      </div>
      <div className="content-summary-card">
        <span className="content-summary-value">{activeCount}</span>
        <span className="content-summary-label">Active</span>
      </div>
      <div className="content-summary-card">
        <span className="content-summary-value">{dormantCount}</span>
        <span className="content-summary-label">Dormant</span>
      </div>
    </div>
  );
}
