import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';
import { DualMixer } from './components/DualMixer';
import { AudioVisualizer } from './components/AudioVisualizer';
import { Playlist } from './components/Playlist';
import { EqualizerModal } from './components/EqualizerModal';
import { BluetoothGuideModal } from './components/BluetoothGuideModal';
import { AndroidModeCard } from './components/AndroidModeCard';

import {
  Track,
  DualMixerState,
  PlaybackState,
  AudioEngineCapabilities,
  ChannelSettings
} from './types';
import { DEFAULT_TRACKS, createSyntheticAudioBuffer } from './utils/defaultTracks';
import { audioEngineInstance } from './utils/audioEngine';
import { triggerHaptic } from './utils/haptics';
import { setupAndroidMediaSession } from './utils/mediaSession';
import { parseAudioFilename, getAudioDuration } from './utils/fileMetadata';
import { CheckCircle2, Sparkles, Smartphone } from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentTrackIndex: 0,
    shuffle: false,
    repeat: 'off',
    isLoading: false,
    error: null,
  });

  const [mixerState, setMixerState] = useState<DualMixerState>({
    masterVolume: 1.0,
    crossfader: 0,
    monoSplitMode: false,
    channelA: audioEngineInstance.getChannelSettings('A'),
    channelB: audioEngineInstance.getChannelSettings('B'),
  });

  const [capabilities, setCapabilities] = useState<AudioEngineCapabilities>(
    audioEngineInstance.capabilities
  );

  const [activeEQModal, setActiveEQModal] = useState<'A' | 'B' | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const currentTrack = tracks[currentTrackIndex];

  // Scan Bluetooth/Audio Devices
  const handleScanDevices = useCallback(async () => {
    setIsScanning(true);
    try {
      const devices = await audioEngineInstance.scanDevices();
      setCapabilities({
        ...audioEngineInstance.capabilities,
        detectedDevices: devices,
      });
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Initial scanning on load
  useEffect(() => {
    handleScanDevices();
  }, [handleScanDevices]);

  // Handle loading track into audio engine
  const loadTrack = useCallback(
    async (track: Track, autoPlay = false) => {
      setPlaybackState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        let duration = track.duration;
        try {
          duration = await audioEngineInstance.loadAudioFromUrl(track.url);
        } catch {
          // If remote track load fails (CORS / network), fallback gracefully to dynamic Web Audio synthetic buffer
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const tempCtx = new AudioCtx();
          const synthBuffer = createSyntheticAudioBuffer(tempCtx, 180, track.title);
          duration = await audioEngineInstance.loadAudioFromBuffer(synthBuffer);
        }

        setPlaybackState((prev) => ({
          ...prev,
          duration,
          currentTime: 0,
          isLoading: false,
        }));

        if (autoPlay) {
          audioEngineInstance.play(0);
          setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
        }
      } catch (err) {
        console.error('Track loading error:', err);
        setPlaybackState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Impossible de charger le fichier audio.',
        }));
      }
    },
    []
  );

  // Setup event listeners for audio engine
  useEffect(() => {
    audioEngineInstance.setOnTimeUpdate((time) => {
      setPlaybackState((prev) => ({ ...prev, currentTime: time }));
    });

    audioEngineInstance.setOnEnded(() => {
      setPlaybackState((prev) => {
        if (prev.repeat === 'one') {
          audioEngineInstance.play(0);
          return { ...prev, currentTime: 0, isPlaying: true };
        }
        return { ...prev, isPlaying: false, currentTime: 0 };
      });

      // Advance to next if repeat all or normal
      setCurrentTrackIndex((prevIndex) => {
        const nextIdx = (prevIndex + 1) % tracks.length;
        if (nextIdx !== 0 || playbackState.repeat === 'all') {
          setTimeout(() => {
            loadTrack(tracks[nextIdx], true);
          }, 100);
          return nextIdx;
        }
        return prevIndex;
      });
    });
  }, [tracks, playbackState.repeat, loadTrack]);

  // Initial load of first track
  useEffect(() => {
    if (tracks.length > 0) {
      loadTrack(tracks[0], false);
    }
  }, []);

  // Sync Android MediaSession controls with playback state
  useEffect(() => {
    setupAndroidMediaSession(
      currentTrack,
      playbackState.isPlaying,
      playbackState.currentTime,
      playbackState.duration,
      {
        onPlay: () => handlePlay(),
        onPause: () => handlePause(),
        onNext: () => handleNext(),
        onPrevious: () => handlePrev(),
        onSeek: (seconds) => handleSeek(seconds),
      }
    );
  }, [
    currentTrack,
    playbackState.isPlaying,
    playbackState.currentTime,
    playbackState.duration,
  ]);

  // Transport Controls with Android Haptic Feedback
  const handlePlay = () => {
    if (!currentTrack) return;
    triggerHaptic('light');
    audioEngineInstance.play();
    setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    triggerHaptic('light');
    audioEngineInstance.pause();
    setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
  };

  const handleStop = () => {
    triggerHaptic('medium');
    audioEngineInstance.pause();
    audioEngineInstance.seek(0);
    setPlaybackState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (tracks.length === 0) return;
    let prevIdx = currentTrackIndex - 1;
    if (prevIdx < 0) prevIdx = tracks.length - 1;
    setCurrentTrackIndex(prevIdx);
    loadTrack(tracks[prevIdx], playbackState.isPlaying);
  };

  const handleNext = () => {
    triggerHaptic('light');
    if (tracks.length === 0) return;
    let nextIdx = currentTrackIndex + 1;
    if (playbackState.shuffle) {
      nextIdx = Math.floor(Math.random() * tracks.length);
    } else if (nextIdx >= tracks.length) {
      nextIdx = 0;
    }
    setCurrentTrackIndex(nextIdx);
    loadTrack(tracks[nextIdx], playbackState.isPlaying);
  };

  const handleSeek = (seconds: number) => {
    triggerHaptic('light');
    audioEngineInstance.seek(seconds);
    setPlaybackState((prev) => ({ ...prev, currentTime: seconds }));
  };

  const handleApplyLatencyPreset = (channel: 'A' | 'B', ms: number) => {
    audioEngineInstance.updateChannelSettings(channel, { delayMs: ms });
    setMixerState((prev) => ({
      ...prev,
      channelA: audioEngineInstance.getChannelSettings('A'),
      channelB: audioEngineInstance.getChannelSettings('B'),
    }));
  };

  const handleToggleShuffle = () => {
    setPlaybackState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
  };

  const handleChangeRepeat = () => {
    setPlaybackState((prev) => {
      const nextMode = prev.repeat === 'off' ? 'all' : prev.repeat === 'all' ? 'one' : 'off';
      return { ...prev, repeat: nextMode };
    });
  };

  // Mixer Updates
  const handleUpdateChannel = (channel: 'A' | 'B', settings: Partial<ChannelSettings>) => {
    audioEngineInstance.updateChannelSettings(channel, settings);
    setMixerState((prev) => ({
      ...prev,
      channelA: audioEngineInstance.getChannelSettings('A'),
      channelB: audioEngineInstance.getChannelSettings('B'),
    }));
  };

  const handleSetSinkDevice = async (channel: 'A' | 'B', deviceId: string) => {
    await audioEngineInstance.setDeviceSink(channel, deviceId);
    setCapabilities({
      ...audioEngineInstance.capabilities,
      activeSinkA: audioEngineInstance.capabilities.activeSinkA,
      activeSinkB: audioEngineInstance.capabilities.activeSinkB,
    });
    setMixerState((prev) => ({
      ...prev,
      channelA: audioEngineInstance.getChannelSettings('A'),
      channelB: audioEngineInstance.getChannelSettings('B'),
    }));
  };

  const handleUpdateMasterVolume = (vol: number) => {
    audioEngineInstance.setMasterVolume(vol);
    setMixerState((prev) => ({ ...prev, masterVolume: vol }));
  };

  const handleUpdateCrossfader = (val: number) => {
    audioEngineInstance.setCrossfader(val);
    setMixerState((prev) => ({ ...prev, crossfader: val }));
  };

  const handleToggleMonoSplit = () => {
    setMixerState((prev) => {
      const nextSplit = !prev.monoSplitMode;
      // If split, set Pan A to -1 (Left) and Pan B to 1 (Right)
      if (nextSplit) {
        audioEngineInstance.updateChannelSettings('A', { pan: -1 });
        audioEngineInstance.updateChannelSettings('B', { pan: 1 });
      } else {
        audioEngineInstance.updateChannelSettings('A', { pan: 0 });
        audioEngineInstance.updateChannelSettings('B', { pan: 0 });
      }
      return {
        ...prev,
        monoSplitMode: nextSplit,
        channelA: audioEngineInstance.getChannelSettings('A'),
        channelB: audioEngineInstance.getChannelSettings('B'),
      };
    });
  };

  // Playlist Actions
  const handleSelectTrack = (track: Track) => {
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setCurrentTrackIndex(idx);
      loadTrack(track, true);
    }
  };

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const handleAddFiles = async (fileList: FileList | File[]) => {
    triggerHaptic('medium');
    const rawFiles = Array.from(fileList);
    
    // Filter audio files or files with audio extensions
    const audioFiles = rawFiles.filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|flac|wav|m4a|aac|ogg|wma|opus|mp4)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      showToast('⚠️ Aucun fichier audio détecté. Sélectionnez des fichiers MP3, FLAC, M4A ou WAV.');
      return;
    }

    showToast(`⏳ Importation de ${audioFiles.length} fichier${audioFiles.length > 1 ? 's' : ''} en cours...`);

    const newTracksPromises = audioFiles.map(async (file, i) => {
      const objectUrl = URL.createObjectURL(file);
      const { title, artist, album } = parseAudioFilename(file.name);
      const duration = await getAudioDuration(objectUrl);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';

      return {
        id: `phone-file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        artist,
        album,
        duration,
        url: objectUrl,
        format: ext,
        isPreset: false,
      };
    });

    const newTracks = await Promise.all(newTracksPromises);

    setTracks((prev) => [...prev, ...newTracks]);
    triggerHaptic('double');

    showToast(`🎵 ${newTracks.length} morceau${newTracks.length > 1 ? 'x' : ''} importé${newTracks.length > 1 ? 's' : ''} depuis votre téléphone !`);

    if (!playbackState.isPlaying && tracks.length === 0) {
      setCurrentTrackIndex(0);
      loadTrack(newTracks[0], true);
    }
  };

  const handleAddParsedTracks = (newTracks: Track[]) => {
    setTracks((prev) => [...prev, ...newTracks]);
    triggerHaptic('double');
    showToast(`🎵 ${newTracks.length} morceau${newTracks.length > 1 ? 'x' : ''} trouvé${newTracks.length > 1 ? 's' : ''} et ajouté${newTracks.length > 1 ? 's' : ''} depuis votre téléphone !`);

    if (!playbackState.isPlaying && tracks.length === 0 && newTracks.length > 0) {
      setCurrentTrackIndex(0);
      loadTrack(newTracks[0], true);
    }
  };

  const handleAddStreamUrl = (title: string, artist: string, url: string) => {
    const newStreamTrack: Track = {
      id: `stream-${Date.now()}`,
      title,
      artist,
      album: 'Flux Web / Radio Stream',
      duration: 9999,
      url,
      format: 'STREAM HTTP',
      isPreset: false,
    };

    setTracks((prev) => [newStreamTrack, ...prev]);
    setCurrentTrackIndex(0);
    loadTrack(newStreamTrack, true);
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <Header
        capabilities={capabilities}
        onScanDevices={handleScanDevices}
        onOpenGuide={() => setShowGuideModal(true)}
        isScanning={isScanning}
      />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-slate-900/95 border border-emerald-500/50 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Android Quick Control Banner */}
        <AndroidModeCard
          onApplyLatencyPreset={handleApplyLatencyPreset}
          onOpenAndroidGuide={() => setShowGuideModal(true)}
        />

        {/* Main Deck Player */}
        <PlayerControls
          currentTrack={currentTrack}
          playbackState={playbackState}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={handleSeek}
          onToggleShuffle={handleToggleShuffle}
          onChangeRepeat={handleChangeRepeat}
        />

        {/* Dual Audio Output Mixer Panel */}
        <DualMixer
          mixerState={mixerState}
          devices={capabilities.detectedDevices}
          onUpdateChannel={handleUpdateChannel}
          onSetSinkDevice={handleSetSinkDevice}
          onUpdateMasterVolume={handleUpdateMasterVolume}
          onUpdateCrossfader={handleUpdateCrossfader}
          onToggleMonoSplit={handleToggleMonoSplit}
          onOpenEQModal={(ch) => setActiveEQModal(ch)}
          isPlaying={playbackState.isPlaying}
        />

        {/* Grid: Audio Visualizer & Playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spectrum Visualizer Column */}
          <div className="lg:col-span-5">
            <AudioVisualizer isPlaying={playbackState.isPlaying} />
          </div>

          {/* Playlist & File Upload Column */}
          <div className="lg:col-span-7">
            <Playlist
              tracks={tracks}
              currentTrackId={currentTrack?.id}
              onSelectTrack={handleSelectTrack}
              onAddFiles={handleAddFiles}
              onAddParsedTracks={handleAddParsedTracks}
              onAddStreamUrl={handleAddStreamUrl}
              onRemoveTrack={handleRemoveTrack}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <p>DJ DARKO44 • Application Futuristic Dual Audio & Scan Téléphone Android</p>
      </footer>

      {/* Equalizer Modal */}
      {activeEQModal && (
        <EqualizerModal
          channel={activeEQModal}
          settings={
            activeEQModal === 'A' ? mixerState.channelA : mixerState.channelB
          }
          onUpdate={(settings) => handleUpdateChannel(activeEQModal, settings)}
          onClose={() => setActiveEQModal(null)}
        />
      )}

      {/* Bluetooth Connection Guide Modal */}
      {showGuideModal && (
        <BluetoothGuideModal
          onClose={() => setShowGuideModal(false)}
          onScanDevices={handleScanDevices}
        />
      )}
    </div>
  );
}
