import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { SoundName } from './soundFor';

export type { SoundName } from './soundFor';
export { soundFor } from './soundFor';

const SOURCES: Record<SoundName, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  good: require('../../assets/sounds/good.wav'),
  bad: require('../../assets/sounds/bad.wav'),
  error: require('../../assets/sounds/error.wav'),
  night: require('../../assets/sounds/night.wav'),
  event: require('../../assets/sounds/event.wav'),
  love: require('../../assets/sounds/love.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
  scooter: require('../../assets/sounds/scooter.wav'),
};

const VOLUME: Partial<Record<SoundName, number>> = { tap: 0.35, scooter: 0.7 };

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;

/** Rispetta l'interruttore silenzioso dell'iPhone e non ferma la musica di altre app. */
export function initSounds() {
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function play(name: SoundName) {
  if (!enabled) return;
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name] ?? 1;
      players[name] = p;
      p.play();
      return;
    }
    const player = p;
    player.seekTo(0).then(() => player.play(), () => {});
  } catch {
    // Un suono che non parte non deve mai bloccare il gioco.
  }
}
