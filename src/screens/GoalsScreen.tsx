import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Animated, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type Goal = {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  createdAt: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  recurrence?: 'none' | 'daily' | 'weekly';
  lastCompletedAt?: number | null;
  streak?: number;
  lastRewardedAt?: number | null;
  // reward preference: when this goal is completed, user gets this extra reward
  reward?: { type: 'xp' | 'coins' | 'badge'; value?: number; badgeName?: string };
};

const STORAGE_KEY = 'datawork_goals_v1';
const PROFILE_KEY = 'datawork_profile_v1';
const DESIRED_KEY = 'datawork_desired_rewards_v1';

const GoalsScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [profile, setProfile] = useState<{ xp: number; coins: number; level: number; badges: string[] }>({ xp: 0, coins: 0, level: 1, badges: [] });
  const [desiredRewards, setDesiredRewards] = useState<Array<{ id: string; rewardName: string; thresholdType: 'xp'|'coins'; thresholdValue: number; unlocked?: boolean; unlockedAt?: number }>>([]);
  const [desiredRewardName, setDesiredRewardName] = useState<string>('');
  const [desiredThresholdType, setDesiredThresholdType] = useState<'xp'|'coins'>('xp');
  const [desiredThresholdValue, setDesiredThresholdValue] = useState<string>('1000');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(()=>{}); }, [goals]);
  useEffect(() => { AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(()=>{}); }, [profile]);

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

  const loadProfile = async () => {
    try{
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile({ xp: parsed.xp||0, coins: parsed.coins||0, level: parsed.level||1, badges: parsed.badges||[] });
      }
    }catch(e){console.warn(e)}
  };

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { if (initialized) AsyncStorage.setItem(DESIRED_KEY, JSON.stringify(desiredRewards)).catch(()=>{}); }, [desiredRewards, initialized]);

  const loadDesired = async () => {
    try{
      const raw = await AsyncStorage.getItem(DESIRED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setDesiredRewards(parsed);
      }
    }catch(e){console.warn(e)}
    setInitialized(true);
  };

  useEffect(() => { loadDesired(); }, []);

  // whenever profile changes, check desired rewards (this will be idempotent)
  useEffect(() => { if (desiredRewards.length>0) checkUnlockDesiredRewards(profile); }, [profile]);

  // unlock history + animation
  const UNLOCK_KEY = 'datawork_unlock_history_v1';
  const [unlockHistory, setUnlockHistory] = useState<Array<{ id:string; type: string; label: string; timestamp: number }>>([]);
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const animScale = useState(new Animated.Value(0))[0];
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAllDesiredModal, setShowAllDesiredModal] = useState(false);

  const loadUnlockHistory = async () => {
    try{
      const raw = await AsyncStorage.getItem(UNLOCK_KEY);
      if (raw) setUnlockHistory(JSON.parse(raw));
    }catch(e){console.warn(e)}
  };
  useEffect(() => { loadUnlockHistory(); }, []);

  const pushUnlockHistory = async (type: string, label: string) => {
    const entry = { id: String(Date.now()), type, label, timestamp: Date.now() };
    const next = [entry, ...unlockHistory];
    setUnlockHistory(next);
    try{ await AsyncStorage.setItem(UNLOCK_KEY, JSON.stringify(next)); }catch(e){console.warn(e)}
  };

  const playUnlockAnimation = (label: string) => {
    setShowUnlockAnim(true);
    animScale.setValue(0.6);
    Animated.spring(animScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setTimeout(()=>{
      Animated.timing(animScale, { toValue: 0.6, duration: 250, useNativeDriver: true }).start(()=>setShowUnlockAnim(false));
    }, 2000);
  };

  // helpers for date comparisons
  const isSameDay = (a?: number|null, b?: number|null) => {
    if (!a || !b) return false;
    const da = new Date(a); const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  const isYesterday = (a?: number|null, b?: number|null) => {
    if (!a || !b) return false;
    const da = new Date(a); const db = new Date(b);
    const yesterday = new Date(db); yesterday.setDate(db.getDate() - 1);
    return da.getFullYear() === yesterday.getFullYear() && da.getMonth() === yesterday.getMonth() && da.getDate() === yesterday.getDate();
  };

  const add = () => {
    if(!title.trim()) return Alert.alert('Digite a meta');
    const basePoints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;
    const g: Goal = { 
      id: String(Date.now()), 
      title: title.trim(), 
      points: basePoints, 
      completed: false, 
      createdAt: Date.now(), 
      difficulty, 
      recurrence: 'none', 
      lastCompletedAt: null, 
      streak: 0, 
      lastRewardedAt: null 
    };
    setGoals(s => [g, ...s]);
    setTitle('');
    Alert.alert('Meta adicionada', `Meta criada`);
  };

  // Allow submit via keyboard
  const onSubmitEditing = () => add();

  const xpForDifficulty = (d?: 'easy'|'medium'|'hard') => d === 'easy' ? 50 : d === 'hard' ? 400 : 100;

  const levelFromXp = (xp: number) => Math.floor(xp / 1000) + 1;

  const grantRewardsForGoal = (g: Goal, updatedGoals?: Goal[]) => {
    const xpGain = xpForDifficulty(g.difficulty);
    const coinsGain = Math.floor(xpGain / 100); // 100 XP = 1 coin
    let newXp = profile.xp + xpGain;
    let newCoins = profile.coins + coinsGain;
    const newLevel = levelFromXp(newXp);
    const newBadges = [...profile.badges];
    // simple badge rules: count completed including recurring completions for today
    const list = updatedGoals || goals;
    const completedCount = list.reduce((acc, x) => {
      const done = x.completed || (x.recurrence && x.lastCompletedAt && isSameDay(x.lastCompletedAt, Date.now()));
      return acc + (done ? 1 : 0);
    }, 0);
    if (!newBadges.includes('First Win') && completedCount >= 1) newBadges.push('First Win');
    if (!newBadges.includes('5 Goals') && completedCount >= 5) newBadges.push('5 Goals');
    if (!newBadges.includes('Dedicated') && newXp >= 1000) newBadges.push('Dedicated');
    // apply custom reward chosen by user for this goal
    if (g.reward) {
      if (g.reward.type === 'xp' && g.reward.value) {
        newXp += g.reward.value;
      }
      if (g.reward.type === 'coins' && g.reward.value) {
        newCoins += g.reward.value;
      }
      if (g.reward.type === 'badge' && g.reward.badgeName) {
        if (!newBadges.includes(g.reward.badgeName)) newBadges.push(g.reward.badgeName);
      }
    }
    // recalc level after extra xp
    const finalLevel = levelFromXp(newXp);
    const newProfile = { xp: newXp, coins: newCoins, level: finalLevel, badges: newBadges };
    setProfile(newProfile);
    // check desired rewards for unlocking
    checkUnlockDesiredRewards(newProfile);
    Alert.alert('Missão Cumprida!', `+${xpGain} XP • +${coinsGain} Coins` + (g.reward ? `\nRecompensa extra: ${g.reward.type === 'badge' ? g.reward.badgeName : g.reward.value + ' ' + g.reward.type}` : '') + (finalLevel > profile.level ? `\nNivel up! Agora você é Nível ${finalLevel}` : ''));
  };

  const checkUnlockDesiredRewards = (currentProfile?: { xp:number; coins:number; level:number; badges:string[] }) => {
    const prof = currentProfile || profile;
    const now = Date.now();
    let changed = false;
    const newDesired = desiredRewards.map(d => {
      if (d.unlocked) return d;
      const thresholdReached = d.thresholdType === 'xp' ? prof.xp >= d.thresholdValue : prof.coins >= d.thresholdValue;
      if (thresholdReached) {
        // apply reward
        if (d.type === 'xp' && d.value) prof.xp += d.value;
        if (d.type === 'coins' && d.value) prof.coins += d.value;
        if (d.type === 'badge' && d.badgeName) if (!prof.badges.includes(d.badgeName)) prof.badges.push(d.badgeName);
        changed = true;
        return { ...d, unlocked: true, unlockedAt: now };
      }
      return d;
    });
    if (changed) {
      setDesiredRewards(newDesired);
      const newLevel = levelFromXp(prof.xp);
      setProfile({ xp: prof.xp, coins: prof.coins, level: newLevel, badges: prof.badges });
      Alert.alert('Recompensa desbloqueada!', 'Uma recompensa da sua lista de desejos foi desbloqueada e aplicada.');
      // record and animate the unlocks
      newDesired.filter(d=>d.unlocked).forEach(d=>{
        pushUnlockHistory('reward', d.rewardName);
        playUnlockAnimation(d.rewardName);
      });
    }
  };

  const addDesiredReward = () => {
    // validate
    const th = parseInt(desiredThresholdValue || '0', 10);
    if (isNaN(th) || th <= 0) return Alert.alert('Validação', 'Informe um valor de threshold (XP/Coins) maior que 0');
    if (!desiredRewardName || !desiredRewardName.trim()) return Alert.alert('Validação', 'Digite o nome da recompensa');
    
    const newD = { id: String(Date.now()), rewardName: desiredRewardName.trim(), thresholdType: desiredThresholdType, thresholdValue: th, unlocked: false };
    setDesiredRewards(s => [newD, ...s]);
    setDesiredRewardName(''); setDesiredThresholdValue('1000'); setDesiredThresholdType('xp');
    Alert.alert('Recompensa adicionada', 'Sua recompensa desejada foi adicionada à lista');
  };

  const removeDesiredReward = (id: string) => {
    setDesiredRewards(s => s.filter(d => d.id !== id));
  };

  const deleteGoal = (id: string) => {
    setGoals(s => s.filter(g => g.id !== id));
  };

  const toggle = (id: string) => {
    const now = Date.now();
    // compute updated array
    const newArr = goals.map(g => {
      if (g.id !== id) return g;
      if (g.recurrence && g.recurrence !== 'none') {
        const alreadyToday = g.lastCompletedAt && isSameDay(g.lastCompletedAt, now);
        if (alreadyToday) {
          // undo today's completion
          return { ...g, lastCompletedAt: null, streak: Math.max(0, (g.streak || 0) - 1), lastRewardedAt: null } as Goal;
        } else {
          // mark completed today and compute streak
          const newStreak = (g.lastCompletedAt && isYesterday(g.lastCompletedAt, now)) ? ((g.streak || 0) + 1) : 1;
          return { ...g, lastCompletedAt: now, streak: newStreak, lastRewardedAt: now } as Goal;
        }
      }
      // non-recurring: toggle completed
      const becoming = !g.completed;
      return { ...g, completed: becoming, lastRewardedAt: becoming ? now : g.lastRewardedAt } as Goal;
    });

    setGoals(newArr);

    // grant rewards if not recently rewarded
    const updated = newArr.find(x => x.id === id)!;
    const wasRewardedToday = updated.lastRewardedAt && isSameDay(updated.lastRewardedAt, now);
    if (!wasRewardedToday) {
      grantRewardsForGoal(updated, newArr);
      // persist lastRewardedAt for the goal
      const persisted = newArr.map(x => x.id === id ? { ...x, lastRewardedAt: Date.now() } : x);
      setGoals(persisted);
    }
  };

  const totalPoints = () => goals.filter(g=>g.completed).reduce((a,b)=>a+b.points,0);

  const xpProgress = () => {
    const xp = profile.xp;
    const currentLevel = levelFromXp(xp);
    const xpIntoLevel = xp - (currentLevel - 1) * 1000;
    const pct = Math.min(1, Math.max(0, xpIntoLevel / 1000));
    return { xp, currentLevel, xpIntoLevel, pct };
  };

  return (
    <View style={styles.container}>
      {/* Title removed per request */}
      <View style={{marginBottom:12}}>
        <Text style={{color:'#9CA3AF'}}>Nível {profile.level} • XP: {profile.xp} • Coins: {profile.coins}</Text>
        <View style={{height:10,backgroundColor:'#111827',borderRadius:6,overflow:'hidden',marginTop:8}}>
          <View style={{height:10,backgroundColor:'#34C759',width:`${xpProgress().pct * 100}%`}} />
        </View>
        <Text style={{color:'#9CA3AF',fontSize:11,marginTop:6}}>Badges: {profile.badges.length>0 ? profile.badges.join(', ') : 'Nenhum'}</Text>
      </View>

      <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
        {/* Add goal section */}
        <View style={{flex:1}}>
          <Text style={{color:'#fff',fontWeight:'700',marginBottom:8}}>Adicionar Meta</Text>
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
        </View>

        {/* Desired rewards (wishlist) */}
        <View style={{flex:1}}>
          <Text style={{color:'#fff',fontWeight:'700',marginBottom:8}}>Recompensas desejadas</Text>
          <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap'}}>
            <Text style={{color:'#9CA3AF',marginRight:8}}>Recompensa:</Text>
            <TextInput value={desiredRewardName} onChangeText={setDesiredRewardName} placeholder="Ex: comer fora..." placeholderTextColor="#9CA3AF" style={[styles.input,{flex:1,marginLeft:8,minWidth:150}]} />
            <Text style={{color:'#9CA3AF',marginLeft:8,marginRight:8}}>Ao atingir:</Text>
            {(['xp','coins'] as const).map(tt=> (
              <TouchableOpacity key={tt} onPress={()=>setDesiredThresholdType(tt)} style={{padding:8,backgroundColor: desiredThresholdType===tt ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{tt.toUpperCase()}</Text></TouchableOpacity>
            ))}
            <TextInput value={desiredThresholdValue} onChangeText={setDesiredThresholdValue} keyboardType="number-pad" placeholder="Valor" placeholderTextColor="#9CA3AF" style={[styles.input,{width:100}]} />
            <TouchableOpacity onPress={addDesiredReward} style={[styles.addBtn,{marginLeft:8}]}><Text style={{color:'#fff'}}>Adicionar</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{flexDirection:'row',marginBottom:12,gap:12}}>
        {/* Show last saved reward */}
        {desiredRewards.length > 0 && (
          <View style={{flex:1}}>
            <Text style={{color:'#9CA3AF',fontSize:12,marginBottom:6}}>Última recompensa salva:</Text>
            <View style={{flexDirection:'row',alignItems:'center',padding:8,backgroundColor:'#071017',borderRadius:8}}>
              <View style={{flex:1}}>
                <Text style={{color:'#fff',fontWeight:'700'}}>{desiredRewards[0].rewardName}</Text>
                <Text style={{color:'#9CA3AF',fontSize:11}}>Desbloqueia ao atingir {desiredRewards[0].thresholdValue} {desiredRewards[0].thresholdType.toUpperCase()}</Text>
              </View>
              <Text style={{color: desiredRewards[0].unlocked ? '#34C759' : '#9CA3AF'}}>{desiredRewards[0].unlocked ? 'Desbloqueada' : 'Pendente'}</Text>
            </View>
            <TouchableOpacity onPress={()=>setShowAllDesiredModal(true)} style={{marginTop:8}}><Text style={{color:'#007AFF'}}>Ver todas as recompensas desejadas ({desiredRewards.length})</Text></TouchableOpacity>
          </View>
        )}

        {/* Show last unlocked reward */}
        {unlockHistory.length > 0 && (
          <View style={{flex:1}}>
            <Text style={{color:'#9CA3AF',fontSize:12,marginBottom:6}}>Última recompensa desbloqueada:</Text>
            <View style={{flexDirection:'row',alignItems:'center',padding:8,backgroundColor:'#071017',borderRadius:8}}>
              <View style={{flex:1}}>
                <Text style={{color:'#34C759',fontWeight:'700'}}>{unlockHistory[0].label}</Text>
                <Text style={{color:'#9CA3AF',fontSize:11}}>{new Date(unlockHistory[0].timestamp).toLocaleString('pt-BR')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={()=>setShowHistoryModal(true)} style={{marginTop:8}}><Text style={{color:'#007AFF'}}>Ver histórico completo ({unlockHistory.length})</Text></TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.points}>Pontos: {totalPoints()}</Text>

      <FlatList data={goals} keyExtractor={g=>g.id} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhuma meta</Text>} renderItem={({item})=> {
        const completedForToday = item.completed || (item.recurrence && item.lastCompletedAt && isSameDay(item.lastCompletedAt, Date.now()));
        return (
        <View style={styles.row}>
          <TouchableOpacity onPress={()=>toggle(item.id)} style={[styles.check, completedForToday && styles.checkDone]}>
            {completedForToday ? <Ionicons name="checkmark" size={18} color="#fff"/> : null}
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={{color:'#fff'}}>{item.title}</Text>
            <Text style={{color:'#9CA3AF', fontSize:11}}>Dificuldade: {item.difficulty||'Médio'} • Points: {item.points}</Text>
          </View>
          <TouchableOpacity onPress={()=>deleteGoal(item.id)} style={{marginLeft:8}}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30"/>
          </TouchableOpacity>
        </View>
      )}} />
      {/* Unlock animation overlay */}
      <Modal visible={showUnlockAnim} transparent animationType="none">
        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <Animated.View style={{backgroundColor:'#111827',padding:20,borderRadius:12,transform:[{scale:animScale}]}}>
            <Text style={{color:'#34C759',fontWeight:'700',fontSize:18}}>Recompensa desbloqueada!</Text>
            <Text style={{color:'#fff',marginTop:8}}>Confira seu inventário</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Unlock history modal */}
      <Modal visible={showHistoryModal} animationType="slide" onRequestClose={()=>setShowHistoryModal(false)}>
        <View style={{flex:1,padding:16,backgroundColor:'#0F1720'}}>
          <Text style={{color:'#fff',fontSize:18,fontWeight:'700'}}>Histórico de Desbloqueios</Text>
          <FlatList data={unlockHistory} keyExtractor={i=>i.id} renderItem={({item})=> (
            <View style={{padding:10,backgroundColor:'#071017',borderRadius:8,marginTop:8}}>
              <Text style={{color:'#fff',fontWeight:'700'}}>{item.label}</Text>
              <Text style={{color:'#9CA3AF',fontSize:12}}>{new Date(item.timestamp).toLocaleString('pt-BR')}</Text>
            </View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF',marginTop:12}}>Nenhum desbloqueio ainda</Text>} />
          <TouchableOpacity onPress={()=>setShowHistoryModal(false)} style={[styles.addBtn,{marginTop:12,alignSelf:'flex-end'}]}><Text style={{color:'#fff'}}>Fechar</Text></TouchableOpacity>
        </View>
      </Modal>

      {/* All desired rewards modal */}
      <Modal visible={showAllDesiredModal} animationType="slide" onRequestClose={()=>setShowAllDesiredModal(false)}>
        <View style={{flex:1,padding:16,backgroundColor:'#0F1720'}}>
          <Text style={{color:'#fff',fontSize:18,fontWeight:'700'}}>Todas as Recompensas Desejadas</Text>
          <FlatList data={desiredRewards} keyExtractor={d=>d.id} style={{marginTop:12}} renderItem={({item})=> (
            <View style={{flexDirection:'row',alignItems:'center',padding:10,backgroundColor:'#071017',borderRadius:8,marginBottom:8}}>
              <View style={{flex:1}}>
                <Text style={{color:'#fff',fontWeight:'700'}}>{item.rewardName}</Text>
                <Text style={{color:'#9CA3AF',fontSize:11}}>Desbloqueia ao atingir {item.thresholdValue} {item.thresholdType.toUpperCase()}</Text>
              </View>
              <Text style={{color: item.unlocked ? '#34C759' : '#9CA3AF',marginRight:12}}>{item.unlocked ? 'Desbloqueada' : 'Pendente'}</Text>
              <TouchableOpacity onPress={()=>removeDesiredReward(item.id)}><Text style={{color:'#FF3B30'}}>Remover</Text></TouchableOpacity>
            </View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhuma recompensa desejada</Text>} />
          <TouchableOpacity onPress={()=>setShowAllDesiredModal(false)} style={[styles.addBtn,{marginTop:12,alignSelf:'flex-end'}]}><Text style={{color:'#fff'}}>Fechar</Text></TouchableOpacity>
        </View>
      </Modal>
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
