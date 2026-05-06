interface Props {
  current: number;
  target: number;
  size?: number;
}

export function ProgressRing({ current, target, size = 140 }: Props) {
  const pct = Math.min(current / target, 1);
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const cx = size / 2;

  const color = pct >= 1 ? '#22c55e' : pct >= 0.6 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={cx} y={cx - 6} textAnchor="middle" fontSize={28} fontWeight="700" fill="#1a1a1a">
        {current}
      </text>
      <text x={cx} y={cx + 16} textAnchor="middle" fontSize={13} fill="#6b7280">
        of {target} days
      </text>
    </svg>
  );
}
