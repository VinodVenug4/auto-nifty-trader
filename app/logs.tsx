import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Share } from 'react-native';
import { styles, Text, TextInput, Button, Card, Row } from '../lib/ui';
import { getAllLogs, exportCSV } from '../lib/logs';
import { dj } from '../lib/core';


export default function LogsScreen() {
const [q, setQ] = useState('');
const [from, setFrom] = useState('');
const [to, setTo] = useState('');
const [logs, setLogs] = useState<any[]>([]);


useEffect(()=>{ (async()=> setLogs(await getAllLogs()))(); }, []);


const filtered = useMemo(()=>{
return logs.filter(l =>{
const hit = !q || l.msg.toLowerCase().includes(q.toLowerCase());
const t = dj(l.time);
const inFrom = !from || t.isAfter(dj(from).startOf('day')) || t.isSame(dj(from), 'day');
const inTo = !to || t.isBefore(dj(to).endOf('day')) || t.isSame(dj(to), 'day');
return hit && inFrom && inTo;
});
}, [logs, q, from, to]);


const doExport = async () => {
const uri = await exportCSV(filtered);
await Share.share({ url: uri, message: `Trade Logs CSV: ${uri}` });
};


return (
<View style={styles.container}>
<Row>
<TextInput label="Search" value={q} onChangeText={setQ} style={{flex:1}} />
</Row>
<Row>
<TextInput label="From (YYYY-MM-DD)" value={from} onChangeText={setFrom} style={{flex:1}} />
<View style={{width:12}} />
<TextInput label="To (YYYY-MM-DD)" value={to} onChangeText={setTo} style={{flex:1}} />
</Row>
<Row>
<Button title="Export CSV" onPress={doExport} />
</Row>


<FlatList data={filtered} keyExtractor={(i,idx)=>String(idx)} renderItem={({item})=> (
<Card>
<Text style={{fontWeight:'700'}}>{dj(item.time).format('YYYY-MM-DD HH:mm:ss')}</Text>
<Text>{item.msg}</Text>
</Card>
)} />
</View>
);
}