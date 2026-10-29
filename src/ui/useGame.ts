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

const SAVE_KEY = 'giargia-save-v1';

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
  const toastId = useRef(0);

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
    (run: (s: GameState) => Outcome) => {
      if (!state) return;
      const { state: next, messages } = run(state);
      if (next === state) tap('warning');
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
    buy: (id: string) => apply((s) => buyItem(s, id)),
    repair: () => apply(repairMotorino),
    trucca: () => apply(truccaMotorino),
    fillTank: () => apply(fillTank),
    sleep: () => {
      if (!state) return;
      const { state: next, messages } = sleep(state, Math.random);
      if (next === state) return;
      tap('success');
      showToast([`🌙 Buonanotte… ☀️ ${formatDay(next.day)}`, ...messages], statDeltas(state, next));
      setState(next);
    },
    choose: (index: number) => {
      if (!state) return;
      const e = pendingEvent(state);
      const { state: next, messages } = resolveEvent(state, index, Math.random);
      if (e) setEventResult({ emoji: e.emoji, titolo: e.titolo, messages, deltas: statDeltas(state, next) });
      setState(next);
    },
    closeEventResult: () => setEventResult(null),
  };
}

export type Game = ReturnType<typeof useGame>;
