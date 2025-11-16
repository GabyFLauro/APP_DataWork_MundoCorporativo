import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import theme from '../styles/theme';
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
      <TextInput placeholder="Título do projeto" placeholderTextColor={theme.colors.muted} value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Membros (emails separados por vírgula)" placeholderTextColor={theme.colors.muted} value={membersText} onChangeText={setMembersText} style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={createProject}><Text style={styles.btnText}>Criar projeto</Text></TouchableOpacity>

      <Text style={{color:theme.colors.text,fontWeight:'700',marginTop:12}}>Seus projetos</Text>
      <FlatList data={projects} keyExtractor={p=>p.id} renderItem={({item})=> (
        <View style={styles.row}>
          <Text style={{color:theme.colors.text,fontWeight:'700'}}>{item.title}</Text>
          <Text style={{color:theme.colors.muted,fontSize:12}}>{(item.members||[]).join(', ')}</Text>
        </View>
      )} ListEmptyComponent={<Text style={{color:theme.colors.muted,marginTop:12}}>Nenhum projeto</Text>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:theme.colors.background},
  title:{color:theme.colors.text,fontSize:18,fontWeight:'700',marginBottom:8},
  input:{backgroundColor:theme.colors.card,color:theme.colors.text,padding:8,borderRadius:8,marginTop:8},
  btn:{backgroundColor:theme.colors.primary,padding:10,borderRadius:8,marginTop:8,alignItems:'center'},
  btnText:{color:theme.colors.text,fontWeight:'700'},
  row:{backgroundColor:theme.colors.surface,padding:10,borderRadius:8,marginTop:8}
});

export default ProjectsScreen;
