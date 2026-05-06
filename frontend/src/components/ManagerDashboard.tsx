import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { apiFetch } from '../api/client.js';
import { TeamTable } from './TeamTable.js';
import type { PublicClientApplication } from '@azure/msal-browser';

interface TeamSummary {
  managerId: string;
  month: string;
  team: Array<{
    userId: string;
    name: string;
    email: string;
    totalInOfficeDays: number;
    target: number;
    status: 'on-track' | 'at-risk' | 'missed';
  }>;
}

export function ManagerDashboard() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const oid = account?.localAccountId ?? '';

  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<TeamSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!oid) return;
    setLoading(true);
    setError('');
    apiFetch<TeamSummary>(
      instance as PublicClientApplication,
      `/api/team/${oid}?month=${month}`
    )
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [instance, oid, month]);

  const onTrack = data?.team.filter((e) => e.status === 'on-track').length ?? 0;
  const atRisk  = data?.team.filter((e) => e.status === 'at-risk').length ?? 0;
  const missed  = data?.team.filter((e) => e.status === 'missed').length ?? 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Team RTO Dashboard</h1>
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

      {loading && <p style={{ color: '#6b7280' }}>Loading team data...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="On Track" value={onTrack} color="#15803d" bg="#dcfce7" />
            <StatCard label="At Risk" value={atRisk} color="#a16207" bg="#fef9c3" />
            <StatCard label="Off Target" value={missed} color="#b91c1c" bg="#fee2e2" />
            <StatCard label="Total" value={data.team.length} color="#374151" bg="#f3f4f6" />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <TeamTable team={data.team} month={month} />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, color, borderRadius: 10, padding: '14px 20px', minWidth: 100, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
