import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  id: string;
  startedAt: number;
  durationSec: number;
};

type FocusTimerContextType = {
  secondsLeft: number;
  running: boolean;
  focusMinutes: number;
  sessions: Session[];
  setFocusMinutes: (minutes: number) => void;
  start: () => void;
  stop: () => void;
  totalFocusedToday: () => number;
};

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

const STORAGE_KEY = 'datawork_focus_sessions_v1';
const TIMER_STATE_KEY = 'datawork_focus_timer_state_v1';

export const FocusTimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    loadSessions();
    loadTimerState();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
  }, [sessions]);

  useEffect(() => {
    if (running) {
      saveTimerState();
    } else {
      clearTimerState();
    }
  }, [running, secondsLeft, focusMinutes]);

  const saveTimerState = async () => {
    try {
      const state = {
        running,
        secondsLeft,
        focusMinutes,
        startedAt: startedAtRef.current,
        targetEndTime: targetEndTimeRef.current,
      };
      await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save timer state', e);
    }
  };

  const clearTimerState = async () => {
    try {
      await AsyncStorage.removeItem(TIMER_STATE_KEY);
    } catch (e) {
      console.warn('Failed to clear timer state', e);
    }
  };

  const loadTimerState = async () => {
    try {
      const raw = await AsyncStorage.getItem(TIMER_STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (state.running && state.targetEndTime) {
          const now = Date.now();
          const remainingSec = Math.max(0, Math.floor((state.targetEndTime - now) / 1000));
          if (remainingSec > 0) {
            // Resume timer
            setFocusMinutes(state.focusMinutes);
            setSecondsLeft(remainingSec);
            startedAtRef.current = state.startedAt;
            targetEndTimeRef.current = state.targetEndTime;
            setRunning(true);
            startInterval();
          } else {
            // Timer already finished while app was closed
            clearTimerState();
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load timer state', e);
    }
  };

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch (err) {
      console.warn(err);
    }
  };

  const startInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          stopTimer(true);
          Alert.alert('Tempo esgotado!', 'Sua sessão de foco terminou!', [{ text: 'OK' }]);
          return focusMinutes * 60;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
  };

  const start = () => {
    if (running) return;
    const now = Date.now();
    const durationMs = focusMinutes * 60 * 1000;
    startedAtRef.current = now;
    targetEndTimeRef.current = now + durationMs;
    setSecondsLeft(focusMinutes * 60);
    setRunning(true);
    startInterval();
  };

  const stopTimer = (auto = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    const startedAt = startedAtRef.current;
    if (startedAt) {
      const durationSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const newSession: Session = { id: String(Date.now()), startedAt, durationSec };
      setSessions(s => [newSession, ...s]);
      startedAtRef.current = null;
      targetEndTimeRef.current = null;
      if (!auto) Alert.alert('Sessão salva', `Duração: ${Math.floor(durationSec/60)}m ${durationSec%60}s`);
    }
    setSecondsLeft(focusMinutes * 60);
    clearTimerState();
  };

  const totalFocusedToday = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    return sessions.filter(s => s.startedAt >= startOfDay.getTime()).reduce((acc, s) => acc + s.durationSec, 0);
  };

  return (
    <FocusTimerContext.Provider value={{
      secondsLeft,
      running,
      focusMinutes,
      sessions,
      setFocusMinutes,
      start,
      stop: () => stopTimer(false),
      totalFocusedToday,
    }}>
      {children}
    </FocusTimerContext.Provider>
  );
};

export const useFocusTimer = () => {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within FocusTimerProvider');
  }
  return context;
};
