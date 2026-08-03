import { Track } from '../types';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
}

export function setupAndroidMediaSession(
  track: Track | undefined,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  callbacks: MediaSessionCallbacks
) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (track) {
    // Set Metadata for Android Notification & Lockscreen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'DualAudio Player Android',
      album: track.album || 'Sortie Double Bluetooth',
      artwork: track.coverUrl
        ? [
            { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [
            {
              src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&h=512&fit=crop',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
    });
  }

  // Set playback state on Android
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  // Set position state if supported
  if ('setPositionState' in navigator.mediaSession && duration > 0 && !isNaN(currentTime)) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, duration),
        playbackRate: 1.0,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch {
      // Ignore position state errors
    }
  }

  // Register Android Hardware & Notification Action Handlers
  try {
    navigator.mediaSession.setActionHandler('play', () => {
      callbacks.onPlay();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      callbacks.onPause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      callbacks.onPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      callbacks.onNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        callbacks.onSeek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset || 10;
      callbacks.onSeek(Math.max(0, currentTime - skip));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset || 10;
      callbacks.onSeek(Math.min(duration, currentTime + skip));
    });
  } catch {
    // Action handler registration fallbacks
  }
}
