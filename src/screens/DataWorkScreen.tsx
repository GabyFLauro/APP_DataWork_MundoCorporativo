import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import theme from '../styles/theme';

type TaskStatus = 'completed' | 'in-progress' | 'pending';

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: number;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  subtasks?: Array<{ id: string; title: string; done: boolean }>;
  timeSpentSec?: number;
  tags?: string[];
  attachments?: string[];
  assignees?: string[];
  projectId?: string | null;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number; attachments?: string[] }>;
  completedAt?: number | null;
};

const STORAGE_KEY = 'datawork_tasks_v1';

const { width } = Dimensions.get('window');

const DataWorkScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation: any = useNavigation();
  const [viewMode, setViewMode] = useState<'list'|'kanban'|'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Save whenever tasks change
    if (!loading) saveTasks(tasks);
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        setTasks(parsed);
      }
    } catch (err) {
      console.warn('Erro ao carregar tarefas', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (items: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Erro ao salvar tarefas', err);
    }
  };

  const addTask = () => {
    if (!title.trim()) {
      Alert.alert('Validação', 'Digite o título da tarefa');
      return;
    }
    try {
      const newTask: Task = {
        id: String(Date.now()),
        title: title.trim(),
        status: 'pending',
        createdAt: Date.now(),
        dueDate: dueDate.trim() || null,
        priority: 'medium',
        notes: '',
        subtasks: [],
        timeSpentSec: 0,
        tags: [],
        attachments: [],
        completedAt: null,
      };
      console.log('Adicionando tarefa:', newTask);
      setTasks(prevTasks => {
        const updated = [newTask, ...prevTasks];
        console.log('Tarefas atualizadas:', updated.length);
        return updated;
      });
      setTitle('');
      setDueDate('');
      console.log('Tarefa adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a tarefa: ' + error);
    }
  };

  const [statusFilter, setStatusFilter] = React.useState<'all'|'pending'|'in-progress'|'completed'>('all');

  const filteredTasks = tasks.filter(t => {
    // Only apply status filter in list view; text search removed per request
    if (viewMode === 'list') {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    }
    return true;
  });

  const removeTask = (id: string) => {
    Alert.alert('Remover', 'Remover esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setTasks(tasks.filter(t => t.id !== id)) },
    ]);
  };

  const cycleStatus = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const next: TaskStatus = t.status === 'pending' ? 'in-progress' : t.status === 'in-progress' ? 'completed' : 'pending';
        const updated: Task = { ...t, status: next } as Task;
        if (next === 'completed') updated.completedAt = Date.now();
        if (next !== 'completed') updated.completedAt = null;
        return updated;
      }),
    );
  };

  const counts = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { completed: 0, 'in-progress': 0, pending: 0 } as Record<string, number>,
  );

  const chartData = [
    {
      name: 'Concluídas',
      count: counts.completed || 0,
      color: theme.colors.success,
      legendFontColor: theme.colors.muted,
      legendFontSize: 12,
    },
    {
      name: 'Em andamento',
      count: counts['in-progress'] || 0,
      color: theme.colors.warning,
      legendFontColor: theme.colors.muted,
      legendFontSize: 12,
    },
    {
      name: 'Pendente',
      count: counts.pending || 0,
      color: theme.colors.danger,
      legendFontColor: theme.colors.muted,
      legendFontSize: 12,
    },
  ].filter(d => d.count > 0);

  const safeChartData = chartData.length > 0 ? chartData : [];

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: theme.colors.text}}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header removed as requested */}

      {/* Links rápidos movidos para o Painel Central (CentralDashboard) */}

      <View style={{marginBottom:8}}>
        <Text style={{color:theme.colors.text,fontWeight:'700',marginBottom:8}}>Adicionar Tarefa</Text>
        <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap'}}>
          <TextInput 
            placeholder="Nova tarefa (ex: Estudar 1h)" 
            style={[styles.input,{flex:1,minWidth:200}]} 
            value={title} 
            onChangeText={setTitle} 
          />
          <TextInput 
            placeholder="Data (DD/MM/AAAA)" 
            style={[styles.input,{width:150,marginLeft:8}]} 
            value={dueDate} 
            onChangeText={setDueDate}
          />
          <TouchableOpacity 
            style={[styles.addButton,{marginLeft:8}]} 
            onPress={addTask}
          >
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <View style={{flex:1,marginRight:8}} />
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <TouchableOpacity style={[styles.viewBtn, viewMode==='list'&&styles.viewBtnActive]} onPress={()=>setViewMode('list')}><Text style={styles.viewText}>Lista</Text></TouchableOpacity>
        </View>
      </View>

      {/* Status filter when in list view */}
      {viewMode === 'list' && (
        <View style={{flexDirection:'row',marginBottom:8}}>
          {(['all','pending','in-progress','completed'] as const).map(s=> (
            <TouchableOpacity key={s} style={[styles.viewBtn, statusFilter===s&&styles.viewBtnActive, {marginRight:8}]} onPress={()=>setStatusFilter(s as any)}>
              <Text style={styles.viewText}>{s === 'all' ? 'Todos' : s === 'in-progress' ? 'Em andamento' : s === 'completed' ? 'Concluídas' : 'Pendente'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.chartBox}>
        <Text style={styles.sectionTitle}>Resumo de Tarefas</Text>
        <View style={{marginTop: 12}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8}}>
            <View style={{alignItems: 'center', paddingHorizontal: 16}}>
              <Text style={{color: theme.colors.success, fontSize: 24, fontWeight: 'bold'}}>{counts.completed || 0}</Text>
              <Text style={{color: theme.colors.text, fontSize: 12, marginTop: 4}}>Concluídas</Text>
            </View>
            <View style={{alignItems: 'center', paddingHorizontal: 16}}>
              <Text style={{color: theme.colors.warning, fontSize: 24, fontWeight: 'bold'}}>{counts['in-progress'] || 0}</Text>
              <Text style={{color: theme.colors.text, fontSize: 12, marginTop: 4}}>Em andamento</Text>
            </View>
            <View style={{alignItems: 'center', paddingHorizontal: 16}}>
              <Text style={{color: theme.colors.danger, fontSize: 24, fontWeight: 'bold'}}>{counts.pending || 0}</Text>
              <Text style={{color: theme.colors.text, fontSize: 12, marginTop: 4}}>Pendentes</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tarefas</Text>
      {viewMode === 'list' && (
        <FlatList
          data={filteredTasks}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa ainda</Text>}
          renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <View style={styles.taskLeft}>
              <TouchableOpacity onPress={() => cycleStatus(item.id)} style={styles.statusButton}>
                <Text style={styles.statusText}>
                  {item.status === 'completed' ? '✓' : item.status === 'in-progress' ? '…' : '○'}
                </Text>
              </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })} style={styles.taskMeta}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskSubtitle}>Criada: {new Date(item.createdAt).toLocaleString()}</Text>
                {item.completedAt ? <Text style={[styles.taskSubtitle,{color:theme.colors.success}]}>Concluída: {new Date(item.completedAt).toLocaleString()}</Text> : item.dueDate ? <Text style={[styles.taskSubtitle,{color:theme.colors.warning}]}>Due: {item.dueDate}</Text> : null}
                {item.priority ? <Text style={[styles.taskSubtitle,{color:theme.colors.muted}]}>Priority: {item.priority}</Text> : null}
              </TouchableOpacity>
            </View>
            <View style={styles.taskRight}>
                <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })} style={{marginBottom:8}}>
                  <Ionicons name="create-outline" size={20} color={theme.colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeTask(item.id)}>
                  <Ionicons name="trash" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>
          </View>
        )}
        />
      )}

      {viewMode === 'kanban' && (
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          {(['pending','in-progress','completed'] as TaskStatus[]).map(col => (
            <View key={col} style={{flex:1,marginHorizontal:4}}>
              <Text style={{color: theme.colors.text, fontWeight:'700', marginBottom:8, textTransform:'capitalize'}}>{col.replace('-',' ')}</Text>
              {filteredTasks.filter(t=>t.status===col).map(t=> (
                <View key={t.id} style={{backgroundColor:theme.colors.surface,padding:8,borderRadius:8,marginBottom:8}}>
                  <Text style={{color:theme.colors.text}}>{t.title}</Text>
                  <View style={{flexDirection:'row',marginTop:8}}>
                    <TouchableOpacity style={{marginRight:8}} onPress={()=>{cycleStatus(t.id)}}><Text style={{color:theme.colors.primary}}>Mover</Text></TouchableOpacity>
                    <TouchableOpacity onPress={()=>navigation.navigate('TaskDetail',{taskId:t.id})}><Text style={{color:theme.colors.warning}}>Editar</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {viewMode === 'calendar' && (
        <View>
          <View style={{flexDirection:'row',marginBottom:8}}>
            <TextInput placeholder="Selecionar data YYYY-MM-DD" style={[styles.input,{flex:1}]} value={selectedDate||''} onChangeText={setSelectedDate as any} />
            <TouchableOpacity style={[styles.addButton,{marginLeft:8}]} onPress={()=>setSelectedDate(null)}><Text style={{color: theme.colors.text}}>Limpar</Text></TouchableOpacity>
          </View>
          <FlatList data={filteredTasks.filter(t => !selectedDate || t.dueDate === selectedDate)} keyExtractor={i=>i.id} renderItem={({item})=> (
            <View style={styles.taskRow}>
              <View style={styles.taskLeft}>
                <TouchableOpacity onPress={() => cycleStatus(item.id)} style={styles.statusButton}><Text style={styles.statusText}>{item.status === 'completed' ? '✓' : item.status === 'in-progress' ? '…' : '○'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })} style={styles.taskMeta}><Text style={styles.taskTitle}>{item.title}</Text><Text style={styles.taskSubtitle}>{item.dueDate}</Text></TouchableOpacity>
              </View>
            </View>
          )} ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa nesta data</Text>} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  header: { marginBottom: 12 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  formRow: { flexDirection: 'row', marginTop: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: theme.colors.card, color: theme.colors.text, paddingHorizontal: 12, borderRadius: 8, height: 44 },
  addButton: { width: 44, height: 44, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8, borderRadius: 8 },
  chartBox: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyChart: { color: theme.colors.muted },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginVertical: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 8 },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusText: { color: theme.colors.text },
  taskMeta: { flex: 1 },
  taskTitle: { color: theme.colors.text, fontSize: 14 },
  taskSubtitle: { color: theme.colors.muted, fontSize: 11 },
  taskRight: { marginLeft: 8 },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 8 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { flex: 1, backgroundColor: theme.colors.card, padding: 10, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  navText: { color: theme.colors.text, fontWeight: '600' },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.card, borderRadius: 8, marginLeft: 6 },
  viewBtnActive: { backgroundColor: theme.colors.primary },
  viewText: { color: theme.colors.text, fontWeight: '600' },
});

export default DataWorkScreen;
