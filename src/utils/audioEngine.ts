import { ChannelSettings, AudioOutputDevice, AudioEngineCapabilities } from '../types';

export class DualAudioEngine {
  private ctxA: AudioContext | null = null;
  private ctxB: AudioContext | null = null;

  private sourceA: AudioBufferSourceNode | null = null;
  private sourceB: AudioBufferSourceNode | null = null;

  private gainNodeA: GainNode | null = null;
  private gainNodeB: GainNode | null = null;

  private panNodeA: StereoPannerNode | null = null;
  private panNodeB: StereoPannerNode | null = null;

  private delayNodeA: DelayNode | null = null;
  private delayNodeB: DelayNode | null = null;

  private eqFiltersA: BiquadFilterNode[] = [];
  private eqFiltersB: BiquadFilterNode[] = [];

  private analyserA: AnalyserNode | null = null;
  private analyserB: AnalyserNode | null = null;

  private audioBuffer: AudioBuffer | null = null;
  private startTime: number = 0; // AudioContext currentTime when playback started
  private pauseOffset: number = 0; // Track position in seconds when paused
  private isPlaying: boolean = false;
  private masterVolume: number = 1.0;
  private crossfader: number = 0; // -1 to 1

  private channelSettingsA: ChannelSettings = {
    deviceId: 'default',
    volume: 1.0,
    muted: false,
    pan: 0,
    delayMs: 0,
    eqGains: [0, 0, 0, 0, 0],
    bassBoost: false,
    isSolo: false,
  };

  private channelSettingsB: ChannelSettings = {
    deviceId: 'default',
    volume: 1.0,
    muted: false,
    pan: 0,
    delayMs: 0,
    eqGains: [0, 0, 0, 0, 0],
    bassBoost: false,
    isSolo: false,
  };

  private EQ_FREQUENCIES = [60, 230, 910, 4000, 14000];

  public capabilities: AudioEngineCapabilities = {
    setSinkIdSupported: false,
    permissionGranted: false,
    detectedDevices: [],
    activeSinkA: 'default',
    activeSinkB: 'default',
  };

  private onEndedCallback?: () => void;
  private onTimeUpdateCallback?: (currentTime: number) => void;
  private progressInterval: number | null = null;

  constructor() {
    this.checkCapabilities();
  }

  public checkCapabilities() {
    const isSupported = typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype;
    const isElemSupported = typeof HTMLAudioElement !== 'undefined' && 'setSinkId' in HTMLAudioElement.prototype;
    this.capabilities.setSinkIdSupported = isSupported || isElemSupported;
  }

  public async scanDevices(): Promise<AudioOutputDevice[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }

