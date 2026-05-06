import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { apiFetch } from '../api/client.js';
import { ProgressRing } from './ProgressRing.js';
import { CalendarHeatmap } from './CalendarHeatmap.js';
import type { PublicClientApplication } from '@azure/msal-browser';

interface AttendanceSummary {
  userId: string;
  month: string;
  days: Array<{ date: string; inOffice: boolean; source: string }>;
  totalInOfficeDays: number;
  target: number;
  status: 'on-track' | 'at-risk' | 'missed';
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  'on-track': { bg: '#dcfce7', color: '#15803d', label: 'On Track' },
  'at-risk':  { bg: '#fef9c3', color: '#a16207', label: 'At Risk' },
  'missed':   { bg: '#fee2e2', color: '#b91c1c', label: 'Off Target' },
};

export function EmployeeDashboard() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const oid = account?.localAccountId ?? '';

  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!oid) return;
    setLoading(true);
    setError('');
    apiFetch<AttendanceSummary>(
      instance as PublicClientApplication,
      `/api/attendance/${oid}?month=${month}`
    )
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [instance, oid, month]);

  const remaining = data ? Math.max(0, data.target - data.totalInOfficeDays) : 0;
  const st = data ? STATUS_STYLE[data.status] : null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>My Office Attendance</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{account?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
          />
          <button
            onClick={() => instance.logoutPopup()}
            style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}
          >
            Sign out
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160 }}>
              <ProgressRing current={data.totalInOfficeDays} target={data.target} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {st && (
                <div style={{ background: st.bg, color: st.color, borderRadius: 10, padding: '14px 20px', fontWeight: 700, fontSize: 18 }}>
                  {st.label}
                </div>
              )}
              <div style={{ background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', fontSize: 14, color: '#374151' }}>
                {data.status === 'missed'
                  ? remaining === 0
                    ? 'You hit the target this month!'
                    : `You needed ${remaining} more day${remaining !== 1 ? 's' : ''} to meet the target.`
                  : remaining === 0
                  ? 'Target met! Great work.'
                  : `${remaining} more day${remaining !== 1 ? 's' : ''} needed this month.`}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>{formatMonth(month)}</h2>
            <CalendarHeatmap days={data.days as Parameters<typeof CalendarHeatmap>[0]['days']} month={month} />
          </div>
        </>
      )}
    </div>
  );
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}
