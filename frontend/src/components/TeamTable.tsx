type SortKey = 'name' | 'days' | 'status';

interface EmployeeSummary {
  userId: string;
  name: string;
  email: string;
  totalInOfficeDays: number;
  target: number;
  status: 'on-track' | 'at-risk' | 'missed';
}

interface Props {
  team: EmployeeSummary[];
  month: string;
}

const STATUS_ORDER = { 'missed': 0, 'at-risk': 1, 'on-track': 2 };
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  'on-track': { bg: '#dcfce7', color: '#15803d', label: 'On Track' },
  'at-risk':  { bg: '#fef9c3', color: '#a16207', label: 'At Risk' },
  'missed':   { bg: '#fee2e2', color: '#b91c1c', label: 'Off Target' },
};

import { useState } from 'react';

export function TeamTable({ team, month }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [asc, setAsc] = useState(true);

  const sorted = [...team].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'name') diff = a.name.localeCompare(b.name);
    else if (sortKey === 'days') diff = a.totalInOfficeDays - b.totalInOfficeDays;
    else diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return asc ? diff : -diff;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setAsc((v) => !v);
    else { setSortKey(key); setAsc(true); }
  }

  const th = (key: SortKey, label: string) => (
    <th
      onClick={() => handleSort(key)}
      style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer', userSelect: 'none', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}
    >
      {label} {sortKey === key ? (asc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {th('name', 'Employee')}
            {th('days', 'Days In Office')}
            {th('status', 'Status')}
            <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Month</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((emp) => {
            const st = STATUS_STYLE[emp.status];
            return (
              <tr key={emp.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{emp.email}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{emp.totalInOfficeDays}<span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>/{emp.target}</span></div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                    {st.label}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{formatMonth(month)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No direct reports found.</p>
      )}
    </div>
  );
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
}
