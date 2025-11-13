import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'datawork_projects_v1';

const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [membersText, setMembersText] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try{ const raw = await AsyncStorage.getItem(STORAGE_KEY); setProjects(raw ? JSON.parse(raw) : []);}catch(e){console.warn(e)}
  };

  const createProject = async () => {
    if (!title.trim()) return Alert.alert('Validação','Informe título');
    const members = membersText.split(',').map(m=>m.trim()).filter(Boolean);
    const p = { id: String(Date.now()), title: title.trim(), members, createdAt: Date.now() };
    const next = [p, ...projects];
    setProjects(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setTitle(''); setMembersText('');
    Alert.alert('Sucesso','Projeto criado');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projetos</Text>
      <TextInput placeholder="Título do projeto" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Membros (emails separados por vírgula)" placeholderTextColor="#9CA3AF" value={membersText} onChangeText={setMembersText} style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={createProject}><Text style={styles.btnText}>Criar projeto</Text></TouchableOpacity>

      <Text style={{color:'#fff',fontWeight:'700',marginTop:12}}>Seus projetos</Text>
      <FlatList data={projects} keyExtractor={p=>p.id} renderItem={({item})=> (
        <View style={styles.row}>
          <Text style={{color:'#fff',fontWeight:'700'}}>{item.title}</Text>
          <Text style={{color:'#9CA3AF',fontSize:12}}>{(item.members||[]).join(', ')}</Text>
        </View>
      )} ListEmptyComponent={<Text style={{color:'#9CA3AF',marginTop:12}}>Nenhum projeto</Text>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#0F1720'},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:8},
  input:{backgroundColor:'#111827',color:'#fff',padding:8,borderRadius:8,marginTop:8},
  btn:{backgroundColor:'#007AFF',padding:10,borderRadius:8,marginTop:8,alignItems:'center'},
  btnText:{color:'#fff',fontWeight:'700'},
  row:{backgroundColor:'#0B1220',padding:10,borderRadius:8,marginTop:8}
});

export default ProjectsScreen;
