import React, { useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Music,
  Disc,
  Volume2
} from 'lucide-react';
import { Track, PlaybackState, RepeatMode } from '../types';

interface PlayerControlsProps {
  currentTrack?: Track;
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onChangeRepeat: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  playbackState,
  onPlay,
  onPause,
  onStop,
  onPrev,
  onNext,
  onSeek,
  onToggleShuffle,
  onChangeRepeat,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playbackState.duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * playbackState.duration);
  };

  const progressPercent = playbackState.duration
    ? (playbackState.currentTime / playbackState.duration) * 100
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex-shrink-0 shadow-md">
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                <Music className="w-8 h-8 text-slate-400" />
              </div>
            )}
            {playbackState.isPlaying && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                <Disc className="w-8 h-8 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono tracking-wider uppercase">
                {currentTrack?.format || 'DECK DARKO44'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate leading-tight font-mono">
              {currentTrack?.title || 'Aucune musique chargée'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">
              {currentTrack?.artist || 'Scannez votre téléphone ou importez vos MP3/M4A'}
              {currentTrack?.album ? ` • ${currentTrack.album}` : ''}
            </p>
          </div>
        </div>

        {/* Center Transport & Progress Bar */}
        <div className="flex flex-col items-center w-full md:w-2/3 max-w-xl gap-3">
          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {/* Shuffle Toggle */}
            <button
              onClick={onToggleShuffle}
              className={`p-2 rounded-lg transition-all ${
                playbackState.shuffle
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Lecture aléatoire"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrev}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Piste précédente"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play / Pause Main Button */}
            {playbackState.isPlaying ? (
              <button
                onClick={onPause}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all active:scale-95 group"
                title="Mettre en pause"
              >
                <Pause className="w-6 h-6 fill-slate-950 text-slate-950" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={!currentTrack || playbackState.isLoading}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group"
                title="Lire"
              >
                {playbackState.isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-0.5" />
                )}
              </button>
            )}

            {/* Stop Button */}
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Arrêter"
            >
              <Square className="w-4 h-4" />
            </button>

            {/* Next Track */}
            <button
              onClick={onNext}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              title="Piste suivante"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat Mode Toggle */}
            <button
              onClick={onChangeRepeat}
              className={`p-2 rounded-lg relative transition-all ${
                playbackState.repeat !== 'off'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Mode répétition: ${playbackState.repeat}`}
            >
              <Repeat className="w-4 h-4" />
              {playbackState.repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-cyan-400 text-slate-950 px-1 rounded-full">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Seek Progress Bar */}
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{formatTime(playbackState.currentTime)}</span>
            <div
              ref={progressBarRef}
              onClick={handleSeekClick}
              className="flex-1 h-2 bg-slate-800 hover:bg-slate-700/80 rounded-full cursor-pointer relative overflow-hidden transition-all group"
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full relative group-hover:brightness-110"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