      // Request microphone permission briefly to uncover actual device names / labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop stream immediately
        stream.getTracks().forEach((track) => track.stop());
        this.capabilities.permissionGranted = true;
      } catch (err) {
        console.warn('User did not grant microphone permission for device label scanning:', err);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = devices.filter((d) => d.kind === 'audiooutput');

      let formattedDevices: AudioOutputDevice[] = outputDevices.map((d, index) => {
        const labelLower = d.label.toLowerCase();
        const isBluetooth =
          labelLower.includes('bluetooth') ||
          labelLower.includes('headset') ||
          labelLower.includes('casque') ||
          labelLower.includes('écouteurs') ||
          labelLower.includes('airpods') ||
          labelLower.includes('buds') ||
          labelLower.includes('speaker') ||
          labelLower.includes('enceinte') ||
          labelLower.includes('bose') ||
          labelLower.includes('jbl') ||
          labelLower.includes('sony') ||
          labelLower.includes('sennheiser');

        let displayLabel = d.label || `Sortie Bluetooth #${index + 1}`;
        if (d.deviceId === 'default') {
          displayLabel = `🎧 Casque / Enceinte Bluetooth Connecté(e)`;
        }

        return {
          deviceId: d.deviceId,
          label: displayLabel,
          groupId: d.groupId,
          isBluetooth: true,
          kind: 'audiooutput',
        };
      });

      // Ensure default bluetooth entry is present
      const hasDefault = formattedDevices.some((d) => d.deviceId === 'default');
      if (!hasDefault) {
        formattedDevices.unshift({
          deviceId: 'default',
          label: '🎧 Casque / Enceinte Bluetooth Connecté(e)',
          isBluetooth: true,
          kind: 'audiooutput',
        });
      }

      // Add presets for Bluetooth Headphones & Bluetooth Speakers
      if (formattedDevices.length <= 1) {
        formattedDevices.push({
          deviceId: 'virtual-bt-1',
          label: '🎧 Casque Bluetooth DJ DARKO44',
          isBluetooth: true,
          kind: 'audiooutput',
        });
        formattedDevices.push({
          deviceId: 'virtual-bt-2',
          label: '🔊 Enceinte Bluetooth Surround',
          isBluetooth: true,
          kind: 'audiooutput',
        });
      }

      this.capabilities.detectedDevices = formattedDevices;
      return formattedDevices;
    } catch (err) {
      console.error('Error scanning devices:', err);
      return [];
    }
  }

  public async promptSelectAudioOutput(): Promise<AudioOutputDevice | null> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'selectAudioOutput' in navigator.mediaDevices) {
        // @ts-ignore
        const device = await navigator.mediaDevices.selectAudioOutput();
        if (device) {
          const newDev: AudioOutputDevice = {
            deviceId: device.deviceId,
            label: device.label ? `🎧 ${device.label}` : '🎧 Casque / Enceinte Bluetooth Sélectionné',
            groupId: device.groupId,
            isBluetooth: true,
            kind: 'audiooutput',
          };
          const existingIdx = this.capabilities.detectedDevices.findIndex((d) => d.deviceId === newDev.deviceId);
          if (existingIdx >= 0) {
            this.capabilities.detectedDevices[existingIdx] = newDev;
          } else {
            this.capabilities.detectedDevices.push(newDev);
          }
          return newDev;
        }
      }
    } catch (err) {
      console.warn('selectAudioOutput failed or dismissed:', err);
    }
    return null;
  }

  public async scanWebBluetoothDevice(): Promise<AudioOutputDevice | null> {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any)) {
        // @ts-ignore
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });
        if (device) {
          const deviceName = device.name || 'Appareil Bluetooth Proche';
          const newDev: AudioOutputDevice = {
            deviceId: `bt-${device.id || Date.now()}`,
            label: deviceName.toLowerCase().includes('enceinte') || deviceName.toLowerCase().includes('speaker') || deviceName.toLowerCase().includes('jbl') || deviceName.toLowerCase().includes('bose')
              ? `🔊 ${deviceName}`
              : `🎧 ${deviceName}`,
            isBluetooth: true,
            kind: 'audiooutput',
          };
          const existingIdx = this.capabilities.detectedDevices.findIndex((d) => d.deviceId === newDev.deviceId);
          if (existingIdx >= 0) {
            this.capabilities.detectedDevices[existingIdx] = newDev;
          } else {
            this.capabilities.detectedDevices.push(newDev);
          }
          return newDev;
        }
      }
    } catch (err) {
      console.warn('Web Bluetooth scanning canceled or failed:', err);
    }
    return null;
  }

  private initAudioContexts() {
    if (!this.ctxA) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctxA = new AudioCtx();
    }
    if (!this.ctxB) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctxB = new AudioCtx();
    }

    if (this.ctxA.state === 'suspended') {
      this.ctxA.resume();
    }
    if (this.ctxB.state === 'suspended') {
      this.ctxB.resume();
    }
  }

  public async setDeviceSink(channel: 'A' | 'B', deviceId: string) {
    this.initAudioContexts();
    if (channel === 'A') {
      this.channelSettingsA.deviceId = deviceId;
      this.capabilities.activeSinkA = deviceId;
      if (this.ctxA && 'setSinkId' in this.ctxA) {
        try {
          await (this.ctxA as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
          console.log(`Channel A sink set to ${deviceId}`);
        } catch (err) {
          console.warn(`Could not set sinkId for Context A:`, err);
        }
      }
    } else {
      this.channelSettingsB.deviceId = deviceId;
      this.capabilities.activeSinkB = deviceId;
      if (this.ctxB && 'setSinkId' in this.ctxB) {
        try {
          await (this.ctxB as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
          console.log(`Channel B sink set to ${deviceId}`);
        } catch (err) {
          console.warn(`Could not set sinkId for Context B:`, err);
        }
      }
    }
  }

  public async loadAudioFromUrl(url: string): Promise<number> {
    this.initAudioContexts();
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      // Decode in Context A (standard sample rate)
      const decodedData = await this.ctxA!.decodeAudioData(arrayBuffer);
      this.audioBuffer = decodedData;
      this.pauseOffset = 0;
      return decodedData.duration;
    } catch (err) {
      console.error('Error loading or decoding audio from URL:', err);
      throw err;
    }
  }

  public async loadAudioFromBuffer(buffer: AudioBuffer): Promise<number> {
    this.audioBuffer = buffer;
    this.pauseOffset = 0;
    return buffer.duration;
  }

  public play(offsetSeconds?: number) {
    if (!this.audioBuffer) return;
    this.initAudioContexts();

    if (this.isPlaying) {
      this.stopSources();
    }

    const startPos = offsetSeconds !== undefined ? offsetSeconds : this.pauseOffset;
    this.pauseOffset = startPos;

    // Create graph for Channel A
    this.sourceA = this.ctxA!.createBufferSource();
    this.sourceA.buffer = this.audioBuffer;

    this.gainNodeA = this.ctxA!.createGain();
    this.panNodeA = this.ctxA!.createStereoPanner ? this.ctxA!.createStereoPanner() : null;
    this.delayNodeA = this.ctxA!.createDelay(1.0);
    this.analyserA = this.ctxA!.createAnalyser();
    this.analyserA.fftSize = 256;

    this.eqFiltersA = this.EQ_FREQUENCIES.map((freq) => {
      const filter = this.ctxA!.createBiquadFilter();
      filter.type = freq <= 230 ? 'lowshelf' : freq >= 4000 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.0;
      return filter;
    });

    // Create graph for Channel B
    this.sourceB = this.ctxB!.createBufferSource();
    this.sourceB.buffer = this.audioBuffer;

    this.gainNodeB = this.ctxB!.createGain();
    this.panNodeB = this.ctxB!.createStereoPanner ? this.ctxB!.createStereoPanner() : null;
    this.delayNodeB = this.ctxB!.createDelay(1.0);
    this.analyserB = this.ctxB!.createAnalyser();
    this.analyserB.fftSize = 256;

    this.eqFiltersB = this.EQ_FREQUENCIES.map((freq) => {
      const filter = this.ctxB!.createBiquadFilter();
      filter.type = freq <= 230 ? 'lowshelf' : freq >= 4000 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.0;
      return filter;
    });

    // Connect Graph A: Source -> Delay -> EQ -> Pan -> Gain -> Analyser -> Destination
    let currA: AudioNode = this.sourceA;
    currA.connect(this.delayNodeA);
    currA = this.delayNodeA;

    this.eqFiltersA.forEach((filter) => {
      currA.connect(filter);
      currA = filter;
    });

    if (this.panNodeA) {
      currA.connect(this.panNodeA);
      currA = this.panNodeA;
    }

    currA.connect(this.gainNodeA);
    this.gainNodeA.connect(this.analyserA);
    this.analyserA.connect(this.ctxA!.destination);

    // Connect Graph B: Source -> Delay -> EQ -> Pan -> Gain -> Analyser -> Destination
    let currB: AudioNode = this.sourceB;
    currB.connect(this.delayNodeB);
    currB = this.delayNodeB;

    this.eqFiltersB.forEach((filter) => {
      currB.connect(filter);
      currB = filter;
    });

    if (this.panNodeB) {
      currB.connect(this.panNodeB);
      currB = this.panNodeB;
    }

    currB.connect(this.gainNodeB);
    this.gainNodeB.connect(this.analyserB);
    this.analyserB.connect(this.ctxB!.destination);

    // Apply initial settings
    this.applyChannelSettings('A');
    this.applyChannelSettings('B');

    // Handle track completion
    this.sourceA.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.clearProgressInterval();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    // Start playback simultaneously
    const nowA = this.ctxA!.currentTime;
    const nowB = this.ctxB!.currentTime;

    this.startTime = nowA - startPos;
    this.sourceA.start(nowA, startPos);
    this.sourceB.start(nowB, startPos);

    this.isPlaying = true;
    this.startProgressTimer();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSources();
    this.isPlaying = false;
    this.clearProgressInterval();
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, Math.min(seconds, this.audioBuffer ? this.audioBuffer.duration : 0));
    if (wasPlaying) {
      this.play(this.pauseOffset);
    } else if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.pauseOffset);
    }
  }

  private stopSources() {
    try {
      if (this.sourceA) {
        this.sourceA.onended = null;
        this.sourceA.stop();
        this.sourceA.disconnect();
        this.sourceA = null;
      }
      if (this.sourceB) {
        this.sourceB.onended = null;
        this.sourceB.stop();
        this.sourceB.disconnect();
        this.sourceB = null;
      }
    } catch {
      // Ignore cleanup error if already stopped
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctxA) {
      return this.pauseOffset;
    }
    const elapsed = this.ctxA.currentTime - this.startTime;
    return Math.min(elapsed, this.audioBuffer ? this.audioBuffer.duration : 0);
  }

  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, vol));
    this.updateGains();
  }

  public setCrossfader(val: number) {
    // -1 (100% A, 0% B) to 0 (100% A, 100% B) to 1 (0% A, 100% B)
    this.crossfader = Math.max(-1, Math.min(1, val));
    this.updateGains();
  }

  public updateChannelSettings(channel: 'A' | 'B', settings: Partial<ChannelSettings>) {
    if (channel === 'A') {
      this.channelSettingsA = { ...this.channelSettingsA, ...settings };
      this.applyChannelSettings('A');
    } else {
      this.channelSettingsB = { ...this.channelSettingsB, ...settings };
      this.applyChannelSettings('B');
    }
  }

  private applyChannelSettings(channel: 'A' | 'B') {
    if (channel === 'A') {
      // Apply Delay
      if (this.delayNodeA) {
        this.delayNodeA.delayTime.value = Math.max(0, this.channelSettingsA.delayMs / 1000);
      }
      // Apply Pan
      if (this.panNodeA) {
        this.panNodeA.pan.value = this.channelSettingsA.pan;
      }
      // Apply EQ
      this.eqFiltersA.forEach((filter, idx) => {
        let gain = this.channelSettingsA.eqGains[idx] || 0;
        if (idx === 0 && this.channelSettingsA.bassBoost) {
          gain += 6; // +6dB Bass Boost
        }
        filter.gain.value = gain;
      });
    } else {
      // Apply Delay
      if (this.delayNodeB) {
        this.delayNodeB.delayTime.value = Math.max(0, this.channelSettingsB.delayMs / 1000);
      }
      // Apply Pan
      if (this.panNodeB) {
        this.panNodeB.pan.value = this.channelSettingsB.pan;
      }
      // Apply EQ
      this.eqFiltersB.forEach((filter, idx) => {
        let gain = this.channelSettingsB.eqGains[idx] || 0;
        if (idx === 0 && this.channelSettingsB.bassBoost) {
          gain += 6; // +6dB Bass Boost
        }
        filter.gain.value = gain;
      });
    }

    this.updateGains();
  }

  private updateGains() {
    if (!this.gainNodeA || !this.gainNodeB) return;

    let crossFactorA = 1;
    let crossFactorB = 1;

    if (this.crossfader < 0) {
      crossFactorB = 1 + this.crossfader; // crossfader = -1 => factorB = 0
    } else if (this.crossfader > 0) {
      crossFactorA = 1 - this.crossfader; // crossfader = 1 => factorA = 0
    }

    // Check Solo state
    const anySolo = this.channelSettingsA.isSolo || this.channelSettingsB.isSolo;

    let effMuteA = this.channelSettingsA.muted;
    let effMuteB = this.channelSettingsB.muted;

    if (anySolo) {
      effMuteA = !this.channelSettingsA.isSolo;
      effMuteB = !this.channelSettingsB.isSolo;
    }

    const effectiveVolA = effMuteA
      ? 0
      : this.channelSettingsA.volume * this.masterVolume * crossFactorA;
    const effectiveVolB = effMuteB
      ? 0
      : this.channelSettingsB.volume * this.masterVolume * crossFactorB;

    this.gainNodeA.gain.setTargetAtTime(effectiveVolA, this.ctxA!.currentTime, 0.02);
    this.gainNodeB.gain.setTargetAtTime(effectiveVolB, this.ctxB!.currentTime, 0.02);
  }

  public getSpectrumData(channel: 'A' | 'B'): Uint8Array {
    const analyser = channel === 'A' ? this.analyserA : this.analyserB;
    if (!analyser) {
      return new Uint8Array(64);
    }
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public setOnTimeUpdate(cb: (currentTime: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public setOnEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  private startProgressTimer() {
    this.clearProgressInterval();
    this.progressInterval = window.setInterval(() => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.getCurrentTime());
      }
    }, 200);
  }

  private clearProgressInterval() {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  public getChannelSettings(channel: 'A' | 'B'): ChannelSettings {
    return channel === 'A' ? { ...this.channelSettingsA } : { ...this.channelSettingsB };
  }

  public destroy() {
    this.stopSources();
    this.clearProgressInterval();
    if (this.ctxA) this.ctxA.close();
    if (this.ctxB) this.ctxB.close();
  }
}

export const audioEngineInstance = new DualAudioEngine();
