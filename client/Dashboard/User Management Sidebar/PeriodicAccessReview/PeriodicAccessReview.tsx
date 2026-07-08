import { useAccessReview } from './hooks/useAccessReview';
import AccessReviewFilter from './AccessReviewFilter';
import AccessReviewSummary from './AccessReviewSummary';
import AccessReviewTable from './AccessReviewTable';
import './PeriodicAccessReview.css';

export default function PeriodicAccessReview() {
  const {
    reviews,
    loading,
    error,
    inactiveDays,
    setInactiveDays,
    fetchAccessReview,
  } = useAccessReview();

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

      <AccessReviewFilter value={inactiveDays} onChange={setInactiveDays} />

      {loading && <p className="content-loading">Loading access review...</p>}

      <AccessReviewSummary reviews={reviews} inactiveDays={inactiveDays} />

      <AccessReviewTable reviews={reviews} inactiveDays={inactiveDays} />
    </section>
  );
}
