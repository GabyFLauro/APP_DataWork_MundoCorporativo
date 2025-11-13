import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  id: string;
  startedAt: number;
  durationSec: number;
};

const STORAGE_KEY = 'datawork_focus_sessions_v1';

const FocusTrackerScreen: React.FC = () => {
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState(() => focusMinutes * 60); // Pomodoro default 25m
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    loadSessions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // save on change
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
  }, [sessions]);

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch (err) {
      console.warn(err);
    }
  };

  const start = () => {
    if (running) return;
    setRunning(true);
    startedAtRef.current = Date.now();
    // ensure secondsLeft is set to chosen duration when starting
    setSecondsLeft(focusMinutes * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          // finish
          stop(true);
          return focusMinutes * 60;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
  };

  const stop = (auto = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    const startedAt = startedAtRef.current;
    if (startedAt) {
      const durationSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const newSession: Session = { id: String(Date.now()), startedAt, durationSec };
      setSessions(s => [newSession, ...s]);
      startedAtRef.current = null;
      if (!auto) Alert.alert('Sessão salva', `Duração: ${Math.floor(durationSec/60)}m ${durationSec%60}s`);
    }
    setSecondsLeft(focusMinutes * 60);
  };

  const totalFocusedToday = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    return sessions.filter(s => s.startedAt >= startOfDay.getTime()).reduce((acc, s) => acc + s.durationSec, 0);
  };

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracker de Foco (Pomodoro)</Text>
      <Text style={styles.timer}>{fmt(secondsLeft)}</Text>

      <View style={{flexDirection:'row',justifyContent:'center',marginBottom:12}}>
        {[15,20,25,30,45,60].map(m=> (
          <TouchableOpacity key={m} style={[styles.presetBtn, focusMinutes===m && styles.presetActive]} onPress={()=>{ if(!running) setFocusMinutes(m); }}>
            <Text style={{color: focusMinutes===m ? '#fff' : '#9CA3AF'}}>{m}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',marginBottom:12}}>
        <Text style={{color:'#9CA3AF',marginRight:8}}>Minutos:</Text>
        <TextInput value={String(focusMinutes)} onChangeText={(t)=>{
          const v = parseInt(t||'0',10);
          if (!isNaN(v) && v>0) setFocusMinutes(v);
        }} keyboardType="number-pad" style={styles.minuteInput} editable={!running} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, running && styles.btnDisabled]} onPress={start} disabled={running}>
          <Text style={styles.btnText}>Iniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, !running && styles.btnDisabled]} onPress={() => stop(false)} disabled={!running}>
          <Text style={styles.btnText}>Parar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total focado hoje: {Math.floor(totalFocusedToday()/60)} min</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert('Histórico', `Sessões salvas: ${sessions.length}`);
        }}>
          <Text style={styles.link}>Ver histórico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor: '#0F1720' },
  title: { color:'#fff', fontSize:18, fontWeight:'700', marginBottom:12 },
  timer: { color:'#fff', fontSize:48, textAlign:'center', marginVertical:12 },
  controls: { flexDirection:'row', justifyContent:'center', gap:12, marginBottom:12 },
  btn: { backgroundColor:'#007AFF', paddingHorizontal:20, paddingVertical:10, borderRadius:8, marginHorizontal:8 },
  btnDisabled: { opacity:0.5 },
  btnText: { color:'#fff', fontWeight:'600' },
  summary: { marginTop:16 },
  summaryText: { color:'#9CA3AF' },
  link: { color:'#007AFF', marginTop:8 }
  ,presetBtn: { paddingHorizontal:10, paddingVertical:8, borderRadius:8, backgroundColor:'#111827', marginHorizontal:6 }
  ,presetActive: { backgroundColor:'#007AFF' }
  ,minuteInput: { backgroundColor:'#111827', color:'#fff', paddingHorizontal:8, paddingVertical:6, borderRadius:8, width:80, textAlign:'center' }
});

export default FocusTrackerScreen;
