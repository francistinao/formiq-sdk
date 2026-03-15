'use client';

interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  helperText?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SliderControl({
  label,
  value,
  min = 0,
  max = 30,
  helperText,
  onChange,
  disabled = false,
}: SliderControlProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.65rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.35em',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
          {value} mm
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          accentColor: '#4fb8b2',
        }}
      />
      {helperText && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{helperText}</span>
      )}
    </div>
  );
}
