import React, { useState, useRef } from 'react';
import {
  ListMusic,
  Plus,
  Trash2,
  Upload,
  Radio,
  Search,
  Music,
  Play,
  CheckCircle2,
  FileAudio,
  X,
  FolderPlus,
  Smartphone,
  Sparkles,
  Zap,
  FolderSearch,
  Loader2
} from 'lucide-react';
import { Track } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { scanDirectoryHandle, isDirectoryPickerSupported, ScanProgress } from '../utils/scanPhoneAudio';

interface PlaylistProps {
  tracks: Track[];
  currentTrackId?: string;
  onSelectTrack: (track: Track) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onAddStreamUrl: (title: string, artist: string, url: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddParsedTracks?: (tracks: Track[]) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackId,
  onSelectTrack,
  onAddFiles,
  onAddStreamUrl,
  onRemoveTrack,
  onAddParsedTracks,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamArtist, setStreamArtist] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  const [isScanningDirectory, setIsScanningDirectory] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleAutoScanPhone = async () => {
    triggerHaptic('medium');
    if (isDirectoryPickerSupported()) {
      try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read',
        });
        setIsScanningDirectory(true);
        setScanProgress({
          scannedCount: 0,
          foundTracksCount: 0,
          currentFolder: dirHandle.name,
          isComplete: false,
        });

        const found = await scanDirectoryHandle(dirHandle, (prog) => {
          setScanProgress(prog);
        });

        if (found.length > 0 && onAddParsedTracks) {
          onAddParsedTracks(found);
        } else if (found.length === 0) {
          triggerHaptic('light');
          alert('Aucun fichier audio (.mp3, .flac, .m4a, .wav) n\'a été trouvé dans le dossier sélectionné.');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Directory picker failed, opening folder selector fallback:', err);
          folderInputRef.current?.click();
        }
      } finally {
        setIsScanningDirectory(false);
        setScanProgress(null);
      }
    } else {
      folderInputRef.current?.click();
    }
  };

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('medium');
      onAddFiles(e.target.files);
      // Reset input value so re-selecting same files triggers change event
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      triggerHaptic('medium');
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;
    onAddStreamUrl(
      streamTitle.trim() || 'Radio Web Stream',
      streamArtist.trim() || 'Live Audio Stream',
      streamUrl.trim()
    );
    setStreamTitle('');
    setStreamArtist('');
    setStreamUrl('');
    setShowStreamModal(false);
  };

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex flex-col gap-4 shadow-xl">
      {/* Hidden File & Folder Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg,.wma,.opus"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is non-standard but widely supported in Android Chrome
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Phone Music Import Hero Card */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Musique du Téléphone</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                MP3 / FLAC / M4A
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Importez vos chansons enregistrées dans la mémoire de votre téléphone ou carte SD.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Main 1-Click Auto Scan Phone Button */}
          <button
            onClick={handleAutoScanPhone}
            disabled={isScanningDirectory}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            title="Analyser automatiquement les fichiers audio (.mp3, .flac, .m4a) enregistrés sur votre téléphone Android"
          >
            {isScanningDirectory ? (
              <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            )}
            <span>⚡ Scan Automatique Téléphone</span>
          </button>

          {/* Standard File Picker Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              fileInputRef.current?.click();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fichiers</span>
          </button>

          {/* Folder Picker Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              folderInputRef.current?.click();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold active:scale-95 transition-all"
            title="Parcourir un dossier complet de votre téléphone"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dossier</span>
          </button>
        </div>
      </div>

      {/* Auto Scanning Progress Modal Overlay */}
      {isScanningDirectory && scanProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
              <FolderSearch className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <span>Scan de la Mémoire Téléphone</span>
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Recherche des morceaux MP3, FLAC, M4A et WAV dans vos dossiers...
              </p>
            </div>

            <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Dossier analysé:</span>
                <span className="text-cyan-400 truncate max-w-[140px]">{scanProgress.currentFolder}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Éléments parcourus:</span>
                <span className="text-white font-bold">{scanProgress.scannedCount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Musiques trouvées:</span>
                <span className="text-emerald-400 font-bold">{scanProgress.foundTracksCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            Bibliothèque de Lecture ({tracks.length} morceau{tracks.length > 1 ? 'x' : ''})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Stream Radio URL Trigger */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowStreamModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Flux Web / Radio</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          triggerHaptic('light');
          fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <FileAudio className="w-4 h-4 text-cyan-400" />
          <span>Glissez-déposez des fichiers audio ici ou cliquez pour choisir sur le téléphone</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par titre, artiste, album..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>

      {/* Track List */}
      <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Aucun morceau trouvé.
          </div>
        ) : (
          filteredTracks.map((track, idx) => {
            const isCurrent = track.id === currentTrackId;

            return (
              <div
                key={track.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTrack(track);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-9 h-9 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700/60">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-4 h-4 text-slate-400" />
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
                        <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {idx + 1}. {track.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span>{track.artist}</span>
                      {track.album && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{track.album}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-sans border border-slate-700/50">
                    {track.format || 'AUDIO'}
                  </span>
                  <span>{formatDuration(track.duration)}</span>
                  {!track.isPreset && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onRemoveTrack(track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                      title="Supprimer de la liste"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stream Modal */}
      {showStreamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowStreamModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <span>Ajouter un Flux Web / Radio URL</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Entrez l'URL directe d'un flux audio MP3 ou AAC (ex: Web Radio, Shoutcast, ICEcast)
            </p>

            <form onSubmit={handleStreamSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du Flux / Station
                </label>
                <input
                  type="text"
                  placeholder="ex: Chillout Lounge Radio"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Artiste / Genre
                </label>
                <input
                  type="text"
                  placeholder="ex: Radio Deep House 24/7"
                  value={streamArtist}
                  onChange={(e) => setStreamArtist(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL du Flux Audio HTTP/HTTPS
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://stream.example.com/radio.mp3"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStreamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
                >
                  Ajouter le Flux
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

