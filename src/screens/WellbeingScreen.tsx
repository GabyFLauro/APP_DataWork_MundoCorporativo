import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, useWindowDimensions, Modal } from 'react-native';
import Button from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Types & storage keys
type MoodEntry = { id: string; value: number; date: number; note?: string };
type Meditation = { id: string; title: string; minutes: number; description?: string };
type FocusSchedule = { id: string; title?: string; startAt: number; durationMin: number };

const MOOD_KEY = 'datawork_wellbeing_v1';
const MEDITATIONS_KEY = 'datawork_meditations_v1';
const FOCUS_SCHEDULE_KEY = 'datawork_focus_schedules_v1';
const BREAK_SETTINGS_KEY = 'datawork_break_settings_v1';
const BREAK_HISTORY_KEY = 'datawork_break_history_v1';

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
  const [breakTime, setBreakTime] = useState<string>('12:00');
  const [breakDurationInput, setBreakDurationInput] = useState<string>('5');
  const [breakHistory, setBreakHistory] = useState<Array<{id:string; startAt:number; durationMin:number}>>([]);
  const [initialized, setInitialized] = useState(false);
  const navigation = useNavigation<any>();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{visible: boolean; message: string; onConfirm: ()=>void}>({visible: false, message: '', onConfirm: ()=>{}});
  const [meditationModal, setMeditationModal] = useState<{visible: boolean; meditation: Meditation | null}>({visible: false, meditation: null});
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerTitle, setTimerTitle] = useState('');
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const { width } = useWindowDimensions();
  const isSmall = width < 600; // empilha em telas menores que 600px

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { if (!initialized) return; AsyncStorage.setItem(MOOD_KEY, JSON.stringify(entries)).catch(()=>{}); }, [entries, initialized]);
  useEffect(() => { if (!initialized) return; AsyncStorage.setItem(MEDITATIONS_KEY, JSON.stringify(meditations)).catch(()=>{}); }, [meditations, initialized]);
  useEffect(() => { if (!initialized) return; AsyncStorage.setItem(FOCUS_SCHEDULE_KEY, JSON.stringify(schedules)).catch(()=>{}); }, [schedules, initialized]);
  useEffect(() => { if (!initialized) return; AsyncStorage.setItem(BREAK_SETTINGS_KEY, JSON.stringify({ interval: breakIntervalMin })).catch(()=>{}); }, [breakIntervalMin, initialized]);
  useEffect(() => { if (!initialized) return; AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify(breakHistory)).catch(()=>{}); }, [breakHistory, initialized]);

  const loadAll = async () => {
    try{
      const [raw, mRaw, sRaw, bRaw] = await Promise.all([
        AsyncStorage.getItem(MOOD_KEY),
        AsyncStorage.getItem(MEDITATIONS_KEY),
        AsyncStorage.getItem(FOCUS_SCHEDULE_KEY),
        AsyncStorage.getItem(BREAK_SETTINGS_KEY),
        AsyncStorage.getItem(BREAK_HISTORY_KEY),
      ]);
      if(raw) setEntries(JSON.parse(raw));
      if(mRaw) setMeditations(JSON.parse(mRaw));
      if(sRaw) setSchedules(JSON.parse(sRaw));
      if(bRaw) {
        try{ const parsed = JSON.parse(bRaw); if(parsed && parsed.interval) setBreakIntervalMin(parsed.interval); }catch(e){}
      }
      // load break history if present
      try{
        const bh = await AsyncStorage.getItem(BREAK_HISTORY_KEY);
        if(bh) setBreakHistory(JSON.parse(bh));
      }catch(e){}
      // mark initialized so subsequent state changes persist
      setInitialized(true);
    }catch(e){console.warn(e)}
  };

  // Mood
  const addMood = (v:number, note?:string) => {
    const e: MoodEntry = { id: String(Date.now()), value: v, date: Date.now(), note };
    setEntries(s => [e, ...s]);
  };

  // Meditations (start a timer-only guided session)
  const startMeditation = (m: Meditation) => {
    setMeditationModal({visible: true, meditation: m});
  };

  const startMeditationTimer = (m: Meditation) => {
    setMeditationModal({visible: false, meditation: null});
    setTimerTitle(m.title);
    setTimerRemaining(m.minutes * 60);
    setTimerActive(true);
    
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Update countdown every second
    intervalRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerActive(false);
          Alert.alert('Concluído', `Meditação "${m.title}" finalizada`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimerActive(false);
    setTimerRemaining(0);
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
  const scheduleBreakNow = (durationMin?: number) => {
    // prefer the selected preset as the pause duration, fallback to provided value or 5
    const dur = typeof durationMin === 'number' && durationMin > 0 ? durationMin : (breakIntervalMin || parseInt(breakDurationInput||'5',10) || 5);
    createFocusSchedule('Pausa rápida', 0, dur);
    // add to break history with current timestamp
    const hist = { id: String(Date.now()), startAt: Date.now(), durationMin: dur };
    setBreakHistory(s => [hist, ...s]);
    Alert.alert('Pausa agendada', `Pausa de ${dur} minutos agendada agora.`);
  };

  // Schedule a break at a specific clock time (HH:MM) and add to history
  const scheduleBreakAt = (timeStr: string, durationMin: number) => {
    // parse HH:MM
    const [hhRaw, mmRaw] = (timeStr || '').split(':');
    const hh = parseInt(hhRaw || '0', 10);
    const mm = parseInt(mmRaw || '0', 10);
    if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      Alert.alert('Horário inválido', 'Use o formato HH:MM (ex: 14:30)');
      return;
    }
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    if (target.getTime() <= Date.now()) {
      // schedule for next day
      target.setDate(target.getDate() + 1);
    }
    const minutesFromNow = Math.max(0, Math.round((target.getTime() - Date.now()) / 60000));
    createFocusSchedule('Pausa agendada', minutesFromNow, durationMin);
    const hist = { id: String(Date.now()), startAt: target.getTime(), durationMin };
    setBreakHistory(s => [hist, ...s]);
    Alert.alert('Pausa agendada', `Pausa agendada para ${target.toLocaleString()} por ${durationMin} minutos.`);
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
      { text: 'Apagar', style: 'destructive', onPress: async () => {
          try{
            await Promise.all([
              AsyncStorage.removeItem(MOOD_KEY),
              AsyncStorage.removeItem(MEDITATIONS_KEY),
              AsyncStorage.removeItem(FOCUS_SCHEDULE_KEY),
              AsyncStorage.removeItem(BREAK_SETTINGS_KEY),
              AsyncStorage.removeItem(BREAK_HISTORY_KEY),
              AsyncStorage.removeItem('datawork_focus_sessions_v1'),
            ]);
          }catch(e){/* ignore */}
          // reset local states
          setEntries([]);
          setMeditations(defaultMeditations);
          setSchedules([]);
          setBreakHistory([]);
          setBreakIntervalMin(60);
        } }
    ]);
  };

  const clearBreakHistory = async () => {
    Alert.alert('Confirmar', 'Apagar histórico de pausas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
          try{
            // try remove then ensure empty array stored so loadAll sees consistent shape
            await AsyncStorage.removeItem(BREAK_HISTORY_KEY);
            await AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify([]));
            // update UI state and reload to be sure
            setBreakHistory([]);
            try{
              const verify = await AsyncStorage.getItem(BREAK_HISTORY_KEY);
              // if verify is not an array string, reset
              if(!verify) await AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify([]));
            }catch(e){ console.warn('verify break history failed', e); }
            // reload all stored data
            await loadAll();
            Alert.alert('Pronto', 'Histórico de pausas apagado.');
          }catch(err){
            console.warn('Erro ao apagar histórico de pausas', err);
            Alert.alert('Erro', 'Não foi possível apagar o histórico de pausas.');
          }
        } }
    ]);
  };

  const clearMoodHistory = async () => {
    Alert.alert('Confirmar', 'Apagar histórico do diário de humor?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
          try{
            await AsyncStorage.removeItem(MOOD_KEY);
            await AsyncStorage.setItem(MOOD_KEY, JSON.stringify([]));
            setEntries([]);
            try{
              const verify = await AsyncStorage.getItem(MOOD_KEY);
              if(!verify) await AsyncStorage.setItem(MOOD_KEY, JSON.stringify([]));
            }catch(e){ console.warn('verify mood failed', e); }
            await loadAll();
            Alert.alert('Pronto', 'Histórico do diário de humor apagado.');
          }catch(err){
            console.warn('Erro ao apagar histórico de humor', err);
            Alert.alert('Erro', 'Não foi possível apagar o histórico do diário de humor.');
          }
        } }
    ]);
  };

  const deleteBreakItem = (id: string) => {
    setConfirmModal({
      visible: true,
      message: 'Apagar esta pausa?',
      onConfirm: () => {
        console.log('Deleting break item:', id);
        const updated = breakHistory.filter(b => b.id !== id);
        console.log('Updated break history:', updated);
        try{
          AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify(updated)).then(() => {
            console.log('Persisted to storage');
            setBreakHistory(updated);
          });
        }catch(e){ 
          console.error('Failed to persist break delete', e);
        }
        setConfirmModal({visible: false, message: '', onConfirm: ()=>{}});
      }
    });
  };

  const deleteMoodEntry = (id: string) => {
    setConfirmModal({
      visible: true,
      message: 'Apagar este registro?',
      onConfirm: () => {
        console.log('Deleting mood entry:', id);
        const updated = entries.filter(e => e.id !== id);
        console.log('Updated mood entries:', updated);
        try{
          AsyncStorage.setItem(MOOD_KEY, JSON.stringify(updated)).then(() => {
            console.log('Persisted to storage');
            setEntries(updated);
          });
        }catch(e){ 
          console.error('Failed to persist mood delete', e);
        }
        setConfirmModal({visible: false, message: '', onConfirm: ()=>{}});
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Title and subtitle removed per request */}

      {/* Privacidade & Suporte block removed - quick support moved under Insights */}

      {/* Timer display modal */}
      <Modal visible={timerActive} animationType="fade" transparent>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#0F1720',borderRadius:16,padding:32,alignItems:'center',minWidth:280}}>
            <Text style={{color:'#9CA3AF',fontSize:14,marginBottom:8}}>{timerTitle}</Text>
            <Text style={{color:'#fff',fontSize:64,fontWeight:'700',fontVariant:['tabular-nums']}}>
              {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}
            </Text>
            <Text style={{color:'#9CA3AF',fontSize:14,marginTop:4}}>minutos restantes</Text>
            <Button variant="danger" style={{marginTop:24}} onPress={stopTimer}>Parar Cronômetro</Button>
          </View>
        </View>
      </Modal>

      {/* Support modal */}
      <Modal visible={showSupportModal} animationType="slide" transparent onRequestClose={()=>setShowSupportModal(false)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:20}}>
          <View style={{backgroundColor:'#0F1720',borderRadius:12,padding:16}}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:16}}>Suporte — Trabalho & Estudo</Text>
            <Text style={{color:'#9CA3AF',marginTop:12}}>Para quem trabalha:
