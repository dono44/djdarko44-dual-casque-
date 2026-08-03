export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  url: string; // Blob URL or online URL
  coverUrl?: string;
  format?: string;
  isPreset?: boolean;
}

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
  groupId?: string;
  isBluetooth?: boolean;
  kind: 'audiooutput';
}

export interface ChannelSettings {
  deviceId: string;
  volume: number; // 0 to 1.5
  muted: boolean;
  pan: number; // -1 (Left) to 1 (Right)
  delayMs: number; // 0 to 500ms
  eqGains: number[]; // [60Hz, 230Hz, 910Hz, 4kHz, 14kHz] in dB (-12 to +12)
  bassBoost: boolean;
  isSolo: boolean;
}

export interface DualMixerState {
  masterVolume: number; // 0 to 1
  crossfader: number; // -1 (100% A) to 0 (50% A, 50% B) to 1 (100% B)
  monoSplitMode: boolean; // if true, Left channel -> Device A, Right channel -> Device B
  channelA: ChannelSettings;
  channelB: ChannelSettings;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTrackIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  error?: string | null;
}

export interface AudioEngineCapabilities {
  setSinkIdSupported: boolean;
  permissionGranted: boolean;
  detectedDevices: AudioOutputDevice[];
  activeSinkA: string;
  activeSinkB: string;
  fallbackModeNotice?: string;
}
