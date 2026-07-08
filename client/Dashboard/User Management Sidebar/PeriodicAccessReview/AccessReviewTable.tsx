import { AccessReview } from './types';
import { formatDate, getStatusLabel, getDaysBadgeClass } from './utils';

interface AccessReviewTableProps {
  reviews: AccessReview[];
  inactiveDays: number;
}

export default function AccessReviewTable({ reviews, inactiveDays }: AccessReviewTableProps) {
  return (
    <div className="content-table-wrapper">
      <table className="content-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Last Login</th>
            <th>Days Inactive</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <tr key={review.id}>
                <td className="content-table-name">{review.full_name}</td>
                <td>{review.email}</td>
                <td>
                  {review.roles && review.roles.length > 0
                    ? review.roles.join(', ')
                    : 'No roles'}
                </td>
                <td>{formatDate(review.last_login)}</td>
                <td>
                  <span className={`content-days-badge ${getDaysBadgeClass(review.days_since_login, inactiveDays)}`}>
                    {review.days_since_login || 'Never'} days
                  </span>
                </td>
                <td>
                  <span className={`content-review-status ${getStatusLabel(review.days_since_login, inactiveDays) === 'Needs Review' ? 'flagged' : 'active'}`}>
                    {getStatusLabel(review.days_since_login, inactiveDays)}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="content-empty">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
