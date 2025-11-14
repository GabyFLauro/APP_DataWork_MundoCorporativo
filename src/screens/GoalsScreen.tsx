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
  const [recurrence, setRecurrence] = useState<'none'|'daily'|'weekly'>('none');
  const [rewardType, setRewardType] = useState<'xp'|'coins'|'badge'>('xp');
  const [rewardValue, setRewardValue] = useState<string>('0');
  const [rewardBadgeName, setRewardBadgeName] = useState<string>('');
  const [profile, setProfile] = useState<{ xp: number; coins: number; level: number; badges: string[] }>({ xp: 0, coins: 0, level: 1, badges: [] });
  const [desiredRewards, setDesiredRewards] = useState<Array<{ id: string; type: 'xp'|'coins'|'badge'; value?: number; badgeName?: string; thresholdType: 'xp'|'coins'; thresholdValue: number; unlocked?: boolean; unlockedAt?: number }>>([]);
  const [desiredType, setDesiredType] = useState<'xp'|'coins'|'badge'>('badge');
  const [desiredValue, setDesiredValue] = useState<string>('0');
  const [desiredBadgeName, setDesiredBadgeName] = useState<string>('');
  const [desiredThresholdType, setDesiredThresholdType] = useState<'xp'|'coins'>('xp');
  const [desiredThresholdValue, setDesiredThresholdValue] = useState<string>('1000');

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
  useEffect(() => { AsyncStorage.setItem(DESIRED_KEY, JSON.stringify(desiredRewards)).catch(()=>{}); }, [desiredRewards]);

  const loadDesired = async () => {
    try{
      const raw = await AsyncStorage.getItem(DESIRED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setDesiredRewards(parsed);
      }
    }catch(e){console.warn(e)}
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
    // points are informational; XP is determined by difficulty
    const basePoints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;
    // validate reward inputs
    let rewardObj: Goal['reward'] | undefined = undefined;
    if (rewardType) {
      if (rewardType === 'badge') {
        if (!rewardBadgeName || !rewardBadgeName.trim()) {
          return Alert.alert('Validação', 'Digite o nome do badge para a recompensa');
        }
        rewardObj = { type: 'badge', badgeName: rewardBadgeName.trim() };
      } else {
        const rv = parseInt(rewardValue || '0', 10);
        if (isNaN(rv) || rv <= 0) return Alert.alert('Validação', 'Informe um valor numérico maior que 0 para a recompensa');
        rewardObj = { type: rewardType, value: rv } as any;
      }
    }
    const g: Goal = { id: String(Date.now()), title: title.trim(), points: basePoints, completed: false, createdAt: Date.now(), difficulty, recurrence, lastCompletedAt: null, streak: 0, lastRewardedAt: null, reward: rewardObj };
    setGoals(s => [g, ...s]);
    setTitle('');
    // reset reward inputs
    setRewardType('xp'); setRewardValue('0'); setRewardBadgeName('');
    Alert.alert('Meta adicionada', `Meta criada (${difficulty}${recurrence && recurrence!=='none' ? ' • ' + recurrence : ''})`);
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
        const label = d.type === 'badge' ? `Badge: ${d.badgeName}` : `${d.value} ${d.type}`;
        pushUnlockHistory(d.type, label);
        playUnlockAnimation(label);
      });
    }
  };

  const addDesiredReward = () => {
    // validate
    const th = parseInt(desiredThresholdValue || '0', 10);
    if (isNaN(th) || th <= 0) return Alert.alert('Validação', 'Informe um valor de threshold (XP/Coins) maior que 0');
    if (desiredType === 'badge') {
      if (!desiredBadgeName || !desiredBadgeName.trim()) return Alert.alert('Validação', 'Digite o nome do badge');
    } else {
      const v = parseInt(desiredValue || '0', 10);
      if (isNaN(v) || v <= 0) return Alert.alert('Validação', 'Informe um valor numérico maior que 0 para a recompensa');
    }
    const newD: any = { id: String(Date.now()), type: desiredType, thresholdType: desiredThresholdType, thresholdValue: th, unlocked: false };
    if (desiredType === 'badge') newD.badgeName = desiredBadgeName.trim(); else newD.value = parseInt(desiredValue||'0',10);
    setDesiredRewards(s => [newD, ...s]);
    setDesiredBadgeName(''); setDesiredValue('0'); setDesiredThresholdValue('1000'); setDesiredType('badge'); setDesiredThresholdType('xp');
    Alert.alert('Recompensa adicionada', 'Sua recompensa desejada foi adicionada à lista');
  };

  const removeDesiredReward = (id: string) => {
    setDesiredRewards(s => s.filter(d => d.id !== id));
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
      {/* Desired rewards (wishlist) */}
      <View style={{marginBottom:12,marginTop:6}}>
        <Text style={{color:'#fff',fontWeight:'700'}}>Recompensas desejadas</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:8}}>
          <Text style={{color:'#9CA3AF',marginRight:8}}>Tipo:</Text>
          {(['xp','coins','badge'] as const).map(t=> (
            <TouchableOpacity key={t} onPress={()=>setDesiredType(t)} style={{padding:8,backgroundColor: desiredType===t ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{t==='xp'?'XP':t==='coins'?'Coins':'Badge'}</Text></TouchableOpacity>
          ))}
          {desiredType !== 'badge' && (
            <TextInput value={desiredValue} onChangeText={setDesiredValue} keyboardType="number-pad" placeholder="Valor" placeholderTextColor="#9CA3AF" style={[styles.input,{width:100,marginLeft:8}]} />
          )}
          {desiredType === 'badge' && (
            <TextInput value={desiredBadgeName} onChangeText={setDesiredBadgeName} placeholder="Nome do badge" placeholderTextColor="#9CA3AF" style={[styles.input,{width:140,marginLeft:8}]} />
          )}
        </View>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:8}}>
          <Text style={{color:'#9CA3AF',marginRight:8}}>Desbloquear ao atingir:</Text>
          {(['xp','coins'] as const).map(tt=> (
            <TouchableOpacity key={tt} onPress={()=>setDesiredThresholdType(tt)} style={{padding:8,backgroundColor: desiredThresholdType===tt ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{tt.toUpperCase()}</Text></TouchableOpacity>
          ))}
          <TextInput value={desiredThresholdValue} onChangeText={setDesiredThresholdValue} keyboardType="number-pad" placeholder="Valor" placeholderTextColor="#9CA3AF" style={[styles.input,{width:120,marginLeft:8}]} />
          <TouchableOpacity onPress={addDesiredReward} style={[styles.addBtn,{marginLeft:8}]}><Text style={{color:'#fff'}}>Adicionar</Text></TouchableOpacity>
        </View>

        <FlatList data={desiredRewards} keyExtractor={d=>d.id} style={{marginTop:8}} ListEmptyComponent={<Text style={{color:'#9CA3AF'}}>Nenhuma recompensa desejada</Text>} renderItem={({item})=> (
          <View style={{flexDirection:'row',alignItems:'center',padding:8,backgroundColor:'#071017',borderRadius:8,marginBottom:8}}>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontWeight:'700'}}>{item.type === 'badge' ? `Badge: ${item.badgeName}` : `${item.value} ${item.type}`}</Text>
              <Text style={{color:'#9CA3AF',fontSize:11}}>Desbloqueia ao atingir {item.thresholdValue} {item.thresholdType.toUpperCase()}</Text>
            </View>
            <Text style={{color: item.unlocked ? '#34C759' : '#9CA3AF',marginRight:12}}>{item.unlocked ? 'Desbloqueada' : 'Pendente'}</Text>
            <TouchableOpacity onPress={()=>removeDesiredReward(item.id)}><Text style={{color:'#FF3B30'}}>Remover</Text></TouchableOpacity>
          </View>
        )} />
        <TouchableOpacity onPress={()=>setShowHistoryModal(true)} style={{marginTop:8}}><Text style={{color:'#007AFF'}}>Ver histórico de desbloqueios</Text></TouchableOpacity>
      </View>
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

      <View style={{flexDirection:'row',marginBottom:12,alignItems:'center'}}>
        <Text style={{color:'#9CA3AF',marginRight:8}}>Dificuldade:</Text>
        {(['easy','medium','hard'] as const).map(d=> (
          <TouchableOpacity key={d} onPress={()=>setDifficulty(d)} style={{padding:8,backgroundColor: difficulty===d ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{d==='easy'?'Fácil':d==='medium'?'Médio':'Difícil'}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection:'row',marginBottom:12,alignItems:'center'}}>
        <Text style={{color:'#9CA3AF',marginRight:8}}>Recorrência:</Text>
        {(['none','daily','weekly'] as const).map(r=> (
          <TouchableOpacity key={r} onPress={()=>setRecurrence(r)} style={{padding:8,backgroundColor: recurrence===r ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{r==='none'?'Nenhuma':r==='daily'?'Diária':'Semanal'}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection:'row',marginBottom:12,alignItems:'center'}}>
        <Text style={{color:'#9CA3AF',marginRight:8}}>Recompensa:</Text>
        {(['xp','coins','badge'] as const).map(rt=> (
          <TouchableOpacity key={rt} onPress={()=>setRewardType(rt)} style={{padding:8,backgroundColor: rewardType===rt ? '#007AFF' : '#111827',borderRadius:8,marginRight:8}}><Text style={{color:'#fff'}}>{rt==='xp'?'XP':rt==='coins'?'Coins':'Badge'}</Text></TouchableOpacity>
        ))}
        {rewardType === 'xp' && (
          <TextInput value={rewardValue} onChangeText={setRewardValue} keyboardType="number-pad" placeholder="XP extra" placeholderTextColor="#9CA3AF" style={[styles.input,{width:120,marginLeft:8}]} />
        )}
        {rewardType === 'coins' && (
          <TextInput value={rewardValue} onChangeText={setRewardValue} keyboardType="number-pad" placeholder="Coins" placeholderTextColor="#9CA3AF" style={[styles.input,{width:120,marginLeft:8}]} />
        )}
        {rewardType === 'badge' && (
          <TextInput value={rewardBadgeName} onChangeText={setRewardBadgeName} placeholder="Nome do Badge" placeholderTextColor="#9CA3AF" style={[styles.input,{width:160,marginLeft:8}]} />
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
            <Text style={{color:'#9CA3AF', fontSize:11}}>Dificuldade: {item.difficulty||'Médio'} • Points: {item.points} {item.recurrence && item.recurrence!=='none' ? '• ' + (item.recurrence==='daily'?'Diária':'Semanal') : ''}</Text>
            {item.recurrence && item.recurrence!=='none' && (
              <Text style={{color:'#9CA3AF', fontSize:11}}>Sequência: {item.streak || 0} dia(s)</Text>
            )}
          </View>
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
              <Text style={{color:'#9CA3AF',fontSize:12}}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          )} ListEmptyComponent={<Text style={{color:'#9CA3AF',marginTop:12}}>Nenhum desbloqueio ainda</Text>} />
          <TouchableOpacity onPress={()=>setShowHistoryModal(false)} style={[styles.addBtn,{marginTop:12,alignSelf:'flex-end'}]}><Text style={{color:'#fff'}}>Fechar</Text></TouchableOpacity>
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
