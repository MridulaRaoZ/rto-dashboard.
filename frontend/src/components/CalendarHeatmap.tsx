interface DayRecord {
  date: string;
  inOffice: boolean;
  source: 'graph' | 'bot' | 'both' | 'none';
}

interface Props {
  days: DayRecord[];
  month: string; // "2026-05"
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function CalendarHeatmap({ days, month }: Props) {
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Build Mon-Fri grid for the month
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const lastDay = new Date(year, mon, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  // Find which week-column (Mon=0) the 1st falls on
  const firstDow = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6

  // Build an array of cells: null = empty padding, string = date
  const cells: (string | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const dow = (new Date(year, mon - 1, d).getDay() + 6) % 7;
    if (dow < 5) cells.push(date); // only Mon-Fri
  }
  // Pad to full weeks
  while (cells.length % 5 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 5) weeks.push(cells.slice(i, i + 5));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map((l) => (
          <div key={l} style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
            {l}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
          {week.map((date, di) => {
            if (!date) return <div key={di} />;
            const record = byDate.get(date);
            const isFuture = date > today;
            const bg = isFuture
              ? '#f9fafb'
              : record?.inOffice
              ? '#22c55e'
              : record
              ? '#d1d5db'
              : '#f3f4f6';
            const label = date.slice(8); // day number
            const tip = isFuture
              ? 'Future'
              : record?.inOffice
              ? `In office (${record.source})`
              : record
              ? 'Remote'
              : 'No data';
            return (
              <div
                key={date}
                title={`${date}: ${tip}`}
                style={{
                  background: bg,
                  borderRadius: 6,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 500,
                  color: record?.inOffice && !isFuture ? '#fff' : '#374151',
                  border: date === today ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#22c55e', borderRadius: 3, marginRight: 4 }} />In office</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#d1d5db', borderRadius: 3, marginRight: 4 }} />Remote</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#f3f4f6', borderRadius: 3, marginRight: 4 }} />No data</span>
      </div>
    </div>
  );
}
