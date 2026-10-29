import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { formatDay } from '../game/calendar';
import {
  buyItem,
  fillTank,
  pendingEvent,
  performAction,
  repairMotorino,
  resolveEvent,
  sleep,
  StatDelta,
  statDeltas,
  truccaMotorino,
} from '../game/engine';
import { migrate, newGame } from '../game/state';
import { GameState, Genere, Outcome, Preferenza } from '../game/types';
import { tap, ToastData } from './components';
import { initSounds, play, setSoundEnabled, SoundName, soundFor } from './sound';

const SAVE_KEY = 'giargia-save-v1';
const SETTINGS_KEY = 'giargia-settings-v1';

export interface EventResult {
  emoji: string;
  titolo: string;
  messages: string[];
  deltas: StatDelta[];
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const toastId = useRef(0);

  useEffect(() => {
    initSounds();
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        const on = raw ? JSON.parse(raw).soundOn !== false : true;
        setSoundOn(on);
        setSoundEnabled(on);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = migrate(JSON.parse(raw));
        if (parsed) setState(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (state) AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state)).catch(() => {});
    else AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
  }, [state, loaded]);

  const showToast = useCallback((messages: string[], deltas: StatDelta[]) => {
    if (!messages.length && !deltas.length) return;
    toastId.current += 1;
    setToast({ id: toastId.current, messages, deltas });
  }, []);

  const apply = useCallback(
    (run: (s: GameState) => Outcome, success?: SoundName) => {
      if (!state) return;
      const { state: next, messages } = run(state);
      if (next === state) tap('warning');
      const sound = soundFor(state, next);
      play(success && sound !== 'error' && sound !== 'scooter' ? success : sound);
      showToast(messages, statDeltas(state, next));
      setState(next);
    },
    [state, showToast],
  );

  return {
    loaded,
    state,
    toast,
    hideToast: () => setToast(null),
    eventResult,
    start: (nome: string, genere: Genere, preferenza: Preferenza) => setState(newGame(nome, genere, preferenza)),
    reset: () => setState(null),
    act: (id: string) => apply((s) => performAction(s, id, Math.random)),
    buy: (id: string) => apply((s) => buyItem(s, id), 'coin'),
    repair: () => apply(repairMotorino, 'scooter'),
    trucca: () => apply(truccaMotorino, 'scooter'),
    fillTank: () => apply(fillTank),
    sleep: () => {
      if (!state) return;
      const { state: next, messages } = sleep(state, Math.random);
      if (next === state) return;
      tap('success');
      play(next.finito ? 'fanfare' : 'night');
      if (next.pendingEventId) setTimeout(() => play('event'), 900);
      showToast([`🌙 Buonanotte… ☀️ ${formatDay(next.day)}`, ...messages], statDeltas(state, next));
      setState(next);
    },
    choose: (index: number) => {
      if (!state) return;
      const e = pendingEvent(state);
      const { state: next, messages } = resolveEvent(state, index, Math.random);
      if (e) setEventResult({ emoji: e.emoji, titolo: e.titolo, messages, deltas: statDeltas(state, next) });
      play(soundFor({ ...state, pendingEventId: null }, next));
      setState(next);
    },
    closeEventResult: () => setEventResult(null),
    soundOn,
    toggleSound: () => {
      const on = !soundOn;
      setSoundOn(on);
      setSoundEnabled(on);
      if (on) play('good');
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ soundOn: on })).catch(() => {});
    },
  };
}

export type Game = ReturnType<typeof useGame>;
