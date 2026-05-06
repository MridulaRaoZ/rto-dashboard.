import { useState } from 'react';
import { ProgressRing } from './components/ProgressRing.js';
import { CalendarHeatmap } from './components/CalendarHeatmap.js';
import { TeamTable } from './components/TeamTable.js';
import { mockEmployee, mockTeam } from './demo/mockData.js';

type View = 'employee' | 'manager';

export function DemoApp() {
  const [view, setView] = useState<View>('employee');
  const [month, setMonth] = useState('2026-05');

  const data = mockEmployee;
  const remaining = Math.max(0, data.target - data.totalInOfficeDays);

  const onTrack = mockTeam.filter((e) => e.status === 'on-track').length;
  const atRisk  = mockTeam.filter((e) => e.status === 'at-risk').length;
  const missed  = mockTeam.filter((e) => e.status === 'missed').length;

  const STATUS_STYLE = {
    'on-track': { bg: '#dcfce7', color: '#15803d', label: 'On Track' },
    'at-risk':  { bg: '#fef9c3', color: '#a16207', label: 'At Risk' },
    'missed':   { bg: '#fee2e2', color: '#b91c1c', label: 'Off Target' },
  };
  const st = STATUS_STYLE[data.status];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Demo banner */}
      <div style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'center', padding: '6px', fontSize: 12 }}>
        DEMO MODE — sample data only
      </div>

      {/* Top nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🏢 RTO Dashboard</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('employee')}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: view === 'employee' ? '#0f172a' : '#f1f5f9', color: view === 'employee' ? '#fff' : '#374151' }}
          >
            My View
          </button>
          <button
            onClick={() => setView('manager')}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: view === 'manager' ? '#0f172a' : '#f1f5f9', color: view === 'manager' ? '#fff' : '#374151' }}
          >
            Manager View
          </button>
        </div>
      </div>

      {/* Employee view */}
      {view === 'employee' && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>My Office Attendance</h1>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Mridula Rao</p>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160 }}>
              <ProgressRing current={data.totalInOfficeDays} target={data.target} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
              <div style={{ background: st.bg, color: st.color, borderRadius: 10, padding: '14px 20px', fontWeight: 700, fontSize: 18 }}>
                {st.label}
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', fontSize: 14, color: '#374151' }}>
                {remaining === 0
                  ? 'Target met! Great work.'
                  : `${remaining} more day${remaining !== 1 ? 's' : ''} needed this month.`}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>May 2026</h2>
            <CalendarHeatmap days={data.days} month={data.month} />
          </div>
        </div>
      )}

      {/* Manager view */}
      {view === 'manager' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>Team RTO Dashboard</h1>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Manager View</p>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'On Track', value: onTrack, color: '#15803d', bg: '#dcfce7' },
              { label: 'At Risk',  value: atRisk,  color: '#a16207', bg: '#fef9c3' },
              { label: 'Off Target', value: missed, color: '#b91c1c', bg: '#fee2e2' },
              { label: 'Total',    value: mockTeam.length, color: '#374151', bg: '#f3f4f6' },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, color: s.color, borderRadius: 10, padding: '14px 20px', minWidth: 100, flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <TeamTable team={mockTeam} month={month} />
          </div>
        </div>
      )}
    </div>
  );
}
