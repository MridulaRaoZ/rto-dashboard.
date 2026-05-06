export const mockEmployee = {
  name: 'Mridula Rao',
  month: '2026-05',
  totalInOfficeDays: 7,
  target: 10,
  status: 'on-track' as const,
  days: [
    { date: '2026-05-01', inOffice: true,  source: 'graph' as const },
    { date: '2026-05-02', inOffice: false, source: 'none' as const },
    { date: '2026-05-05', inOffice: true,  source: 'graph' as const },
    { date: '2026-05-06', inOffice: true,  source: 'bot' as const },
    { date: '2026-05-07', inOffice: false, source: 'none' as const },
    { date: '2026-05-08', inOffice: true,  source: 'both' as const },
    { date: '2026-05-09', inOffice: false, source: 'none' as const },
    { date: '2026-05-12', inOffice: true,  source: 'graph' as const },
    { date: '2026-05-13', inOffice: false, source: 'none' as const },
    { date: '2026-05-14', inOffice: true,  source: 'bot' as const },
    { date: '2026-05-15', inOffice: false, source: 'none' as const },
    { date: '2026-05-16', inOffice: true,  source: 'graph' as const },
  ],
};

export const mockTeam = [
  { userId: '1', name: 'Alice Chen',    email: 'alice@company.com',   totalInOfficeDays: 9,  target: 10, status: 'on-track' as const },
  { userId: '2', name: 'Bob Patel',     email: 'bob@company.com',     totalInOfficeDays: 3,  target: 10, status: 'at-risk' as const },
  { userId: '3', name: 'Carol Smith',   email: 'carol@company.com',   totalInOfficeDays: 10, target: 10, status: 'on-track' as const },
  { userId: '4', name: 'David Kim',     email: 'david@company.com',   totalInOfficeDays: 1,  target: 10, status: 'missed' as const },
  { userId: '5', name: 'Eva Rodriguez', email: 'eva@company.com',     totalInOfficeDays: 6,  target: 10, status: 'at-risk' as const },
  { userId: '6', name: 'Frank Liu',     email: 'frank@company.com',   totalInOfficeDays: 8,  target: 10, status: 'on-track' as const },
];
