interface AuditLogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AuditLogSearch({ value, onChange }: AuditLogSearchProps) {
  return (
    <div className="content-search">
      <input
        type="text"
        placeholder="Filter by user, action, or module..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="content-search-input"
      />
    </div>
  );
}
