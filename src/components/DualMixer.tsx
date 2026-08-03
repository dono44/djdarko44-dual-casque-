import React from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Bluetooth,
  Clock,
  Headphones,
  Radio,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  Smartphone
} from 'lucide-react';
import { DualMixerState, AudioOutputDevice, ChannelSettings } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface DualMixerProps {
  mixerState: DualMixerState;
  devices: AudioOutputDevice[];
  onUpdateChannel: (channel: 'A' | 'B', settings: Partial<ChannelSettings>) => void;
  onSetSinkDevice: (channel: 'A' | 'B', deviceId: string) => void;
  onUpdateMasterVolume: (volume: number) => void;
  onUpdateCrossfader: (val: number) => void;
  onToggleMonoSplit: () => void;
  onOpenEQModal: (channel: 'A' | 'B') => void;
  isPlaying: boolean;
}

export const DualMixer: React.FC<DualMixerProps> = ({
  mixerState,
  devices,
  onUpdateChannel,
  onSetSinkDevice,
  onUpdateMasterVolume,
  onUpdateCrossfader,
  onToggleMonoSplit,
  onOpenEQModal,
  isPlaying,
}) => {
  const { channelA, channelB, masterVolume, crossfader, monoSplitMode } = mixerState;

  const getDbValue = (vol: number) => {
    if (vol <= 0) return '-∞ dB';
    const db = 20 * Math.log10(vol);
    return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Table de Mixage Double Sortie Audio</span>
          </h2>
          <p className="text-xs text-slate-400">
            Contrôles indépendants de volume, égaliseur et latence Bluetooth par appareil
          </p>
        </div>

        {/* Master Crossfader quick status */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Balance Sorties A/B</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400 font-bold">A</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={crossfader}
              onChange={(e) => onUpdateCrossfader(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
              title="Fader de transition / Balance A et B"
            />
            <span className="text-[10px] text-purple-400 font-bold">B</span>
          </div>
          <button
            onClick={() => onUpdateCrossfader(0)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Centrer la balance"
          >
            50/50
          </button>
        </div>
      </div>

      {/* 1 Bluetooth Device & Phone Speaker Switcher */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Routage 1 Appareil Bluetooth + Haut-Parleur Téléphone</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Choix Rapide
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Si 1 seul casque/enceinte Bluetooth est connecté, déterminez quelle sortie va sur le Bluetooth et laquelle sort sur le haut-parleur de votre téléphone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Button A: Bluetooth on A, Phone on B */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              const btDev = devices.find((d) => d.isBluetooth)?.deviceId || 'virtual-bt-1';
              onSetSinkDevice('A', btDev);
              onSetSinkDevice('B', 'default');
            }}
            className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              channelA.deviceId !== 'default' && channelB.deviceId === 'default'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>A: Bluetooth 🎧 | B: Téléphone 🔊</span>
          </button>

          {/* Button B: Phone on A, Bluetooth on B */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              const btDev = devices.find((d) => d.isBluetooth)?.deviceId || 'virtual-bt-2';
              onSetSinkDevice('A', 'default');
              onSetSinkDevice('B', btDev);
            }}
            className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              channelA.deviceId === 'default' && channelB.deviceId !== 'default'
                ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>A: Téléphone 🔊 | B: Bluetooth 🎧</span>
          </button>

          {/* Button Both Bluetooth */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              const btDevs = devices.filter((d) => d.isBluetooth);
              onSetSinkDevice('A', btDevs[0]?.deviceId || 'virtual-bt-1');
              onSetSinkDevice('B', btDevs[1]?.deviceId || btDevs[0]?.deviceId || 'virtual-bt-2');
            }}
            className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
              channelA.deviceId !== 'default' && channelB.deviceId !== 'default'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Double Bluetooth 🎧🎧</span>
          </button>
        </div>
      </div>

      {/* Dual Channel Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* CHANNEL A CARD */}
        {/* ======================================================== */}
        <div
          className={`bg-slate-900/90 rounded-2xl p-5 border transition-all relative overflow-hidden ${
            channelA.isSolo
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
              : channelA.muted
              ? 'border-slate-800 opacity-80'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Top Channel Header */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Bluetooth className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    SORTIE A
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Périphérique 1</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Solo Button */}
              <button
                onClick={() => onUpdateChannel('A', { isSolo: !channelA.isSolo })}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                  channelA.isSolo
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                SOLO
              </button>

              {/* Mute Button */}
              <button
                onClick={() => onUpdateChannel('A', { muted: !channelA.muted })}
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  channelA.muted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {channelA.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{channelA.muted ? 'MUET' : 'ACTIF'}</span>
              </button>
            </div>
          </div>

          {/* Device Selection Selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Appareil Cible (Bluetooth / Sortie Audio)</span>
              {channelA.deviceId.includes('virtual') && (
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Mode Simulée
                </span>
              )}
            </label>
            <select
              value={channelA.deviceId}
              onChange={(e) => onSetSinkDevice('A', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.isBluetooth ? '🎧 ' : '🔊 '}
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control Fader */}
          <div className="mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Volume Périphérique A</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {Math.round(channelA.volume * 100)}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({getDbValue(channelA.volume)})
                </span>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={channelA.volume}
                onChange={(e) => onUpdateChannel('A', { volume: parseFloat(e.target.value) })}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Signal VU Meter Animation */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-slate-500 font-mono w-8">VU</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                {[...Array(20)].map((_, i) => {
                  const threshold = (i + 1) / 20;
                  const active = isPlaying && !channelA.muted && channelA.volume > 0 && Math.random() < channelA.volume * 0.9;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-full rounded-xs transition-opacity duration-75 ${
                        i > 16 ? 'bg-rose-500' : i > 12 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ opacity: active ? 1 : 0.15 }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sub Controls: Stereo Pan & Bass Boost & EQ Modal */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Pan Knob Slider */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span>Panoramique (G/D)</span>
                <span className="font-mono text-cyan-400">
                  {channelA.pan === 0 ? 'Centre' : channelA.pan < 0 ? `G ${Math.round(-channelA.pan * 100)}%` : `D ${Math.round(channelA.pan * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={channelA.pan}
                onChange={(e) => onUpdateChannel('A', { pan: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Bass Boost Switch */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Bass Boost</span>
                <span className="text-[10px] text-slate-500">+6 dB (60 Hz)</span>
              </div>
              <button
                onClick={() => onUpdateChannel('A', { bassBoost: !channelA.bassBoost })}
                className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                  channelA.bassBoost ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* EQ Modal Opener */}
          <button
            onClick={() => onOpenEQModal('A')}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ouvrir l'Égaliseur 5 Bandes (Sortie A)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* CHANNEL B CARD */}
        {/* ======================================================== */}
        <div
          className={`bg-slate-900/90 rounded-2xl p-5 border transition-all relative overflow-hidden ${
            channelB.isSolo
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
              : channelB.muted
              ? 'border-slate-800 opacity-80'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Top Channel Header */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Bluetooth className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    SORTIE B
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Périphérique 2</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Solo Button */}
              <button
                onClick={() => onUpdateChannel('B', { isSolo: !channelB.isSolo })}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                  channelB.isSolo
                    ? 'bg-purple-500 text-slate-950 border-purple-400 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                SOLO
              </button>

              {/* Mute Button */}
              <button
                onClick={() => onUpdateChannel('B', { muted: !channelB.muted })}
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  channelB.muted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {channelB.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{channelB.muted ? 'MUET' : 'ACTIF'}</span>
              </button>
            </div>
          </div>

          {/* Device Selection Selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Appareil Cible (Bluetooth / Sortie Audio)</span>
              {channelB.deviceId.includes('virtual') && (
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  Mode Simulée
                </span>
              )}
            </label>
            <select
              value={channelB.deviceId}
              onChange={(e) => onSetSinkDevice('B', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.isBluetooth ? '🎧 ' : '🔊 '}
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control Fader */}
          <div className="mb-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Volume Périphérique B</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {Math.round(channelB.volume * 100)}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({getDbValue(channelB.volume)})
                </span>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                value={channelB.volume}
                onChange={(e) => onUpdateChannel('B', { volume: parseFloat(e.target.value) })}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Signal VU Meter Animation */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-slate-500 font-mono w-8">VU</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                {[...Array(20)].map((_, i) => {
                  const active = isPlaying && !channelB.muted && channelB.volume > 0 && Math.random() < channelB.volume * 0.9;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-full rounded-xs transition-opacity duration-75 ${
                        i > 16 ? 'bg-rose-500' : i > 12 ? 'bg-amber-400' : 'bg-purple-400'
                      }`}
                      style={{ opacity: active ? 1 : 0.15 }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Latency Compensation / Delay Offset Sync Slider (Crucial for Bluetooth Sync!) */}
          <div className="mb-4 bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Compensation Latence Bluetooth B</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  +{channelB.delayMs} ms
                </span>
                <button
                  onClick={() => onUpdateChannel('B', { delayMs: 0 })}
                  className="text-[10px] p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Réinitialiser le délai"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateChannel('B', { delayMs: Math.max(0, channelB.delayMs - 10) })}
                className="px-2 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                -10ms
              </button>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={channelB.delayMs}
                onChange={(e) => onUpdateChannel('B', { delayMs: parseInt(e.target.value) })}
                className="flex-1 accent-indigo-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => onUpdateChannel('B', { delayMs: Math.min(500, channelB.delayMs + 10) })}
                className="px-2 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                +10ms
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Élimine l'effet d'écho si vos deux casques/enceintes Bluetooth ont des temps de réponse différents.
            </p>
          </div>

          {/* Sub Controls: Stereo Pan & Bass Boost & EQ Modal */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Pan Knob Slider */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span>Panoramique (G/D)</span>
                <span className="font-mono text-purple-400">
                  {channelB.pan === 0 ? 'Centre' : channelB.pan < 0 ? `G ${Math.round(-channelB.pan * 100)}%` : `D ${Math.round(channelB.pan * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={channelB.pan}
                onChange={(e) => onUpdateChannel('B', { pan: parseFloat(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Bass Boost Switch */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Bass Boost</span>
                <span className="text-[10px] text-slate-500">+6 dB (60 Hz)</span>
              </div>
              <button
                onClick={() => onUpdateChannel('B', { bassBoost: !channelB.bassBoost })}
                className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                  channelB.bassBoost ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* EQ Modal Opener */}
          <button
            onClick={() => onOpenEQModal('B')}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Ouvrir l'Égaliseur 5 Bandes (Sortie B)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MASTER VOLUME & STEREO SEPARATION BAR */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Master Volume Slider */}
        <div className="w-full md:w-1/2 flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-white whitespace-nowrap">Volume Master</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onUpdateMasterVolume(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
          <span className="text-xs font-mono font-bold text-indigo-300 w-12 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* Mono / Stereo Split Mode Toggle */}
        <div className="w-full md:w-1/2 flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white block">Mode Séparation Stéréo</span>
              <span className="text-[10px] text-slate-400">
                {monoSplitMode ? 'Canal Gauche -> Appareil A, Canal Droit -> Appareil B' : 'Stéréo Intégrale envoyée sur les deux appareils'}
              </span>
            </div>
          </div>

          <button
            onClick={onToggleMonoSplit}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              monoSplitMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {monoSplitMode ? 'SPLIT G/D' : 'DUAL STÉRÉO'}
          </button>
        </div>
      </div>
    </div>
  );
};
