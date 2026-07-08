interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function UserSearch({ value, onChange }: UserSearchProps) {
  return (
    <div className="content-search">
      <input
        type="text"
        placeholder="Search Fullname or email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="content-search-input"
      />
    </div>
  );
}
