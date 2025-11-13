import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

type InboxItem = {
  id: string;
  type: 'comment' | 'assignment' | 'update';
  message: string;
  relatedTaskId?: string;
  targetUser?: string;
  read?: boolean;
  timestamp: number;
};

const STORAGE_KEY = 'datawork_inbox_v1';

const InboxScreen: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try{
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    }catch(e){console.warn(e)}
  };

  const markRead = async (id: string) => {
    const next = items.map(i => i.id === id ? { ...i, read: true } : i);
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const open = async (it: InboxItem) => {
    await markRead(it.id);
    if (it.relatedTaskId) navigation.navigate('TaskDetail', { taskId: it.relatedTaskId });
  };

  const clearAll = async () => {
    Alert.alert('Limpar', 'Limpar todas as notificações?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(STORAGE_KEY); setItems([]); } }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={styles.title}>Caixa de Entrada</Text>
        <TouchableOpacity onPress={clearAll}><Text style={{color:'#FF3B30'}}>Limpar</Text></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=> (
        <TouchableOpacity style={[styles.row, item.read ? {opacity:0.6} : {}]} onPress={()=>open(item)}>
          <View style={{flex:1}}>
            <Text style={{color:'#fff',fontWeight:'700'}}>{item.message}</Text>
            <Text style={{color:'#9CA3AF',fontSize:11}}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={{color:'#9CA3AF',textAlign:'center',marginTop:20}}>Nenhuma notificação</Text>} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,padding:16,backgroundColor:'#0F1720'},
  title:{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:12},
  row:{backgroundColor:'#0B1220',padding:12,borderRadius:8,marginBottom:8,flexDirection:'row',alignItems:'center'},
  unreadDot:{width:10,height:10,borderRadius:5,backgroundColor:'#34C759'}
});

export default InboxScreen;
