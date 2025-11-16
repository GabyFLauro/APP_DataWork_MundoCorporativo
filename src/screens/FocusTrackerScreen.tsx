import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import theme from '../styles/theme';

const FocusTrackerScreen: React.FC = () => {
  const { secondsLeft, running, focusMinutes, sessions, setFocusMinutes, start, stop, totalFocusedToday } = useFocusTimer();

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Title removed per request */}
      <Text style={styles.timer}>{fmt(secondsLeft)}</Text>

      <View style={{flexDirection:'row',justifyContent:'center',marginBottom:12}}>
        {[15,20,25,30,45,60].map(m=> (
          <TouchableOpacity key={m} style={[styles.presetBtn, focusMinutes===m && styles.presetActive]} onPress={()=>{ if(!running) setFocusMinutes(m); }}>
            <Text style={{color: focusMinutes===m ? theme.colors.text : theme.colors.muted}}>{m}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',marginBottom:12}}>
        <Text style={{color:theme.colors.muted,marginRight:8}}>Minutos:</Text>
        <TextInput value={String(focusMinutes)} onChangeText={(t)=>{
          const v = parseInt(t||'0',10);
          if (!isNaN(v) && v>0) setFocusMinutes(v);
        }} keyboardType="number-pad" style={styles.minuteInput} editable={!running} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, running && styles.btnDisabled]} onPress={start} disabled={running}>
          <Text style={styles.btnText}>Iniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, !running && styles.btnDisabled]} onPress={stop} disabled={!running}>
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
  container: { flex:1, padding:16, backgroundColor: theme.colors.background },
  title: { color:theme.colors.text, fontSize:18, fontWeight:'700', marginBottom:12 },
  timer: { color:theme.colors.text, fontSize:48, textAlign:'center', marginVertical:12 },
  controls: { flexDirection:'row', justifyContent:'center', gap:12, marginBottom:12 },
  btn: { backgroundColor:theme.colors.primary, paddingHorizontal:20, paddingVertical:10, borderRadius:8, marginHorizontal:8 },
  btnDisabled: { opacity:0.5 },
  btnText: { color:theme.colors.text, fontWeight:'600' },
  summary: { marginTop:16 },
  summaryText: { color:theme.colors.muted },
  link: { color:theme.colors.primary, marginTop:8 }
  ,presetBtn: { paddingHorizontal:10, paddingVertical:8, borderRadius:8, backgroundColor:theme.colors.card, marginHorizontal:6 }
  ,presetActive: { backgroundColor:theme.colors.primary }
  ,minuteInput: { backgroundColor:theme.colors.card, color:theme.colors.text, paddingHorizontal:8, paddingVertical:6, borderRadius:8, width:80, textAlign:'center' }
});

export default FocusTrackerScreen;
