import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function PerformanceEvaluation({ hr }: Props) {
  const { data, getEmployee, getAveragePerformanceScore } = hr;
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('H1-2026');

  const periods = useMemo(() => {
    return [...new Set(data.performance_reviews.map((r) => r.review_period))].sort().reverse();
  }, [data]);

  const reviews = useMemo(() => {
    let filtered = data.performance_reviews.filter((r) => r.review_period === periodFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => {
        const emp = getEmployee(r.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.employee_id.toLowerCase().includes(q));
      });
    }
    return filtered.sort((a, b) => b.final_score - a.final_score);
  }, [data, search, periodFilter, getEmployee]);

  const ratingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reviews.forEach((r) => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'hr-score-excellent';
    if (score >= 75) return 'hr-score-good';
    if (score >= 65) return 'hr-score-average';
    return 'hr-score-needs-improvement';
  };

  const getRatingBadge = (rating: string) => {
    const cls =
      rating === 'Exceeds Expectations' ? 'hr-badge-green' :
      rating === 'Meets Expectations' ? 'hr-badge-blue' :
      rating === 'Needs Improvement' ? 'hr-badge-amber' :
      'hr-badge-red';
    return <span className={`hr-badge ${cls}`}>{rating}</span>;
  };

  return (
    <section className="content-section" id="performance-evaluation">
      <div className="content-section-header">
        <h2>Performance Evaluation</h2>
      </div>

      <p className="content-description">
        Structured periodic review cycles with self-assessment, manager assessment, and goal tracking.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{reviews.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{reviews.length}</span>
            <span className="hr-stat-label">Reviews Completed</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{getAveragePerformanceScore.toFixed(1)}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{getAveragePerformanceScore.toFixed(1)}</span>
            <span className="hr-stat-label">Average Score</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-teal">
            <span style={{ fontSize: 18 }}>{ratingCounts['Exceeds Expectations'] || 0}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{ratingCounts['Exceeds Expectations'] || 0}</span>
            <span className="hr-stat-label">Exceeds Expectations</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{ratingCounts['Needs Improvement'] || 0}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{ratingCounts['Needs Improvement'] || 0}</span>
            <span className="hr-stat-label">Needs Improvement</span>
          </div>
        </div>
      </div>

      <div className="hr-toolbar">
        <div className="hr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="hr-filter-select"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Self Score</th>
              <th>Manager Score</th>
              <th>Final Score</th>
              <th>Rating</th>
              <th>Strengths</th>
              <th>Improvements</th>
              <th>Goals</th>
              <th>Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => {
              const emp = getEmployee(r.employee_id);
              const reviewer = getEmployee(r.reviewer_id);
              return (
                <tr key={r.id}>
                  <td className="hr-table-name">{emp?.first_name} {emp?.last_name}</td>
                  <td>{r.self_assessment_score}</td>
                  <td>{r.manager_score}</td>
                  <td>
                    <span className="hr-text-bold">{r.final_score}</span>
                    <div className="hr-score-bar">
                      <div className={`hr-score-fill ${getScoreColor(r.final_score)}`} style={{ width: `${r.final_score}%` }} />
                    </div>
                  </td>
                  <td>{getRatingBadge(r.rating)}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.strengths}>{r.strengths}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.improvements}>{r.improvements}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.goals}>{r.goals}</td>
                  <td>{reviewer?.first_name} {reviewer?.last_name}</td>
                </tr>
              );
            })}
            {reviews.length === 0 && (
              <tr><td colSpan={9} className="hr-empty">No performance reviews found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