• Fale com o seu RH ou gestor sobre ajustes de carga/horários.
• Use pausas regulares e micro-exercícios durante o dia.
• Procure serviços de aconselhamento ocupacional (linha de apoio da empresa).</Text>
            <Text style={{color:'#9CA3AF',marginTop:12}}>Para quem estuda:
• Consulte a assistência estudantil da sua instituição para apoio acadêmico e psicológico.
• Planeje sessões curtas de estudo intercaladas com pausas para melhorar retenção.
• Procure grupos de estudo e tutoria quando necessário.</Text>
            <Text style={{color:'#9CA3AF',marginTop:12}}>Recursos e contactos úteis:
• Contato de apoio local (procure serviço de saúde/apoio da sua região).
• Em situação de emergência, contate os serviços locais de emergência.
• Se disponível, use os canais de suporte da sua instituição/empresa.</Text>
            <View style={{marginTop:12,flexDirection:'row',justifyContent:'flex-end'}}>
              <Button variant="secondary" onPress={()=>setShowSupportModal(false)}>Fechar</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timer display modal */}
      <Modal visible={timerActive} animationType="fade" transparent>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#0F1720',borderRadius:16,padding:32,alignItems:'center',minWidth:280}}>
            <Text style={{color:'#9CA3AF',fontSize:14,marginBottom:8}}>{timerTitle}</Text>
            <Text style={{color:'#fff',fontSize:64,fontWeight:'700',fontVariant:['tabular-nums']}}>
              {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}
            </Text>
            <Text style={{color:'#9CA3AF',fontSize:14,marginTop:4}}>minutos restantes</Text>
            <Button variant="danger" style={{marginTop:24}} onPress={stopTimer}>Parar Cronômetro</Button>
          </View>
        </View>
      </Modal>

      {/* Meditation detail modal */}
      <Modal visible={meditationModal.visible} animationType="slide" transparent onRequestClose={()=>setMeditationModal({visible:false,meditation:null})}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:20}}>
          <View style={{backgroundColor:'#0F1720',borderRadius:12,padding:16,maxHeight:'80%'}}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:18}}>{meditationModal.meditation?.title}</Text>
            <Text style={{color:'#9CA3AF',marginTop:4}}>{meditationModal.meditation?.minutes} minutos</Text>
            
            {meditationModal.meditation?.id === 'm1' && (
              <View style={{marginTop:12}}>
                <Text style={{color:'#fff',fontWeight:'600',marginBottom:8}}>Respiração Curta (3 minutos)</Text>
                <Text style={{color:'#9CA3AF',fontSize:13,lineHeight:20}}>Esta é uma meditação de atenção plena básica e não guiada.{"\n\n"}
<Text style={{fontWeight:'600'}}>1. Encontre uma Posição:</Text> Sente-se confortavelmente com a coluna ereta.{"\n\n"}
<Text style={{fontWeight:'600'}}>2. Feche ou Suavize os Olhos:</Text> Feche os olhos gentilmente.{"\n\n"}
<Text style={{fontWeight:'600'}}>3. Defina o Foco:</Text> Leve sua atenção para onde sente a respiração (narinas, peito ou abdômen).{"\n\n"}
<Text style={{fontWeight:'600'}}>4. Observe:</Text> Simplesmente observe cada inspiração e expiração sem mudar o ritmo.{"\n\n"}
<Text style={{fontWeight:'600'}}>5. Atenção aos Pensamentos:</Text> Se distrair, gentilmente traga a atenção de volta para a respiração.{"\n\n"}
<Text style={{fontWeight:'600'}}>6. Fim:</Text> Quando terminar, abra os olhos lentamente.</Text>
                <Text style={{color:'#007AFF',marginTop:12,textDecorationLine:'underline'}} onPress={()=>window.open('https://www.youtube.com/results?search_query=meditação+respiração+3+minutos','_blank')}>Ver meditações guiadas no YouTube</Text>
              </View>
            )}

            {meditationModal.meditation?.id === 'm2' && (
              <View style={{marginTop:12}}>
                <Text style={{color:'#fff',fontWeight:'600',marginBottom:8}}>Foco Breve (5 minutos) - Meditação Guiada</Text>
                <Text style={{color:'#9CA3AF',fontSize:13,lineHeight:20}}>
<Text style={{fontWeight:'600'}}>1. Preparação:</Text> Sente-se ou deite-se confortavelmente.{"\n\n"}
<Text style={{fontWeight:'600'}}>2. Aterramento:</Text> Conecte-se com o momento presente, notando onde seu corpo toca a superfície.{"\n\n"}
<Text style={{fontWeight:'600'}}>3. Definindo a Intenção:</Text> Defina uma intenção de focar e estar presente.{"\n\n"}
<Text style={{fontWeight:'600'}}>4. Foco Central:</Text> Escolha um objeto de foco (respiração, sensação corporal ou palavra).{"\n\n"}
<Text style={{fontWeight:'600'}}>5. Prática de Retorno:</Text> Quando a mente divagar, gentilmente retorne ao foco.{"\n\n"}
<Text style={{fontWeight:'600'}}>6. Conclusão:</Text> Traga consciência para o entorno antes de se levantar.</Text>
                <Text style={{color:'#007AFF',marginTop:12,textDecorationLine:'underline'}} onPress={()=>window.open('https://www.youtube.com/results?search_query=meditação+foco+5+minutos+guiada','_blank')}>Ver meditações guiadas no YouTube</Text>
              </View>
            )}

            {meditationModal.meditation?.id === 'm3' && (
              <View style={{marginTop:12}}>
                <Text style={{color:'#fff',fontWeight:'600',marginBottom:8}}>Relaxamento (8 minutos) - Body Scan Guiado</Text>
                <Text style={{color:'#9CA3AF',fontSize:13,lineHeight:20}}>
<Text style={{fontWeight:'600'}}>1. Deitar-se:</Text> Deite-se de barriga para cima ou sente-se confortavelmente.{"\n\n"}
<Text style={{fontWeight:'600'}}>2. Ponto de Partida:</Text> Leve a atenção para os dedos dos pés.{"\n\n"}
<Text style={{fontWeight:'600'}}>3. Escaneamento:</Text> Mova a atenção lentamente pelo corpo: pés → pernas → tronco → braços → pescoço → cabeça.{"\n\n"}
<Text style={{fontWeight:'600'}}>4. Liberação da Tensão:</Text> Em cada área, observe tensões e solte-as a cada expiração.{"\n\n"}
<Text style={{fontWeight:'600'}}>5. Relaxamento Total:</Text> Nos minutos finais, sinta o corpo inteiro relaxado.{"\n\n"}
<Text style={{fontWeight:'600'}}>6. Retorno:</Text> Mova dedos, espreguice-se e levante-se lentamente.</Text>
                <Text style={{color:'#007AFF',marginTop:12,textDecorationLine:'underline'}} onPress={()=>window.open('https://www.youtube.com/results?search_query=body+scan+meditação+8+minutos','_blank')}>Ver meditações guiadas no YouTube</Text>
              </View>
            )}

            <View style={{marginTop:16,flexDirection:'row',justifyContent:'space-between'}}>
              <Button variant="secondary" onPress={()=>setMeditationModal({visible:false,meditation:null})}>Fechar</Button>
              <Button onPress={()=>meditationModal.meditation && startMeditationTimer(meditationModal.meditation)}>Iniciar Cronômetro ({meditationModal.meditation?.minutes}m)</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation modal */}
      <Modal visible={confirmModal.visible} animationType="fade" transparent onRequestClose={()=>setConfirmModal({visible:false,message:'',onConfirm:()=>{}})}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',alignItems:'center',padding:20}}>
          <View style={{backgroundColor:'#0F1720',borderRadius:12,padding:20,minWidth:280}}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:16,marginBottom:16}}>{confirmModal.message}</Text>
            <View style={{flexDirection:'row',justifyContent:'flex-end',gap:12}}>
              <Button variant="secondary" onPress={()=>setConfirmModal({visible:false,message:'',onConfirm:()=>{}})}>Cancelar</Button>
              <Button variant="danger" onPress={confirmModal.onConfirm}>Apagar</Button>
            </View>
          </View>
        </View>
      </Modal>

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
          {/* Relatórios & Insights moved to be before Pausas estruturadas */}
          <View style={{marginTop:12}}>
            <Text style={styles.section}>Relatórios & Insights</Text>
            <Insights entries={entries} />
            <Button variant="secondary" style={{marginTop:8}} onPress={()=>{ setShowSupportModal(true); }}>Acesso rápido a suporte</Button>
          </View>

          {/* Pausas estruturadas */}
          <View style={{marginTop:12}}>
            <Text style={styles.section}>Pausas estruturadas</Text>
            <Text style={styles.small}>Lembretes suaves para pausas e micro-exercícios.</Text>
            <View style={{flexDirection:'row',marginTop:8,justifyContent:'flex-start',flexWrap:'wrap',alignItems:'center'}}>
              {[30,45,60,90].map(m => (
                <TouchableOpacity key={m} style={[styles.presetBtn, breakIntervalMin===m && styles.presetActive]} onPress={()=>setBreakInterval(m)} hitSlop={{top:8,left:8,right:8,bottom:8}}><Text style={{color: breakIntervalMin===m ? '#fff' : '#9CA3AF'}}>{m}m</Text></TouchableOpacity>
              ))}
              <TextInput placeholder="Horário (HH:MM)" placeholderTextColor="#9CA3AF" value={breakTime} onChangeText={setBreakTime} style={[styles.smallInput,{width:120,marginLeft:8,marginRight:8}]} />
              <TextInput placeholder="Duração (min)" placeholderTextColor="#9CA3AF" value={breakDurationInput} onChangeText={setBreakDurationInput} keyboardType="number-pad" style={[styles.smallInput,{width:100,marginRight:8}]} />
              <Button style={{marginRight:8}} onPress={()=>scheduleBreakAt(breakTime, parseInt(breakDurationInput||'5',10)||5)}>Agendar por horário</Button>
              <Button variant="secondary" onPress={()=>scheduleBreakNow()}>Agendar pausa de agora</Button>
            </View>

            {/* Break history */}
            <View style={{marginTop:12}}>
              <Text style={styles.small}>Histórico de pausas</Text>
              <FlatList data={breakHistory} keyExtractor={b=>b.id} renderItem={({item})=> (
                <View style={[styles.row,{paddingVertical:10}]}> 
                  <View style={{flex:1}}>
                    <Text style={{color:'#fff'}}>Pausa: {new Date(item.startAt).toLocaleString()}</Text>
                    <Text style={{color:'#9CA3AF'}}>Duração: {item.durationMin} min</Text>
                  </View>
                  <TouchableOpacity onPress={()=>deleteBreakItem(item.id)} style={{padding:8}}>
                    <Text style={{color:'#FF3B30',fontWeight:'600'}}>Apagar</Text>
                  </TouchableOpacity>
                </View>
              )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhuma pausa registrada</Text>} />
            </View>
          </View>
        </View>

        <View style={[styles.col, isSmall ? {marginTop:12} : styles.midCol]}>
          {/* Mood tracker */}
          <Text style={styles.section}>Diário de Humor</Text>
          <Text style={styles.small}>Registre seu humor (1 a 5) e uma nota curta.</Text>
          <MoodEntryForm onSave={(v,n)=>addMood(v,n)} />
          <Text style={{color:'#9CA3AF',marginTop:8}}>Últimos registros</Text>
          <FlatList data={entries} keyExtractor={e=>e.id} renderItem={({item})=> (
            <View style={styles.row}><View style={{flex:1}}><Text style={{color:'#fff'}}>Humor: {item.value}</Text><Text style={{color:'#9CA3AF'}}>{new Date(item.date).toLocaleString()}</Text>{item.note && <Text style={{color:'#fff',marginTop:6}}>Nota: {item.note}</Text>}</View><TouchableOpacity onPress={()=>deleteMoodEntry(item.id)} style={{padding:8}}>
                    <Text style={{color:'#FF3B30',fontWeight:'600'}}>Apagar</Text>
                  </TouchableOpacity></View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhum registro</Text>} />
        </View>

        {/* right column removed - insights moved into the Minimedições & Mindfulness block */}
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

const MoodEntryForm: React.FC<{ onSave:(v:number,n?:string)=>void }> = ({ onSave }) => {
  const [value, setValue] = useState('4');
  const [note, setNote] = useState('');
  return (
    <View style={{marginTop:8}}>
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <View style={{flexDirection:'row'}}>
          {[1,2,3,4,5].map(n=> (
            <TouchableOpacity key={n} style={[styles.presetBtn, String(n)===value && styles.presetActive]} onPress={()=>setValue(String(n))}><Text style={{color: String(n)===value ? '#fff' : '#9CA3AF'}}>{n}</Text></TouchableOpacity>
          ))}
        </View>
        <TextInput placeholder="Nota curta" placeholderTextColor="#9CA3AF" value={note} onChangeText={setNote} style={[styles.smallInput,{flex:1,marginLeft:8}]} />
        <Button style={{marginLeft:8}} onPress={()=>{ onSave(parseInt(value,10), note); setNote(''); setValue('4'); }}>Salvar</Button>
      </View>
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
