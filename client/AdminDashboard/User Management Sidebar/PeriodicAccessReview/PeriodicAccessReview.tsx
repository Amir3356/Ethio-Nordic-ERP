import { useEffect, useState } from 'react';
import { userAPI } from '../../../services/api';
import './PeriodicAccessReview.css';

interface AccessReview {
  id: number;
  full_name: string;
  email: string;
  roles: string[];
  last_login: string | null;
  days_since_login: number;
}

export default function PeriodicAccessReview() {
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inactiveDays, setInactiveDays] = useState(90);

  useEffect(() => {
    fetchAccessReview();
  }, [inactiveDays]);

  const fetchAccessReview = async () => {
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
  };

  const dormantCount = reviews.filter((r) => r.days_since_login >= inactiveDays).length;
  const activeCount = reviews.filter((r) => r.days_since_login < inactiveDays).length;

  return (
    <section className="content-section" id="periodic">
      <div className="content-section-header content-section-header-center">
        <h2>Periodic Access Review</h2>
      </div>
      {error && (
        <div className="content-error">
          <p>{error}</p>
          <button onClick={fetchAccessReview}>Retry</button>
        </div>
      )}

      <div className="content-controls">
        <label className="content-form-field">
          <span>Days Inactive (threshold):</span>
          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(parseInt(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </label>
      </div>

      {loading && <p className="content-loading">Loading access review...</p>}

      <div className="content-summary-grid">
        <div className="content-summary-card">
          <span className="content-summary-value">{reviews.length}</span>
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
                  <td>
                    {review.last_login
                      ? new Date(review.last_login).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <span
                      className={`content-days-badge ${
                        review.days_since_login >= inactiveDays
                          ? 'inactive'
                          : 'active'
                      }`}
                    >
                      {review.days_since_login || 'Never'} days
                    </span>
                  </td>
                  <td>
                    <span
                      className={`content-review-status ${
                        review.days_since_login >= inactiveDays
                          ? 'flagged'
                          : 'active'
                      }`}
                    >
                      {review.days_since_login >= inactiveDays
                        ? 'Needs Review'
                        : 'Active'}
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
    </section>
  );
}
