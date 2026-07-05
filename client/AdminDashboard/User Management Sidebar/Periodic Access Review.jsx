import { useEffect, useState } from 'react';
import axios from 'axios';
import './Periodic Access Review.css';

export default function PeriodicAccessReview() {
  const [periodic, setPeriodic] = useState(null);

  useEffect(() => {
    axios.get('/Periodic.json')
      .then((res) => setPeriodic(res.data || null))
      .catch(() => {});
  }, []);
  return (
    <section className="content-section" id="periodic">
      <div className="content-section-header content-section-header-center">
        <h2>Periodic Access Review</h2>
      </div>
      <p className="content-description">
        On a scheduled basis, the system generates an access review report listing all users,
        their assigned roles, and last login date, enabling management to identify dormant
        accounts or excessive privilege accumulation ('privilege creep') for remediation.
      </p>

      {periodic ? (
        <>
          <div className="content-summary-grid">
            <div className="content-summary-card">
              <span className="content-summary-value">{periodic.summary.totalUsers}</span>
              <span className="content-summary-label">Total Users</span>
            </div>
            <div className="content-summary-card">
              <span className="content-summary-value">{periodic.summary.activeUsers}</span>
              <span className="content-summary-label">Active</span>
            </div>
            <div className="content-summary-card">
              <span className="content-summary-value">{periodic.summary.dormantAccounts}</span>
              <span className="content-summary-label">Dormant</span>
            </div>
            <div className="content-summary-card">
              <span className="content-summary-value">{periodic.summary.privilegeCreepFlags}</span>
              <span className="content-summary-label">Privilege Creep</span>
            </div>
            <div className="content-summary-card">
              <span className="content-summary-value">{periodic.summary.rolesNeedingReview}</span>
              <span className="content-summary-label">To Review</span>
            </div>
          </div>

          <div className="content-table-wrapper">
            <table className="content-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Days</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {periodic.reviews.map((review) => (
                  <tr key={review.id}>
                    <td className="content-table-name">{review.name}</td>
                    <td><span className="content-badge">{review.role}</span></td>
                    <td>{review.lastLoginDisplay}</td>
                    <td>{review.daysSinceLastLogin}</td>
                    <td>
                      <span className={`content-risk risk-${review.riskLevel.toLowerCase()}`}>
                        {review.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`content-review-status ${review.reviewStatus === 'Approved' ? 'approved' : review.reviewStatus === 'Flagged for Remediation' ? 'flagged' : 'pending'}`}>
                        {review.reviewStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="content-loading">Loading periodic review data...</p>
      )}
    </section>
  );
}
