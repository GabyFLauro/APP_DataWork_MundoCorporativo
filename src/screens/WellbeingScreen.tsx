import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, useWindowDimensions } from 'react-native';
import Button from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Types & storage keys
type MoodEntry = { id: string; value: number; date: number; note?: string; gratitude?: string[] };
type Meditation = { id: string; title: string; minutes: number; description?: string };
type FocusSchedule = { id: string; title?: string; startAt: number; durationMin: number };

const MOOD_KEY = 'datawork_wellbeing_v1';
const MEDITATIONS_KEY = 'datawork_meditations_v1';
const FOCUS_SCHEDULE_KEY = 'datawork_focus_schedules_v1';
const BREAK_SETTINGS_KEY = 'datawork_break_settings_v1';

const defaultMeditations: Meditation[] = [
  { id: 'm1', title: 'Respiração curta', minutes: 3, description: 'Foque na respiração por 3 minutos.' },
  { id: 'm2', title: 'Foco breve', minutes: 5, description: 'Meditação guiada para foco.' },
  { id: 'm3', title: 'Relaxamento', minutes: 8, description: 'Relaxamento corporal guiado.' },
];

const WellbeingScreen: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>(defaultMeditations);
  const [schedules, setSchedules] = useState<FocusSchedule[]>([]);
  const [breakIntervalMin, setBreakIntervalMin] = useState<number>(60);
  const navigation = useNavigation<any>();
  const timerRef = useRef<number | null>(null);
  const { width } = useWindowDimensions();
  const isSmall = width < 600; // empilha em telas menores que 600px

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { AsyncStorage.setItem(MOOD_KEY, JSON.stringify(entries)).catch(()=>{}); }, [entries]);
  useEffect(() => { AsyncStorage.setItem(MEDITATIONS_KEY, JSON.stringify(meditations)).catch(()=>{}); }, [meditations]);
  useEffect(() => { AsyncStorage.setItem(FOCUS_SCHEDULE_KEY, JSON.stringify(schedules)).catch(()=>{}); }, [schedules]);
  useEffect(() => { AsyncStorage.setItem(BREAK_SETTINGS_KEY, JSON.stringify({ interval: breakIntervalMin })).catch(()=>{}); }, [breakIntervalMin]);

  const loadAll = async () => {
    try{
      const [raw, mRaw, sRaw, bRaw] = await Promise.all([
        AsyncStorage.getItem(MOOD_KEY),
        AsyncStorage.getItem(MEDITATIONS_KEY),
        AsyncStorage.getItem(FOCUS_SCHEDULE_KEY),
        AsyncStorage.getItem(BREAK_SETTINGS_KEY),
      ]);
      if(raw) setEntries(JSON.parse(raw));
      if(mRaw) setMeditations(JSON.parse(mRaw));
      if(sRaw) setSchedules(JSON.parse(sRaw));
      if(bRaw) {
        try{ const parsed = JSON.parse(bRaw); if(parsed && parsed.interval) setBreakIntervalMin(parsed.interval); }catch(e){}
      }
    }catch(e){console.warn(e)}
  };

  // Mood & gratitude
  const addMood = (v:number, note?:string, gratitude?:string[]) => {
    const e: MoodEntry = { id: String(Date.now()), value: v, date: Date.now(), note, gratitude };
    setEntries(s => [e, ...s]);
  };

  // Meditations (start a timer-only guided session)
  const startMeditation = (m: Meditation) => {
    Alert.alert('Meditação', `Iniciando "${m.title}" por ${m.minutes} minutos.`);
    // Simple timer simulation: after minutes, show finished. No audio integrated.
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Alert.alert('Concluído', `Meditação "${m.title}" finalizada`);
      timerRef.current = null;
    }, m.minutes * 60 * 1000) as unknown as number;
  };

  // Focus scheduling
  const createFocusSchedule = (title: string, startInMinutes:number, durationMin:number) => {
    const startAt = Date.now() + startInMinutes * 60 * 1000;
    const sched: FocusSchedule = { id: String(Date.now()), title, startAt, durationMin };
    setSchedules(s => [sched, ...s]);
    Alert.alert('Agendado', `Bloco de foco agendado em ${new Date(startAt).toLocaleString()}`);
  };

  const removeSchedule = (id:string) => setSchedules(s => s.filter(x=>x.id!==id));

  // Break reminders settings
  const setBreakInterval = (min:number) => {
    setBreakIntervalMin(min);
    Alert.alert('Configuração', `Lembretes de pausa definidos a cada ${min} minutos (local)`);
  };

  // Schedule a short break as a focus block (reuses focus schedule list)
  const scheduleBreakNow = (durationMin = 5) => {
    createFocusSchedule('Pausa rápida', 0, durationMin);
    Alert.alert('Pausa agendada', `Pausa de ${durationMin} minutos agendada agora.`);
  };

  // Simple insights
  const insights = () => {
    const last7 = entries.filter(e => e.date >= Date.now() - 7*24*60*60*1000);
    const avgMood = last7.length ? Math.round(last7.reduce((a,b)=>a+b.value,0)/last7.length) : null;
    const focusRaw = AsyncStorage.getItem('datawork_focus_sessions_v1').then(r=>r?JSON.parse(r):[]);
    return { avgMood };
  };

  // Support / privacy helpers
  const clearWellbeing = async () => {
    Alert.alert('Confirmar', 'Apagar todos os dados de bem-estar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(MOOD_KEY); setEntries([]); } }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área de Bem-Estar</Text>
      <Text style={styles.subtitle}>Ferramentas para manter seu equilíbrio e produtividade</Text>

  <View style={[styles.twoColumn, isSmall && styles.twoColumnStack]}>
    <View style={styles.col}>
          {/* Focus Time scheduling */}
          <Text style={styles.section}>Bloqueio de Tempo Focado</Text>
          <Text style={styles.small}>Agende blocos de foco (sem notificações externas aqui).</Text>
          <CreateFocusBlock onCreate={createFocusSchedule} />
          <Text style={{color:'#9CA3AF',marginTop:8}}>Próximos blocos</Text>
          <FlatList data={schedules} keyExtractor={s=>s.id} renderItem={({item})=> (
            <View style={styles.row}>
              <View style={{flex:1}}>
                <Text style={{color:'#fff',fontWeight:'700'}}>{item.title || 'Foco agendado'}</Text>
                <Text style={{color:'#9CA3AF'}}>{new Date(item.startAt).toLocaleString()} • {item.durationMin} min</Text>
              </View>
              <TouchableOpacity onPress={()=>removeSchedule(item.id)} hitSlop={{top:8,left:8,right:8,bottom:8}}><Text style={{color:'#FF3B30'}}>Remover</Text></TouchableOpacity>
            </View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhum bloco agendado</Text>} />
  </View>

  <View style={[styles.col, isSmall ? { marginTop: 12 } : styles.midCol]}>
          {/* Break settings */}
          <Text style={styles.section}>Pausas estruturadas</Text>
          <Text style={styles.small}>Lembretes suaves para pausas e micro-exercícios.</Text>
          <View style={{flexDirection:'row',marginTop:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
            {[30,45,60,90].map(m => (
              <TouchableOpacity key={m} style={[styles.presetBtn, breakIntervalMin===m && styles.presetActive]} onPress={()=>setBreakInterval(m)} hitSlop={{top:8,left:8,right:8,bottom:8}}><Text style={{color: breakIntervalMin===m ? '#fff' : '#9CA3AF'}}>{m}m</Text></TouchableOpacity>
            ))}
          </View>
          <Button style={{marginTop:12, alignSelf:'flex-end'}} onPress={()=>scheduleBreakNow(5)}>Agendar pausa de 5m</Button>
        </View>

        <View style={[styles.col, isSmall ? { marginTop: 12 } : styles.rightCol]}>
          <Text style={styles.section}>Privacidade e Suporte</Text>
          <Text style={styles.small}>Seus dados de bem-estar ficam apenas no seu dispositivo por padrão.</Text>
          <Button variant="danger" style={{marginTop:8}} onPress={clearWellbeing}>Apagar dados de bem-estar</Button>
          <Button variant="secondary" style={{marginTop:8}} onPress={()=>{
            Alert.alert('Suporte', 'Links e contactos de suporte:\n- Serviço local de apoio\n- Telefone de emergência');
          }}>Acesso rápido a suporte</Button>
        </View>
      </View>

      <View style={[styles.twoColumn, isSmall && styles.twoColumnStack, {marginTop:12}]}> 
        <View style={styles.col}>
          {/* Meditations */}
          <Text style={styles.section}>Minimedições & Mindfulness</Text>
          <FlatList data={meditations} keyExtractor={m=>m.id} renderItem={({item})=> (
            <View style={styles.row}>
              <View style={{flex:1}}>
                <Text style={{color:'#fff',fontWeight:'700'}}>{item.title} • {item.minutes}m</Text>
                <Text style={{color:'#9CA3AF'}}>{item.description}</Text>
              </View>
              <Button variant="ghost" size="small" onPress={()=>startMeditation(item)} textStyle={{color:'#007AFF'}}>Iniciar</Button>
            </View>
          )} />
        </View>

        <View style={[styles.col, isSmall ? {marginTop:12} : styles.midCol]}>
          {/* Mood tracker & gratitude */}
          <Text style={styles.section}>Diário de Humor / Gratidão</Text>
          <Text style={styles.small}>Registre seu humor (1 a 5) e uma coisa pela qual é grato.</Text>
          <MoodEntryForm onSave={(v,n,g)=>addMood(v,n,g)} />
          <Text style={{color:'#9CA3AF',marginTop:8}}>Últimos registros</Text>
          <FlatList data={entries} keyExtractor={e=>e.id} renderItem={({item})=> (
            <View style={styles.row}><View style={{flex:1}}><Text style={{color:'#fff'}}>Humor: {item.value}</Text><Text style={{color:'#9CA3AF'}}>{new Date(item.date).toLocaleString()}</Text>{item.gratitude && <Text style={{color:'#fff',marginTop:6}}>Gratidão: {item.gratitude.join(', ')}</Text>}</View></View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhum registro</Text>} />
        </View>

        <View style={[styles.col, isSmall ? {marginTop:12} : styles.rightCol]}>
          {/* Insights */}
          <Text style={styles.section}>Relatórios & Insights</Text>
          <Insights entries={entries} />
        </View>
      </View>

      {/* Privacidade & Suporte (já mostrado no topo) - removed duplicate */}
    </View>
  );
};

// Small helper components inside the same file
const CreateFocusBlock: React.FC<{ onCreate: (title:string,startIn:number,duration:number)=>void }> = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [startIn, setStartIn] = useState('5');
  const [duration, setDuration] = useState('25');
  return (
    <View style={{marginTop:8,marginBottom:8}}>
      <TextInput placeholder="Título (opcional)" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} style={styles.smallInput} />
      <View style={{flexDirection:'row',marginTop:8}}>
        <TextInput placeholder="Começa em (min)" value={startIn} onChangeText={setStartIn} keyboardType="number-pad" style={[styles.smallInput,{flex:1,marginRight:8}]} />
        <TextInput placeholder="Duração (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" style={[styles.smallInput,{width:120}]} />
      </View>
  <Button style={{marginTop:8}} onPress={()=>{ const s = parseInt(startIn||'0',10)||0; const d = parseInt(duration||'25',10)||25; onCreate(title,s,d); setTitle(''); setStartIn('5'); setDuration('25'); }}>Agendar bloco</Button>
    </View>
  );
};

const MoodEntryForm: React.FC<{ onSave:(v:number,n?:string,g?:string[])=>void }> = ({ onSave }) => {
  const [value, setValue] = useState('4');
  const [note, setNote] = useState('');
  const [grat, setGrat] = useState('');
  return (
    <View style={{marginTop:8}}>
      <View style={{flexDirection:'row',justifyContent:'space-between'}}>
        {[1,2,3,4,5].map(n=> (
          <TouchableOpacity key={n} style={[styles.presetBtn, String(n)===value && styles.presetActive]} onPress={()=>setValue(String(n))}><Text style={{color: String(n)===value ? '#fff' : '#9CA3AF'}}>{n}</Text></TouchableOpacity>
        ))}
      </View>
      <TextInput placeholder="Nota curta" placeholderTextColor="#9CA3AF" value={note} onChangeText={setNote} style={[styles.smallInput,{marginTop:8}]} />
      <TextInput placeholder="Gratidões (vírgula)" placeholderTextColor="#9CA3AF" value={grat} onChangeText={setGrat} style={[styles.smallInput,{marginTop:8}]} />
  <Button style={{marginTop:8}} onPress={()=>{ onSave(parseInt(value,10), note, grat.split(',').map(s=>s.trim()).filter(Boolean)); setNote(''); setGrat(''); setValue('4'); }}>Salvar</Button>
    </View>
  );
};

const Insights: React.FC<{ entries: MoodEntry[] }> = ({ entries }) => {
  const last7 = entries.filter(e => e.date >= Date.now() - 7*24*60*60*1000);
  const avgMood = last7.length ? (last7.reduce((a,b)=>a+b.value,0)/last7.length) : null;
  return (
    <View style={{marginTop:8}}>
      <Text style={{color:'#9CA3AF'}}>Últimos 7 dias</Text>
      <Text style={{color:'#fff'}}>Média de humor: {avgMood ? avgMood.toFixed(1) : '—'}</Text>
      <Text style={{color:'#9CA3AF',marginTop:6}}>Dica: combine pausas curtas com sessões de foco para melhorar o humor.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#0F1720'},
  title:{color:'#fff',fontSize:20,fontWeight:'700'},
  subtitle:{color:'#9CA3AF',marginBottom:12},
  section:{color:'#fff',fontWeight:'700',marginTop:14},
  small:{color:'#9CA3AF',fontSize:13},
  row:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:'#0B1220',borderRadius:10,marginBottom:10},
  btn:{},
  presetBtn: { paddingHorizontal:12, paddingVertical:10, borderRadius:10, backgroundColor:'#111827', marginHorizontal:6 },
  presetActive: { backgroundColor:'#007AFF' },
  smallInput: { backgroundColor:'#111827', color:'#fff', padding:10, borderRadius:10, marginTop:6 }
  ,
  twoColumn: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8 },
  twoColumnStack: { flexDirection: 'column' },
  col: { flex: 1 },
  midCol: { marginLeft: 12 },
  rightCol: { marginLeft: 12 }
});

export default WellbeingScreen;
