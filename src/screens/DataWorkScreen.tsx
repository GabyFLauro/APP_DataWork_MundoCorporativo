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
  const [tagText, setTagText] = useState('');
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
    if (!title.trim()) return Alert.alert('Validação', 'Digite o título da tarefa');
    const newTask: Task = {
      id: String(Date.now()),
      title: title.trim(),
      status: 'pending',
      createdAt: Date.now(),
      dueDate: null,
      priority: 'medium',
      notes: '',
      subtasks: [],
      timeSpentSec: 0,
      tags: tagText.split(',').map(t=>t.trim()).filter(Boolean),
      attachments: [],
      completedAt: null,
    };
    setTasks([newTask, ...tasks]);
    setTitle('');
    setTagText('');
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
      count: counts.completed,
      color: '#34C759',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Em andamento',
      count: counts['in-progress'],
      color: '#FFCC00',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Pendente',
      count: counts.pending,
      color: '#FF3B30',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(d => d.count > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DataWork — Dashboard Pessoal</Text>
        <Text style={styles.subtitle}>Transforme tarefas em insights (persistido localmente)</Text>
      </View>

      {/* Links rápidos movidos para o Painel Central (CentralDashboard) */}

      <View style={{marginBottom:8}}>
        <View style={{flexDirection:'row'}}>
          <TextInput placeholder="Nova tarefa (ex: Estudar 1h)" style={[styles.input,{flex:1}]} value={title} onChangeText={setTitle} />
          <TouchableOpacity style={styles.addButton} onPress={addTask}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row',marginTop:8}}>
          <TextInput placeholder="Tags (comma separated)" style={[styles.input,{flex:1,marginRight:8}]} value={tagText} onChangeText={setTagText} />
          <TouchableOpacity style={[styles.addButton,{backgroundColor:'#6B7280'}]} onPress={()=>{setTagText('');}}><Text style={{color:'#fff'}}>Limpar</Text></TouchableOpacity>
        </View>
      </View>

      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <View style={{flex:1,marginRight:8}} />
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <TouchableOpacity style={[styles.viewBtn, viewMode==='list'&&styles.viewBtnActive]} onPress={()=>setViewMode('list')}><Text style={styles.viewText}>Lista</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewBtn, viewMode==='kanban'&&styles.viewBtnActive]} onPress={()=>setViewMode('kanban')}><Text style={styles.viewText}>Kanban</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewBtn, viewMode==='calendar'&&styles.viewBtnActive]} onPress={()=>setViewMode('calendar')}><Text style={styles.viewText}>Calendário</Text></TouchableOpacity>
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
        {chartData.length > 0 ? (
          <PieChart
            data={chartData.map(d => ({ name: d.name, population: d.count, color: d.color, legendFontColor: d.legendFontColor, legendFontSize: d.legendFontSize }))}
            width={Math.min(width - 40, 360)}
            height={180}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={styles.emptyChart}>Sem dados para mostrar — adicione tarefas</Text>
        )}
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
                {item.completedAt ? <Text style={[styles.taskSubtitle,{color:'#34C759'}]}>Concluída: {new Date(item.completedAt).toLocaleString()}</Text> : item.dueDate ? <Text style={[styles.taskSubtitle,{color:'#FFD700'}]}>Due: {item.dueDate}</Text> : null}
                {item.priority ? <Text style={[styles.taskSubtitle,{color:'#9CA3AF'}]}>Priority: {item.priority}</Text> : null}
              </TouchableOpacity>
            </View>
            <View style={styles.taskRight}>
                <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })} style={{marginBottom:8}}>
                  <Ionicons name="create-outline" size={20} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeTask(item.id)}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
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
              <Text style={{color:'#fff',fontWeight:'700',marginBottom:8,textTransform:'capitalize'}}>{col.replace('-',' ')}</Text>
              {filteredTasks.filter(t=>t.status===col).map(t=> (
                <View key={t.id} style={{backgroundColor:'#0B1220',padding:8,borderRadius:8,marginBottom:8}}>
                  <Text style={{color:'#fff'}}>{t.title}</Text>
                  <View style={{flexDirection:'row',marginTop:8}}>
                    <TouchableOpacity style={{marginRight:8}} onPress={()=>{cycleStatus(t.id)}}><Text style={{color:'#007AFF'}}>Mover</Text></TouchableOpacity>
                    <TouchableOpacity onPress={()=>navigation.navigate('TaskDetail',{taskId:t.id})}><Text style={{color:'#FFD700'}}>Editar</Text></TouchableOpacity>
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
            <TouchableOpacity style={[styles.addButton,{marginLeft:8}]} onPress={()=>setSelectedDate(null)}><Text style={{color:'#fff'}}>Limpar</Text></TouchableOpacity>
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
  container: { flex: 1, padding: 16, backgroundColor: '#0F1720' },
  header: { marginBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  formRow: { flexDirection: 'row', marginTop: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#111827', color: '#fff', paddingHorizontal: 12, borderRadius: 8, height: 44 },
  addButton: { width: 44, height: 44, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginLeft: 8, borderRadius: 8 },
  chartBox: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyChart: { color: '#9CA3AF' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginVertical: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#0B1220', borderRadius: 8, marginBottom: 8 },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusText: { color: '#fff' },
  taskMeta: { flex: 1 },
  taskTitle: { color: '#fff', fontSize: 14 },
  taskSubtitle: { color: '#9CA3AF', fontSize: 11 },
  taskRight: { marginLeft: 8 },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { flex: 1, backgroundColor: '#111827', padding: 10, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  navText: { color: '#fff', fontWeight: '600' },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#111827', borderRadius: 8, marginLeft: 6 },
  viewBtnActive: { backgroundColor: '#007AFF' },
  viewText: { color: '#fff', fontWeight: '600' },
});

export default DataWorkScreen;
