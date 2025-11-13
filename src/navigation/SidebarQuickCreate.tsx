import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = 'datawork_tasks_v1';

const SidebarQuickCreate: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  const [taskTitle, setTaskTitle] = useState('');
  
  const [projectTitle, setProjectTitle] = useState('');
  const [projectMembers, setProjectMembers] = useState('');
  

  const createTask = async () => {
    if (!taskTitle.trim()) return Alert.alert('Validação', 'Digite o título da tarefa');
    try {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const newTask = { id: String(Date.now()), title: taskTitle.trim(), status: 'pending', createdAt: Date.now(), dueDate: null, priority: 'medium', notes: '', subtasks: [], timeSpentSec: 0, tags: [], attachments: [] };
      arr.unshift(newTask);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(arr));
      setTaskTitle('');
      Alert.alert('Sucesso', 'Tarefa criada');
      navigation.closeDrawer();
    } catch (e) { console.warn(e); Alert.alert('Erro', 'Não foi possível criar a tarefa'); }
  };

  const createProject = async () => {
    if (!projectTitle.trim()) return Alert.alert('Validação', 'Digite o título do projeto');
    try{
      const raw = await AsyncStorage.getItem('datawork_projects_v1');
      const arr = raw ? JSON.parse(raw) : [];
      const members = projectMembers.split(',').map((m: string) => m.trim()).filter(Boolean);
      const newProject = { id: String(Date.now()), title: projectTitle.trim(), members, createdAt: Date.now() };
      arr.unshift(newProject);
      await AsyncStorage.setItem('datawork_projects_v1', JSON.stringify(arr));
      setProjectTitle(''); setProjectMembers('');
      Alert.alert('Sucesso','Projeto criado');
      navigation.closeDrawer();
    }catch(e){console.warn(e); Alert.alert('Erro','Não foi possível criar o projeto')}
  };

  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu</Text>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('DataWork')}>
        <Text style={styles.linkText}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('FocusTracker')}>
        <Text style={styles.linkText}>Focus Tracker</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Goals')}>
        <Text style={styles.linkText}>Metas</Text>
      </TouchableOpacity>
      {/* Bem-estar acessível apenas via Painel Central (CentralDashboard) */}

      <View style={{height:1,backgroundColor:'#333',marginVertical:12}} />

      <Text style={styles.section}>Criar rápido</Text>
      <Text style={styles.label}>Tarefa</Text>
      <TextInput value={taskTitle} onChangeText={setTaskTitle} placeholder="Título da tarefa" placeholderTextColor="#9CA3AF" style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={createTask}><Text style={styles.btnText}>Criar tarefa</Text></TouchableOpacity>

  <Text style={styles.label}>Projeto</Text>
  <TextInput value={projectTitle} onChangeText={setProjectTitle} placeholder="Título do projeto" placeholderTextColor="#9CA3AF" style={styles.input} />
  <TextInput value={projectMembers} onChangeText={setProjectMembers} placeholder="Membros (vírgula)" placeholderTextColor="#9CA3AF" style={styles.input} />
  <TouchableOpacity style={[styles.btn,{backgroundColor:'#7C3AED'}]} onPress={createProject}><Text style={styles.btnText}>Criar projeto</Text></TouchableOpacity>

  {/* Bem-estar removido daqui — mantenha o registro na tela do Painel Central */}

      {/* Focus sessions and goals managed from CentralDashboard */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0F1720' },
  header: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  link: { paddingVertical: 8 },
  linkText: { color: '#9CA3AF' },
  section: { color: '#fff', fontWeight: '700', marginTop: 8, marginBottom: 8 },
  label: { color: '#9CA3AF', marginTop: 8 },
  input: { backgroundColor: '#111827', color: '#fff', padding: 8, borderRadius: 8, marginTop: 6 },
  btn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default SidebarQuickCreate;
