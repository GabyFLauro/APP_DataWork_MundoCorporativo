import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type Goal = {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'datawork_goals_v1';

const GoalsScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(()=>{}); }, [goals]);

  const load = async () => {
    try{
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if(raw) {
        try{
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setGoals(parsed);
        } catch(e) {
          console.warn('Formato inválido em storage, resetando metas', e);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    }catch(e){console.warn(e)}
  };

  const add = () => {
    if(!title.trim()) return Alert.alert('Digite a meta');
    const g: Goal = { id: String(Date.now()), title: title.trim(), points: 10, completed: false, createdAt: Date.now() };
    setGoals(s => [g, ...s]);
    setTitle('');
    Alert.alert('Meta adicionada', 'Sua meta foi criada com sucesso');
  };

  // Allow submit via keyboard
  const onSubmitEditing = () => add();

  const toggle = (id: string) => {
    setGoals(s => s.map(g => g.id === id ? { ...g, completed: !g.completed, points: g.completed ? g.points : g.points } : g));
  };

  const totalPoints = () => goals.filter(g=>g.completed).reduce((a,b)=>a+b.points,0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gamificação de Metas</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Estudar 1h"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
        />
        <TouchableOpacity style={styles.addBtn} onPress={add} accessibilityLabel="Adicionar meta">
          <Ionicons name="add" size={20} color="#fff"/>
        </TouchableOpacity>
      </View>

      <Text style={styles.points}>Pontos: {totalPoints()}</Text>

      <FlatList data={goals} keyExtractor={g=>g.id} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhuma meta</Text>} renderItem={({item})=> (
        <View style={styles.row}>
          <TouchableOpacity onPress={()=>toggle(item.id)} style={[styles.check, item.completed && styles.checkDone]}>
            {item.completed ? <Ionicons name="checkmark" size={18} color="#fff"/> : null}
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={{color:'#fff'}}>{item.title}</Text>
            <Text style={{color:'#9CA3AF', fontSize:11}}>Points: {item.points}</Text>
          </View>
        </View>
      )} />
    </View>
  )
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#0F1720'},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:12},
  inputRow:{flexDirection:'row',marginBottom:12},
  input:{flex:1,backgroundColor:'#111827',color:'#fff',paddingHorizontal:12,borderRadius:8,height:44},
  addBtn:{width:44,height:44,backgroundColor:'#007AFF',justifyContent:'center',alignItems:'center',marginLeft:8,borderRadius:8},
  points:{color:'#9CA3AF',marginBottom:8},
  row:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:'#0B1220',borderRadius:8,marginBottom:8},
  check:{width:36,height:36,borderRadius:18,backgroundColor:'#1F2937',justifyContent:'center',alignItems:'center',marginRight:12},
  checkDone:{backgroundColor:'#34C759'},
});

export default GoalsScreen;
