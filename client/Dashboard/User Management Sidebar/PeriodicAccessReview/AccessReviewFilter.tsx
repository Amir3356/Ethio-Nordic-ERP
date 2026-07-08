interface AccessReviewFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export default function AccessReviewFilter({ value, onChange }: AccessReviewFilterProps) {
  return (
    <div className="content-controls">
      <label className="content-form-field">
        <span>Days Inactive (threshold):</span>
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
        >
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
          <option value={180}>180 days</option>
        </select>
      </label>
    </div>
  );
}
