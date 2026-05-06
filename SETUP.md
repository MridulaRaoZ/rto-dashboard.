# RTO Dashboard — Setup Guide

## 1. Install Node.js

```bash
brew install node
# verify
node --version   # should be 18+
npm --version
```

## 2. Install dependencies

```bash
cd rto-dashboard/backend && npm install
cd ../frontend && npm install
```

## 3. Configure environment

```bash
cp .env.example backend/.env
# Edit backend/.env with your Azure AD values (see below)
```

Create `frontend/.env`:
```
VITE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 4. Azure AD Setup (one-time)

1. Go to https://portal.azure.com → Azure Active Directory → App registrations → New registration
2. Name: `rto-dashboard`, Single tenant, Redirect URI (SPA): `http://localhost:5173`
3. Under **Certificates & secrets** → New client secret → copy value to `AZURE_CLIENT_SECRET`
4. Under **Expose an API** → Set URI: `api://<client-id>` → Add scope: `attendance.read`
5. Under **API permissions** → Add:
   - `Microsoft Graph > Delegated > Calendars.Read`
   - `Microsoft Graph > Delegated > User.Read`
   - `Microsoft Graph > Delegated > User.Read.All`
   - Grant admin consent
6. Under **App roles** → Create:
   - `Employee` (value: `Employee`)
   - `Manager` (value: `Manager`)
7. Under **Enterprise applications** → your app → **Users and groups** → assign roles to employees/managers

### IMPORTANT: Find your OFFICE_LOCATION_LABEL

Before setting OFFICE_LOCATION_LABEL, check what string your Outlook tenant uses:
1. In Outlook, set tomorrow's work location to "In office"
2. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
3. Run: `GET /me/calendarView?startDateTime=<tomorrow>T00:00:00Z&endDateTime=<tomorrow>T23:59:59Z&$select=locations,isAllDay`
4. Copy the value of `locations[0].displayName` → put that in `OFFICE_LOCATION_LABEL`

## 5. Teams Bot Setup

1. Go to Azure → Create resource → Azure Bot
2. Name it `rto-bot`, use the same App Registration (same client ID/secret)
3. Under Channels → Add Microsoft Teams
4. Set messaging endpoint: `https://your-domain.com/api/messages`
   - For local dev: `ngrok http 3001` → use the ngrok URL

## 6. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173

## 7. Test the bot locally

```bash
# Install ngrok
brew install ngrok
ngrok http 3001

# Trigger daily check-in manually
curl -X POST http://localhost:3001/api/bot/send-daily \
  -H "x-scheduler-secret: your-BOT_SCHEDULER_SECRET"
```

## 8. Build for production

```bash
cd backend && npm run build    # outputs to backend/dist/
cd frontend && npm run build   # outputs to frontend/dist/
```

Serve `frontend/dist/` as static files (nginx, Azure Static Web Apps, etc.)
Run `node backend/dist/index.js` for the API server.
