'use client';

interface SelectInputProps {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  helperText?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectInput({
  label,
  value,
  options,
  placeholder,
  helperText,
  onValueChange,
  disabled = false,
}: SelectInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span
          style={{
            fontSize: '0.65rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.875rem',
          fontWeight: 600,
          width: '100%',
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{helperText}</span>
      )}
    </div>
  );
}
