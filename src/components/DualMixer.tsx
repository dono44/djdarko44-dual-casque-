import React, { useState } from 'react';
import {
  Volume2,
  Sliders,
  Bluetooth,
  Disc,
  Activity,
  Headphones,
  Speaker,
  Smartphone,
  Plus,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { DualMixerState, AudioOutputDevice, ChannelSettings } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { audioEngineInstance } from '../utils/audioEngine';

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
  onOpenEQModal,
  isPlaying,
}) => {
  const { channelA, masterVolume } = mixerState;

  // Simple local states for EQ preview
  const [bassLevel, setBassLevel] = useState(channelA.eqGains[0] || 0);
  const [midLevel, setMidLevel] = useState(channelA.eqGains[2] || 0);
  const [trebleLevel, setTrebleLevel] = useState(channelA.eqGains[4] || 0);

  const [customDeviceName, setCustomDeviceName] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  const activeDevice = devices.find((d) => d.deviceId === channelA.deviceId) || devices[0];

  const handleEqChange = (bandIndex: number, val: number) => {
    const newGains = [...channelA.eqGains];
    newGains[bandIndex] = val;
    onUpdateChannel('A', { eqGains: newGains });
    onUpdateChannel('B', { eqGains: newGains });
  };

  const handlePromptSelectDevice = async () => {
    triggerHaptic('medium');
    const selected = await audioEngineInstance.promptSelectAudioOutput();
    if (selected) {
      onSetSinkDevice('A', selected.deviceId);
      onSetSinkDevice('B', selected.deviceId);
    }
  };

  const handleScanAndConnect = async () => {
    triggerHaptic('heavy');
    // Try Web Bluetooth scan first, fallback to promptSelectAudioOutput
    let selected = await audioEngineInstance.scanWebBluetoothDevice();
    if (!selected) {
      selected = await audioEngineInstance.promptSelectAudioOutput();
    }
    if (selected) {
      onSetSinkDevice('A', selected.deviceId);
      onSetSinkDevice('B', selected.deviceId);
      setShowAddCustomModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Bluetooth & Output Choice Card */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 animate-pulse">
              <Bluetooth className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white font-mono tracking-wider uppercase">
                  CHOIX DU CASQUE OU ENCEINTE BLUETOOTH
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Direct Output
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sélectionnez le casque ou l'enceinte Bluetooth sur lequel diffuser le son.
              </p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleScanAndConnect}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <Bluetooth className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>📱 Scanner & Ajouter un Appareil Bluetooth</span>
            </button>
          </div>
        </div>

        {/* Quick Device Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {devices.map((device) => {
            const isSelected = channelA.deviceId === device.deviceId;
            return (
              <button
                key={device.deviceId}
                onClick={() => {
                  triggerHaptic('medium');
                  onSetSinkDevice('A', device.deviceId);
                  onSetSinkDevice('B', device.deviceId);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/90 to-slate-900 border-cyan-400 shadow-md shadow-cyan-500/20 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {device.label.toLowerCase().includes('enceinte') || device.label.toLowerCase().includes('speaker') ? (
                    <Speaker className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  ) : (
                    <Headphones className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{device.label}</p>
                    <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <span>• Bluetooth Audio</span>
                      {isSelected && <span className="text-emerald-400 font-bold">(Actif)</span>}
                    </p>
                  </div>
                </div>

                {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal: Bluetooth Scanner & Devices List */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-cyan-400" />
                Appareils Bluetooth Scannés
              </h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Voici les appareils Bluetooth disponibles. Vous pouvez lancer un scan pour détecter vos casques ou enceintes à proximité :
            </p>

            <button
              onClick={handleScanAndConnect}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>🔍 Lancer le Scan Bluetooth Proche</span>
            </button>

            <div className="mt-2 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                Appareils Connectés / Détectés ({devices.length}) :
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {devices.map((d) => (
                  <button
                    key={d.deviceId}
                    onClick={() => {
                      triggerHaptic('medium');
                      onSetSinkDevice('A', d.deviceId);
                      onSetSinkDevice('B', d.deviceId);
                      setShowAddCustomModal(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs font-bold text-white transition-all"
                  >
                    <span className="truncate">{d.label}</span>
                    <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      Connecter
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main DJ Control Console */}
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Disc className={`w-6 h-6 text-cyan-400 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            <div>
              <h2 className="text-base font-black text-white font-mono tracking-wider">
                DJ DARKO44 • CONSOLE MASTER
              </h2>
              <p className="text-xs text-slate-400">
                Réglage du volume général, basses, aigus et balance stéréo
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenEQModal('A')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Égaliseur 5 Bandes Dédié</span>
          </button>
        </div>

        {/* Master Volume Slider */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Volume Général (Master Volume)</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => {
              onUpdateMasterVolume(parseFloat(e.target.value));
            }}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Quick EQ Faders (Basses, Médiums, Aigus) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Basses */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Basses (Low)</span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {bassLevel > 0 ? `+${bassLevel}` : bassLevel} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={bassLevel}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setBassLevel(val);
                handleEqChange(0, val);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-12dB</span>
              <span>0dB</span>
              <span>+12dB</span>
            </div>
          </div>

          {/* Médiums */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Médiums (Mid)</span>
              <span className="text-[11px] font-mono text-purple-400 font-bold">
                {midLevel > 0 ? `+${midLevel}` : midLevel} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={midLevel}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMidLevel(val);
                handleEqChange(2, val);
              }}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-12dB</span>
              <span>0dB</span>
              <span>+12dB</span>
            </div>
          </div>

          {/* Aigus */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Aigus (High)</span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {trebleLevel > 0 ? `+${trebleLevel}` : trebleLevel} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={trebleLevel}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTrebleLevel(val);
                handleEqChange(4, val);
              }}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-12dB</span>
              <span>0dB</span>
              <span>+12dB</span>
            </div>
          </div>
        </div>

        {/* Stereo Balance (Pan Left / Right) */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">Balance Stéréo Gauche / Droite</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-cyan-400 font-bold">G</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={channelA.pan}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateChannel('A', { pan: val });
                onUpdateChannel('B', { pan: val });
              }}
              className="w-full sm:w-36 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs text-purple-400 font-bold">D</span>
            <button
              onClick={() => {
                onUpdateChannel('A', { pan: 0 });
                onUpdateChannel('B', { pan: 0 });
              }}
              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold"
            >
              Centre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
