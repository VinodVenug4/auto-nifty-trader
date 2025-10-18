import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';


const KEY = 'trade:logs';
const RUN_PAPER = 'run:paper';
const RUN_ATR = 'run:atr';
const RUN_LOTS = 'run:lots';


export async function addLog(msg: string) {
const now = new Date().toISOString();
const existing = await AsyncStorage.getItem(KEY);
const arr = existing ? JSON.parse(existing) : [];
arr.push({ time: now, msg });
await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}


export async function getAllLogs() {
const s = await AsyncStorage.getItem(KEY);
return s ? JSON.parse(s) : [];
}


export async function exportCSV(rows?: any[]) {
const data = rows ?? await getAllLogs();
const header = 'time,msg\n';
const lines = data.map((r:any)=> `${r.time},"${(r.msg||'').replace(/"/g,'\\"')}"`).join('\n');
const csv = header + lines + '\n';
const uri = `${FileSystem.documentDirectory}trade_logs_${Date.now()}.csv`;
await FileSystem.writeAsStringAsync(uri, csv);
return uri;
}


export async function saveRunConfig({ paper, atr, lots }:{ paper:boolean; atr:number; lots:number }) {
await AsyncStorage.multiSet([
[RUN_PAPER, JSON.stringify(paper)],
[RUN_ATR, JSON.stringify(atr)],
[RUN_LOTS, JSON.stringify(lots)],
]);
}