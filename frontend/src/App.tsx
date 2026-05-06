import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig.js';
import { EmployeeDashboard } from './components/EmployeeDashboard.js';
import { ManagerDashboard } from './components/ManagerDashboard.js';

export function App() {
  const { instance, accounts } = useMsal();
  const roles = (accounts[0]?.idTokenClaims as Record<string, unknown> | undefined)?.['roles'] as string[] | undefined ?? [];
  const isManager = roles.includes('Manager');

  return (
    <>
      <AuthenticatedTemplate>
        {isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', boxShadow: '0 4px 24px rgba(0,0,0,.1)', textAlign: 'center', maxWidth: 380 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>RTO Dashboard</h1>
            <p style={{ color: '#6b7280', margin: '0 0 28px', fontSize: 15 }}>
              Track your return-to-office days and stay on target.
            </p>
            <button
              onClick={() => instance.loginPopup(loginRequest)}
              style={{
                background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%'
              }}
            >
              Sign in with Microsoft
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
}
