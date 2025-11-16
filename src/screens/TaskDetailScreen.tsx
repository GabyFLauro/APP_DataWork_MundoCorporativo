import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
import theme from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type Task = {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  createdAt: number;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  subtasks?: Array<{ id: string; title: string; done: boolean }>;
  timeSpentSec?: number;
  attachments?: string[];
  assignees?: string[];
  projectId?: string | null;
  comments?: Array<{ id: string; author: string; text: string; timestamp: number; attachments?: string[] }>;
};

const STORAGE_KEY = 'datawork_tasks_v1';

type Route = RouteProp<RootStackParamList, 'TaskDetail'>;

const TaskDetailScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const taskId = route.params?.taskId;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    load();
    return () => { stopTimer(); };
  }, []);

  const load = async () => {
    try{
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if(!raw) return setLoading(false);
      const arr: Task[] = JSON.parse(raw);
      const t = arr.find(x=>x.id===taskId) || null;
      setTask(t);
    }catch(e){console.warn(e)}
    finally{setLoading(false)}
  };

  const saveTask = async (updated: Task) => {
    try{
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr: Task[] = raw ? JSON.parse(raw) : [];
      const newArr = arr.map(a => a.id === updated.id ? updated : a);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newArr));
      setTask(updated);
    }catch(e){console.warn(e)}
  };

  const setField = (k: keyof Task, v: any) => {
    if (!task) return;
    const updated = { ...task, [k]: v } as Task;
    saveTask(updated);
  };

  const addSubtask = (title: string) => {
    if(!task) return;
    const st = task.subtasks ? [...task.subtasks] : [];
    st.unshift({ id: String(Date.now()), title, done: false });
    saveTask({ ...task, subtasks: st });
  };

  const pickImage = async () => {
    if (!task) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permissão', 'Permissão para acessar a galeria é necessária');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const updated = { ...task, attachments: [...(task.attachments||[]), uri] } as Task;
      saveTask(updated);
    }
  };

  // Comments
  const [newComment, setNewComment] = React.useState('');

  const saveComment = async () => {
    if (!task) return;
    if (!newComment.trim()) return;
    const comment = { id: String(Date.now()), author: 'Me', text: newComment.trim(), timestamp: Date.now(), attachments: [] };
    const updated = { ...task, comments: [...(task.comments||[]), comment] } as Task;
    await saveTask(updated);
    // push inbox notifications for assignees
    try{
      const raw = await AsyncStorage.getItem('datawork_inbox_v1');
      const inbox = raw ? JSON.parse(raw) : [];
      const recipients = task.assignees && task.assignees.length>0 ? task.assignees : ['me'];
      recipients.forEach(r => {
        inbox.unshift({ id: String(Date.now()) + '_' + r, type: 'comment', message: `${'Me'} comentou em ${task.title}`, relatedTaskId: task.id, targetUser: r, read: false, timestamp: Date.now() });
      });
      await AsyncStorage.setItem('datawork_inbox_v1', JSON.stringify(inbox));
    }catch(e){console.warn(e)}

    setNewComment('');
  };

  const toggleSubtask = (id: string) => {
    if(!task || !task.subtasks) return;
    const st = task.subtasks.map(s=> s.id===id ? { ...s, done: !s.done } : s);
    saveTask({ ...task, subtasks: st });
  };

  const deleteSubtask = (id: string) => {
    if(!task || !task.subtasks) return;
    const st = task.subtasks.filter(s=> s.id !== id);
    saveTask({ ...task, subtasks: st });
  };

  const startTimer = () => {
    if(!task) return;
    if (runningRef.current) return;
    runningRef.current = true;
    timerRef.current = setInterval(() => {
      setTask(prev => {
        if (!prev) return prev;
        const ts = (prev.timeSpentSec || 0) + 1;
        const updated = { ...prev, timeSpentSec: ts };
        // save occasionally
        if (ts % 5 === 0) saveTask(updated);
        return updated;
      });
    }, 1000) as unknown as number;
  };

  const stopTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    runningRef.current = false;
    if (task) await saveTask(task);
  };

  if (!task && !loading) return (
    // If no task found but no taskId was provided, show a simple create form
    !taskId ? (
      <View style={styles.container}>
        <Text style={styles.title}>Criar nova tarefa</Text>
        <Text style={styles.label}>Título</Text>
        <TextInput placeholder="Título da tarefa" placeholderTextColor={theme.colors.muted} value={newTitle} onChangeText={setNewTitle} style={styles.input} />
        <View style={{flexDirection:'row',marginTop:12}}>
          <TouchableOpacity style={styles.btn} onPress={async ()=>{
            if(!newTitle.trim()) return Alert.alert('Validação','Digite o título da tarefa');
            try{
              const raw = await AsyncStorage.getItem(STORAGE_KEY);
              const arr: Task[] = raw ? JSON.parse(raw) : [];
              const created: Task = { id: String(Date.now()), title: newTitle.trim(), status: 'pending', createdAt: Date.now(), dueDate: null, priority: 'medium', notes: '', subtasks: [], timeSpentSec: 0, attachments: [], assignees: [], comments: [] } as Task;
              arr.unshift(created);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
              setNewTitle('');
              // navigate to the detail of the created task
              navigation.navigate('TaskDetail', { taskId: created.id });
            }catch(e){console.warn(e); Alert.alert('Erro','Não foi possível criar a tarefa')}
          }}><Text style={{color:theme.colors.text}}>Criar</Text></TouchableOpacity>
        </View>
      </View>
    ) : (
      <View style={styles.container}><Text style={{color:theme.colors.text}}>Tarefa não encontrada</Text></View>
    )
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task?.title}</Text>
      <View style={{flexDirection:'row',alignItems:'flex-start'}}>
        <View style={{flex:1,marginRight:12}}>
          <Text style={styles.label}>Data de Conclusão (Due Date)</Text>
          <TextInput style={styles.input} value={task?.dueDate||''} placeholder="DD/MM/AAAA" onChangeText={(v)=>setField('dueDate', v)} placeholderTextColor={theme.colors.muted} />
        </View>
        <View style={{flex:1,marginRight:12,alignItems:'center'}}>
          <Text style={styles.label}>Prioridade (Priority)</Text>
          <View style={{flexDirection:'row',justifyContent:'center'}}>
            {(['low','medium','high'] as Task['priority'][]).map(p=> (
              <TouchableOpacity key={p} style={[styles.tag, task?.priority===p && styles.tagActive]} onPress={()=>setField('priority', p)}>
                <Text style={{color:theme.colors.text,fontSize:11}}>{p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{flex:1,alignItems:'center'}}>
          <Text style={styles.label}>Cronômetro (Timer)</Text>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:4,justifyContent:'center'}}>
            <TouchableOpacity style={[styles.btn,{paddingVertical:6,paddingHorizontal:8}]} onPress={startTimer}><Text style={{color:theme.colors.text,fontSize:11}}>Iniciar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, {marginLeft:4,paddingVertical:6,paddingHorizontal:8}]} onPress={stopTimer}><Text style={{color:theme.colors.text,fontSize:11}}>Parar</Text></TouchableOpacity>
          </View>
          <Text style={{color:theme.colors.muted,fontSize:11,textAlign:'center'}}>Tempo: {Math.floor((task?.timeSpentSec||0)/60)}m {(task?.timeSpentSec||0)%60}s</Text>
        </View>
      </View>

      <View style={{flexDirection:'row',alignItems:'flex-start'}}>
        <View style={{flex:1,marginRight:12}}>
          <Text style={styles.label}>Notas (Notes)</Text>
          <TextInput style={[styles.input, {height:80}]} value={task?.notes||''} onChangeText={(v)=>setField('notes', v)} placeholderTextColor={theme.colors.muted} multiline />
        </View>
        <View style={{flex:1,marginRight:12}}>
          <Text style={styles.label}>Anexos (Attachments)</Text>
          <TouchableOpacity style={[styles.btn,{backgroundColor:theme.colors.primary,marginTop:8}]} onPress={pickImage}><Text style={{color:theme.colors.text,textAlign:'center'}}>Anexar imagem</Text></TouchableOpacity>
          <FlatList data={task?.attachments||[]} keyExtractor={a=>a} horizontal renderItem={({item})=> (
            <View style={{marginTop:8,marginRight:8,position:'relative'}}>
              <Image source={{uri:item}} style={{width:80,height:80,borderRadius:8}} />
              <TouchableOpacity 
                style={{position:'absolute',top:-8,right:-8,backgroundColor:theme.colors.danger,borderRadius:12,width:24,height:24,justifyContent:'center',alignItems:'center'}}
                onPress={()=>{
                  if(!task) return;
                  const updated = {...task, attachments: task.attachments?.filter(a=>a!==item)||[]};
                  saveTask(updated);
                }}
              >
                <Text style={{color:theme.colors.text,fontSize:16,fontWeight:'bold'}}>×</Text>
              </TouchableOpacity>
            </View>
          )} />
        </View>
        <View style={{flex:1}}>
          <Text style={styles.label}>Comentários (Comments)</Text>
          <FlatList data={task?.comments?.slice().reverse()||[]} keyExtractor={c=>c.id} renderItem={({item})=> (
            <View style={{backgroundColor:theme.colors.surface,padding:8,borderRadius:8,marginBottom:8}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <Text style={{color:theme.colors.text,fontWeight:'700'}}>{item.author}</Text>
                <Text style={{color:theme.colors.muted,fontWeight:'400',fontSize:11}}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <Text style={{color:theme.colors.text,marginTop:6}}>{item.text}</Text>
            </View>
          )} ListEmptyComponent={<Text style={{color:theme.colors.muted}}>Sem comentários</Text>} />
          <TextInput 
            placeholder="Adicionar comentário..." 
            placeholderTextColor={theme.colors.muted} 
            value={newComment} 
            onChangeText={setNewComment} 
            style={[styles.input,{marginTop:8}]} 
            multiline 
            onBlur={saveComment}
          />
        </View>
      </View>

      <Text style={styles.label}>Subtarefas (Subtasks)</Text>
      <View style={{flexDirection:'row',marginBottom:8}}>
        <TextInput 
          placeholder="Nova subtarefa..." 
          placeholderTextColor={theme.colors.muted} 
          value={newSubtaskTitle} 
          onChangeText={setNewSubtaskTitle} 
          style={[styles.input,{flex:1,marginRight:8}]} 
        />
        <TouchableOpacity 
          style={[styles.btn,{backgroundColor:theme.colors.primary}]} 
          onPress={()=>{
            if(newSubtaskTitle.trim()) {
              addSubtask(newSubtaskTitle.trim());
              setNewSubtaskTitle('');
            }
          }}
        >
          <Text style={{color:theme.colors.text}}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={task?.subtasks||[]} keyExtractor={s=>s.id} renderItem={({item})=> (
        <View style={[styles.subRow,{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}]}>
          <TouchableOpacity style={{flex:1}} onPress={()=>toggleSubtask(item.id)}>
            <Text style={{color:theme.colors.text}}>{item.done ? '✓' : '○'} {item.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>deleteSubtask(item.id)}>
            <Text style={{color:theme.colors.danger,fontSize:18,fontWeight:'bold'}}>×</Text>
          </TouchableOpacity>
        </View>
      )} ListEmptyComponent={<Text style={{color:theme.colors.muted}}>Sem subtarefas</Text>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:theme.colors.background},
  title:{color:theme.colors.text,fontSize:18,fontWeight:'700',marginBottom:8},
  label:{color:theme.colors.muted,marginTop:8,marginBottom:4},
  input:{backgroundColor:theme.colors.card,color:theme.colors.text,padding:8,borderRadius:8},
  tag:{padding:8,backgroundColor:theme.colors.border,borderRadius:8,marginRight:8},
  tagActive:{backgroundColor:theme.colors.primary},
  subRow:{padding:8,backgroundColor:theme.colors.surface,borderRadius:8,marginBottom:8},
  btn:{backgroundColor:theme.colors.success,padding:10,borderRadius:8}
});

export default TaskDetailScreen;
