import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, FlatList, ScrollView } from 'react-native';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import theme from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const FocusTrackerScreen: React.FC = () => {
  const { secondsLeft, running, focusMinutes, sessions, setFocusMinutes, start, stop, totalFocusedToday } = useFocusTimer();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  // Agrupar sessões por dia
  const groupSessionsByDay = () => {
    const grouped: { [key: string]: typeof sessions } = {};
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt);
      const dateKey = date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });

    return Object.keys(grouped).map(dateKey => ({
      date: dateKey,
      sessions: grouped[dateKey],
      totalMinutes: grouped[dateKey].reduce((acc, s) => acc + Math.floor(s.durationSec / 60), 0)
    }));
  };

  const clearAllHistory = async () => {
    try {
      await AsyncStorage.removeItem('datawork_focus_sessions_v1');
      setConfirmDeleteModal(false);
      setShowHistoryModal(false);
      Alert.alert('Histórico apagado', 'Todo o histórico de sessões de foco foi removido.');
      // Forçar reload da página se necessário
      window.location.reload();
    } catch (error) {
      console.error('Erro ao apagar histórico:', error);
      Alert.alert('Erro', 'Não foi possível apagar o histórico.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Title removed per request */}
      <Text style={styles.timer}>{fmt(secondsLeft)}</Text>

      <View style={{flexDirection:'row',justifyContent:'center',marginBottom:12}}>
        {[15,20,25,30,45,60].map(m=> (
          <TouchableOpacity key={m} style={[styles.presetBtn, focusMinutes===m && styles.presetActive]} onPress={()=>{ if(!running) setFocusMinutes(m); }}>
            <Text style={{color: focusMinutes===m ? theme.colors.text : theme.colors.muted}}>{m}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',marginBottom:12}}>
        <Text style={{color:theme.colors.muted,marginRight:8}}>Minutos:</Text>
        <TextInput value={String(focusMinutes)} onChangeText={(t)=>{
          const v = parseInt(t||'0',10);
          if (!isNaN(v) && v>0) setFocusMinutes(v);
        }} keyboardType="number-pad" style={styles.minuteInput} editable={!running} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, running && styles.btnDisabled]} onPress={start} disabled={running}>
          <Text style={styles.btnText}>Iniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, !running && styles.btnDisabled]} onPress={stop} disabled={!running}>
          <Text style={styles.btnText}>Parar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total focado hoje: {Math.floor(totalFocusedToday()/60)} min</Text>
        
        {/* Sessões de hoje */}
        {(() => {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const todaySessions = sessions.filter(s => new Date(s.startedAt) >= startOfDay);
          
          if (todaySessions.length > 0) {
            return (
              <View style={styles.todaySessionsContainer}>
                <Text style={styles.todaySessionsTitle}>Intervalos de foco hoje:</Text>
                {todaySessions.map((session, index) => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={styles.sessionDot} />
                    <Text style={styles.sessionRowText}>
                      {new Date(session.startedAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {Math.floor(session.durationSec / 60)}m {session.durationSec % 60}s
                    </Text>
                  </View>
                ))}
              </View>
            );
          }
          return null;
        })()}

        <TouchableOpacity onPress={() => setShowHistoryModal(true)} style={{marginTop: 12}}>
          <Text style={styles.link}>Ver histórico completo ({sessions.length} sessões)</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Histórico */}
      <Modal visible={showHistoryModal} animationType="slide" transparent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Histórico de Sessões de Foco</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {groupSessionsByDay().length > 0 ? (
                groupSessionsByDay().map((day, index) => (
                  <View key={index} style={styles.dayGroup}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>{day.date}</Text>
                      <Text style={styles.dayTotal}>{day.totalMinutes} min total</Text>
                    </View>
                    {day.sessions.map((session) => (
                      <View key={session.id} style={styles.sessionItem}>
                        <View style={{flex: 1}}>
                          <Text style={styles.sessionTime}>
                            {new Date(session.startedAt).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            Duração: {Math.floor(session.durationSec / 60)}m {session.durationSec % 60}s
                          </Text>
                        </View>
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Nenhuma sessão de foco registrada ainda.</Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnDanger]} 
                onPress={() => setConfirmDeleteModal(true)}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{marginRight: 6}} />
                <Text style={[styles.btnText, {color: '#FFFFFF'}]}>Apagar Histórico</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.btnSecondary]} 
                onPress={() => setShowHistoryModal(false)}
              >
                <Text style={styles.btnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal visible={confirmDeleteModal} animationType="fade" transparent onRequestClose={() => setConfirmDeleteModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmTitle}>Apagar Todo o Histórico?</Text>
            <Text style={styles.confirmMessage}>
              Esta ação não pode ser desfeita. Todo o histórico de sessões de foco será permanentemente removido.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.confirmBtnCancel]} 
                onPress={() => setConfirmDeleteModal(false)}
              >
                <Text style={styles.confirmBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.confirmBtnDelete]} 
                onPress={clearAllHistory}
              >
                <Text style={[styles.confirmBtnText, {color: '#FFFFFF'}]}>Apagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor: theme.colors.background },
  title: { color:theme.colors.text, fontSize:18, fontWeight:'700', marginBottom:12 },
  timer: { color:theme.colors.text, fontSize:48, textAlign:'center', marginVertical:12 },
  controls: { flexDirection:'row', justifyContent:'center', gap:12, marginBottom:12 },
  btn: { backgroundColor:theme.colors.primary, paddingHorizontal:20, paddingVertical:10, borderRadius:8, marginHorizontal:8, flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity:0.5 },
  btnText: { color:theme.colors.text, fontWeight:'600' },
  summary: { marginTop:16 },
  summaryText: { color:theme.colors.muted, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  link: { color:theme.colors.primary, marginTop:8 },
  
  // Today sessions styles
  todaySessionsContainer: { 
    marginTop: 12, 
    padding: 12, 
    backgroundColor: theme.colors.surface, 
    borderRadius: 8 
  },
  todaySessionsTitle: { 
    color: theme.colors.text, 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  sessionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 6 
  },
  sessionDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: theme.colors.primary, 
    marginRight: 10 
  },
  sessionRowText: { 
    color: theme.colors.text, 
    fontSize: 13 
  },
  presetBtn: { paddingHorizontal:10, paddingVertical:8, borderRadius:8, backgroundColor:theme.colors.card, marginHorizontal:6 },
  presetActive: { backgroundColor:theme.colors.primary },
  minuteInput: { backgroundColor:theme.colors.card, color:theme.colors.text, paddingHorizontal:8, paddingVertical:6, borderRadius:8, width:80, textAlign:'center' },
  
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: theme.colors.background, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '80%',
    paddingBottom: 20
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  modalTitle: { 
    color: theme.colors.text, 
    fontSize: 18, 
    fontWeight: '700' 
  },
  modalBody: { 
    padding: 20 
  },
  modalFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 16,
    gap: 12
  },
  btnDanger: { 
    backgroundColor: theme.colors.danger,
    flex: 1
  },
  btnSecondary: { 
    backgroundColor: theme.colors.card,
    flex: 1
  },
  
  // Day group styles
  dayGroup: { 
    marginBottom: 20 
  },
  dayHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  dayTitle: { 
    color: theme.colors.text, 
    fontSize: 16, 
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  dayTotal: { 
    color: theme.colors.primary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  sessionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: theme.colors.surface, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  sessionTime: { 
    color: theme.colors.text, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  sessionDuration: { 
    color: theme.colors.muted, 
    fontSize: 12, 
    marginTop: 4 
  },
  emptyText: { 
    color: theme.colors.muted, 
    textAlign: 'center', 
    marginTop: 40 
  },
  
  // Confirm modal styles
  confirmOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  confirmContent: { 
    backgroundColor: theme.colors.background, 
    borderRadius: 12, 
    padding: 20, 
    minWidth: 300,
    maxWidth: 400
  },
  confirmTitle: { 
    color: theme.colors.text, 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12 
  },
  confirmMessage: { 
    color: theme.colors.muted, 
    fontSize: 14, 
    lineHeight: 20, 
    marginBottom: 20 
  },
  confirmButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12 
  },
  confirmBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  confirmBtnCancel: { 
    backgroundColor: theme.colors.card 
  },
  confirmBtnDelete: { 
    backgroundColor: theme.colors.danger 
  },
  confirmBtnText: { 
    color: theme.colors.text, 
    fontWeight: '600' 
  }
});

export default FocusTrackerScreen;
