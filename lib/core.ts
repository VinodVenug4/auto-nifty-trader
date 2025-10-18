import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

// Simple dayjs setup without timezone for web compatibility
let utc: any, timezone: any;
try {
  utc = require('dayjs/plugin/utc');
  timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  if (dayjs.tz?.setDefault) {
    dayjs.tz.setDefault('Asia/Kolkata');
  }
} catch (e) {
  console.warn('Timezone setup failed:', e);
}


export const dj = (input?: any) => {
  try {
    if (dayjs.tz) {
      return input ? dayjs.tz(input, 'Asia/Kolkata') : dayjs.tz('Asia/Kolkata');
    }
  } catch (e) {}
  return input ? dayjs(input) : dayjs();
};
export const toIST = (d: dayjs.Dayjs) => dayjs.tz(d, 'Asia/Kolkata');
export const round50 = (n:number) => Math.round(n/50)*50; // nearest 50


export const Config = {
BACKEND_TOKEN_EXCHANGE: 'https://your-backend.example.com/fyers/token',
FYERS_APP_ID: 'YOUR_FYERS_APP_ID',
};


export async function scheduleTimers(opts: { onEntry:()=>void|Promise<void>; onExit:()=>void|Promise<void>; entryAt: dayjs.Dayjs; exitAt: dayjs.Dayjs; }) {
const now = dj();
const tEntry = Math.max(0, opts.entryAt.diff(now, 'millisecond'));
const tExit = Math.max(0, opts.exitAt.diff(now, 'millisecond'));
setTimeout(()=>opts.onEntry(), tEntry);
setTimeout(()=>opts.onExit(), tExit);
}


export async function initNotifications() {
// Skip notifications on web as they may not be fully supported
if (typeof window !== 'undefined') {
console.log('Skipping notifications on web');
return;
}
Notifications.setNotificationHandler({
handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowAlert: true }),
});
try { await Notifications.requestPermissionsAsync(); } catch {}
}


export async function notify(title: string, body: string) {
await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}


export async function exchangeToken(code: string, state: string) {
// Exchange auth code on your backend to keep app secret safe
const r = await fetch(Config.BACKEND_TOKEN_EXCHANGE, {
method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, state })
});
if (!r.ok) throw new Error('Token exchange failed');
const j = await r.json();
await SecureStore.setItemAsync('fyers:access', j.access_token);
}


// Runtime self-tests
export async function selfTest() {
const cases = [
{ input: 20001, want: 20000 },
{ input: 19999, want: 20000 },
{ input: 19750, want: 19750 },
{ input: 19776, want: 19800 },
{ input: 0, want: 0 },
{ input: -24, want: 0 },
{ input: -26, want: -50 },
];
cases.forEach(c => { const got = round50(c.input); if (got !== c.want) throw new Error(`round50(${c.input})=${got} want ${c.want}`); });


const now = dj();
const entryAt = now.add(1, 'second');
const exitAt = now.add(2, 'second');
await new Promise<void>(resolve => { scheduleTimers({ onEntry: ()=>{}, onExit: ()=>resolve(), entryAt, exitAt }); });
}