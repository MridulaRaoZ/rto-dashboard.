function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  tenantId: require_env('AZURE_TENANT_ID'),
  clientId: require_env('AZURE_CLIENT_ID'),
  clientSecret: require_env('AZURE_CLIENT_SECRET'),
  botAppId: require_env('BOT_APP_ID'),
  botAppSecret: require_env('BOT_APP_SECRET'),
  dbPath: process.env.DB_PATH ?? './data/rto.db',
  officeLocationLabel: process.env.OFFICE_LOCATION_LABEL ?? 'Office',
  rtoTarget: parseInt(process.env.RTO_TARGET ?? '10', 10),
  botSchedulerSecret: require_env('BOT_SCHEDULER_SECRET'),
  officeTimezone: process.env.OFFICE_TIMEZONE ?? 'America/New_York',
};
