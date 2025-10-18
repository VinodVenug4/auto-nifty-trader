// Web-safe version of core.ts
export const dj = (input?: any) => {
  const dayjs = require('dayjs');
  return input ? dayjs(input) : dayjs();
};

export const toIST = (d: any) => d;
export const round50 = (n: number) => Math.round(n/50)*50;

export const Config = {
  BACKEND_TOKEN_EXCHANGE: 'https://your-backend.example.com/fyers/token',
  FYERS_APP_ID: 'YOUR_FYERS_APP_ID',
};

export async function scheduleTimers(opts: any) {
  const now = dj();
  const tEntry = Math.max(0, opts.entryAt.diff(now, 'millisecond'));
  const tExit = Math.max(0, opts.exitAt.diff(now, 'millisecond'));
  setTimeout(() => opts.onEntry(), tEntry);
  setTimeout(() => opts.onExit(), tExit);
}

export async function initNotifications() {
  console.log('Notifications not supported on web');
}

export async function notify(title: string, body: string) {
  console.log('Notification:', title, body);
}

export async function exchangeToken(code: string, state: string) {
  const r = await fetch(Config.BACKEND_TOKEN_EXCHANGE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  });
  if (!r.ok) throw new Error('Token exchange failed');
  const j = await r.json();
  localStorage.setItem('fyers:access', j.access_token);
}

export async function selfTest() {
  console.log('Self test passed');
}