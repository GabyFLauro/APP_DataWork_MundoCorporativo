import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import theme from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const TASKS_KEY = 'datawork_tasks_v1';
const GOALS_KEY = 'datawork_goals_v1';
const FOCUS_KEY = 'datawork_focus_sessions_v1';
const WELL_KEY = 'datawork_wellbeing_v1';

const CentralDashboardScreen: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [focus, setFocus] = useState<any[]>([]);
  const [well, setWell] = useState<any[]>([]);
  const navigation = useNavigation<any>();

  // Recarrega dados toda vez que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    try {
      const [tRaw, gRaw, fRaw, wRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(GOALS_KEY),
        AsyncStorage.getItem(FOCUS_KEY),
        AsyncStorage.getItem(WELL_KEY),
      ]);
      setTasks(tRaw ? JSON.parse(tRaw) : []);
      setGoals(gRaw ? JSON.parse(gRaw) : []);
      setFocus(fRaw ? JSON.parse(fRaw) : []);
      setWell(wRaw ? JSON.parse(wRaw) : []);
    } catch (e) { console.warn(e); }
  };

  const totalFocusToday = () => {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    return focus.filter(s => new Date(s.startedAt) >= startOfDay).reduce((acc, s) => acc + (s.durationSec||0), 0);
  };

  const goalsCompleted = goals.filter(g => g.completed).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel Central — DataWork</Text>
      <Text style={styles.subtitle}>Resumo rápido das suas métricas</Text>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tarefas</Text>
          <Text style={styles.cardNumber}>{tasks.length}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DataWork')} style={styles.cardBtn}><Text style={styles.cardBtnText}>Ver tarefas</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meta(s)</Text>
          <Text style={styles.cardNumber}>{goals.length} ({goalsCompleted} concluídas)</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Goals')} style={styles.cardBtn}><Text style={styles.cardBtnText}>Ver metas</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Foco hoje</Text>
          <Text style={styles.cardNumber}>{Math.round((totalFocusToday()/60))} min</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FocusTracker')} style={styles.cardBtn}><Text style={styles.cardBtnText}>Abrir Focus</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bem-estar</Text>
          <Text style={styles.cardNumber}>{well[0] ? well[0].value : '-'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wellbeing')} style={styles.cardBtn}><Text style={styles.cardBtnText}>Ver histórico</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.section, {marginTop:12}]}>Últimas tarefas</Text>
      <FlatList data={tasks.slice(0,5)} keyExtractor={i=>i.id} renderItem={({item})=> (
        <TouchableOpacity style={styles.taskRow} onPress={()=>navigation.navigate('TaskDetail',{taskId:item.id})}>
          <Text style={{color:theme.colors.text}}>{item.title}</Text>
          <Text style={{color:theme.colors.muted,fontSize:11}}>{item.status}</Text>
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={{color:theme.colors.muted}}>Sem tarefas</Text>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: theme.colors.muted, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: { flex: 1, backgroundColor: theme.colors.surface, padding: 12, borderRadius: 10, marginRight: 8 },
  cardTitle: { color: theme.colors.muted, fontSize: 12 },
  cardNumber: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
  cardBtn: { marginTop: 8, backgroundColor: theme.colors.card, padding: 8, borderRadius: 8, alignItems: 'center' },
  cardBtnText: { color: theme.colors.text },
  section: { color: theme.colors.text, fontWeight: '700', marginTop: 8 },
  taskRow: { padding: 10, backgroundColor: theme.colors.card, marginTop: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});

export default CentralDashboardScreen;
