import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
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
  const [commentAttachment, setCommentAttachment] = React.useState<string | null>(null);

  const pickCommentAttachment = async () => {
    if (!task) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permissão', 'Permissão para acessar a galeria é necessária');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCommentAttachment(result.assets[0].uri);
    }
  };

  const saveComment = async () => {
    if (!task) return;
    if (!newComment.trim() && !commentAttachment) return Alert.alert('Validação','Digite um comentário ou anexe uma imagem');
    const comment = { id: String(Date.now()), author: 'Me', text: newComment.trim(), timestamp: Date.now(), attachments: commentAttachment ? [commentAttachment] : [] };
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

    setNewComment(''); setCommentAttachment(null);
    Alert.alert('Sucesso','Comentário adicionado');
  };

  const toggleSubtask = (id: string) => {
    if(!task || !task.subtasks) return;
    const st = task.subtasks.map(s=> s.id===id ? { ...s, done: !s.done } : s);
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
        <TextInput placeholder="Título da tarefa" placeholderTextColor="#9CA3AF" value={newTitle} onChangeText={setNewTitle} style={styles.input} />
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
          }}><Text style={{color:'#fff'}}>Criar</Text></TouchableOpacity>
        </View>
      </View>
    ) : (
      <View style={styles.container}><Text style={{color:'#fff'}}>Tarefa não encontrada</Text></View>
    )
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task?.title}</Text>
      <Text style={styles.label}>Prioridade</Text>
      <View style={{flexDirection:'row'}}>
        {(['low','medium','high'] as Task['priority'][]).map(p=> (
          <TouchableOpacity key={p} style={[styles.tag, task?.priority===p && styles.tagActive]} onPress={()=>setField('priority', p)}>
            <Text style={{color:'#fff'}}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Due Date</Text>
      <TextInput style={styles.input} value={task?.dueDate||''} placeholder="YYYY-MM-DD" onChangeText={(v)=>setField('dueDate', v)} placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Notas</Text>
      <TextInput style={[styles.input, {height:80}]} value={task?.notes||''} onChangeText={(v)=>setField('notes', v)} placeholderTextColor="#9CA3AF" multiline />

      <Text style={styles.label}>Subtarefas</Text>
      <FlatList data={task?.subtasks||[]} keyExtractor={s=>s.id} renderItem={({item})=> (
        <TouchableOpacity style={styles.subRow} onPress={()=>toggleSubtask(item.id)}>
          <Text style={{color:'#fff'}}>{item.done ? '✓' : '○'} {item.title}</Text>
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Sem subtarefas</Text>} />

      <View style={{flexDirection:'row',marginTop:12,alignItems:'center'}}>
        <TouchableOpacity style={styles.btn} onPress={startTimer}><Text style={{color:'#fff'}}>Iniciar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {marginLeft:8}]} onPress={stopTimer}><Text style={{color:'#fff'}}>Parar</Text></TouchableOpacity>
        <Text style={{color:'#9CA3AF', marginLeft:12}}>Tempo: {Math.floor((task?.timeSpentSec||0)/60)}m {(task?.timeSpentSec||0)%60}s</Text>
      </View>

      <View style={{marginTop:12}}>
        <TouchableOpacity style={[styles.btn,{backgroundColor:'#007AFF'}]} onPress={pickImage}><Text style={{color:'#fff'}}>Anexar imagem</Text></TouchableOpacity>
        <FlatList data={task?.attachments||[]} keyExtractor={a=>a} horizontal renderItem={({item})=> (
          <View style={{marginTop:8,marginRight:8}}>
            <Image source={{uri:item}} style={{width:80,height:80,borderRadius:8}} />
          </View>
        )} />
      </View>
      
      <View style={{marginTop:18}}>
        <Text style={styles.label}>Comentários</Text>
        <FlatList data={task?.comments?.slice().reverse()||[]} keyExtractor={c=>c.id} renderItem={({item})=> (
          <View style={{backgroundColor:'#071017',padding:8,borderRadius:8,marginTop:8}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={{color:'#fff',fontWeight:'700'}}>{item.author}</Text>
              <Text style={{color:'#9CA3AF',fontWeight:'400',fontSize:11}}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
            <Text style={{color:'#fff',marginTop:6}}>{item.text}</Text>
            {item.attachments && item.attachments.length>0 && (
              <FlatList
                horizontal
                data={item.attachments}
                keyExtractor={(a) => a}
                renderItem={({ item: att }) => (
                  <Image source={{ uri: att }} style={{ width: 80, height: 80, marginTop: 8, marginRight: 8, borderRadius: 8 }} />
                )}
              />
            )}
          </View>
        )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Sem comentários</Text>} />

        <TextInput placeholder="Adicionar comentário..." placeholderTextColor="#9CA3AF" value={newComment} onChangeText={setNewComment} style={[styles.input,{marginTop:8}]} />
        <View style={{flexDirection:'row',marginTop:8}}>
          <TouchableOpacity style={[styles.btn,{backgroundColor:'#6B7280'}]} onPress={pickCommentAttachment}><Text style={{color:'#fff'}}>Anexar imagem</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn,{marginLeft:8}]} onPress={saveComment}><Text style={{color:'#fff'}}>Enviar</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#0F1720'},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:8},
  label:{color:'#9CA3AF',marginTop:8,marginBottom:4},
  input:{backgroundColor:'#111827',color:'#fff',padding:8,borderRadius:8},
  tag:{padding:8,backgroundColor:'#1F2937',borderRadius:8,marginRight:8},
  tagActive:{backgroundColor:'#007AFF'},
  subRow:{padding:8,backgroundColor:'#0B1220',borderRadius:8,marginBottom:8},
  btn:{backgroundColor:'#34C759',padding:10,borderRadius:8}
});

export default TaskDetailScreen;
