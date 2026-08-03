import { Track } from '../types';

export const DEFAULT_TRACKS: Track[] = [];

/**
 * Creates a synthetic audio buffer for offline testing if remote tracks are blocked or slow
 */
export function createSyntheticAudioBuffer(audioContext: AudioContext, durationSec = 10, title = 'Test Tone'): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const numSamples = sampleRate * durationSec;
  const buffer = audioContext.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Generate a nice chord progression (C - Am - F - G)
  const freqs = [261.63, 220.00, 174.61, 196.00];
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(t / 2.5) % freqs.length;
    const baseFreq = freqs[chordIndex];
    
    // Smooth envelope
    const env = Math.sin((t % 2.5) / 2.5 * Math.PI) * 0.3;
    
    // Synth sound with fundamental + harmonics
    const wave = Math.sin(2 * Math.PI * baseFreq * t) * 0.5 +
                 Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.25 +
                 Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.125;
                 
    // Rhythm pulse
    const beat = (Math.floor(t * 2) % 2 === 0) ? 1.1 : 0.9;
    
    left[i] = wave * env * beat;
    right[i] = wave * env * (2.2 - beat); // subtle stereo panning rhythm
  }

  return buffer;
}
