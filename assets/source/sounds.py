"""Genera gli effetti sonori del gioco (chiptune sintetizzati, nessun campione esterno).

Uso: python3 assets/source/sounds.py  →  scrive i .wav in assets/sounds/
"""
import os
import wave

import numpy as np

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'sounds')


def note(name):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    base, octave = name[:-1], int(name[-1])
    semis = names[base[0]] + (1 if '#' in base else 0) - (1 if 'b' in base[1:] else 0)
    return 440.0 * 2 ** ((semis + 12 * (octave - 4)) / 12)


def tone(freq, dur, wave_type='square', vol=0.5, attack=0.005, release=0.06, slide=None, duty=0.5):
    n = int(RATE * dur)
    t = np.arange(n) / RATE
    f = np.full(n, freq) if slide is None else np.linspace(freq, slide, n)
    phase = np.cumsum(f) / RATE
    if wave_type == 'square':
        w = np.where((phase % 1) < duty, 1.0, -1.0)
    elif wave_type == 'triangle':
        w = 2 * np.abs(2 * (phase % 1) - 1) - 1
    elif wave_type == 'noise':
        w = np.random.default_rng(7).uniform(-1, 1, n)
    else:
        w = np.sin(2 * np.pi * phase)
    env = np.ones(n)
    a, r = int(RATE * attack), int(RATE * release)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r and r < n:
        env[-r:] = np.linspace(1, 0, r)
    return w * env * vol


def seq(notes, step, **kw):
    return np.concatenate([tone(note(n), step, **kw) if n else np.zeros(int(RATE * step)) for n in notes])


def mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def save(name, data):
    data = np.clip(data, -1, 1)
    pcm = (data * 32767 * 0.8).astype(np.int16)
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm.tobytes())


os.makedirs(OUT, exist_ok=True)
save('tap', tone(1400, 0.035, 'square', 0.25, release=0.025, duty=0.25))
save('coin', np.concatenate([tone(note('B5'), 0.06, 'square', 0.35), tone(note('E6'), 0.22, 'square', 0.35, release=0.18)]))
save('good', seq(['C5', 'E5', 'G5', 'C6'], 0.07, wave_type='square', vol=0.3, duty=0.25))
save('bad', seq(['G4', 'Eb4', 'C4'], 0.11, wave_type='triangle', vol=0.6))
save('error', tone(140, 0.16, 'square', 0.3, release=0.05, slide=110))
save('night', mix(seq(['G5', 'E5', 'C5', 'G4'], 0.16, wave_type='triangle', vol=0.5, release=0.12),
                  seq([None, None, None, None, 'C4'], 0.16, wave_type='sine', vol=0.3, release=0.3)))
save('event', seq(['A5', None, 'A5', 'E6'], 0.07, wave_type='square', vol=0.3, duty=0.125))
save('love', mix(seq(['E5', 'G#5', 'B5', 'E6'], 0.09, wave_type='sine', vol=0.45, release=0.08),
                 seq(['E4', None, 'B4', None], 0.09, wave_type='triangle', vol=0.3)))
save('fanfare', seq(['C5', 'C5', 'C5', 'G5', None, 'E5', 'G5', 'C6'], 0.1, wave_type='square', vol=0.3, duty=0.25))
save('scooter', mix(tone(70, 0.6, 'square', 0.25, slide=160, release=0.15, duty=0.3),
                    tone(0, 0.6, 'noise', 0.08, release=0.2)))
