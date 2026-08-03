import React from 'react';
import { X, RotateCcw, Sliders, Zap } from 'lucide-react';
import { ChannelSettings } from '../types';

interface EqualizerModalProps {
  channel: 'A' | 'B';
  settings: ChannelSettings;
  onUpdate: (settings: Partial<ChannelSettings>) => void;
  onClose: () => void;
}

const EQ_PRESETS: { name: string; gains: number[] }[] = [
  { name: 'Plat (Flat)', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost (Basses Puissantes)', gains: [8, 5, 1, 0, 0] },
  { name: 'Electronic / Club', gains: [6, 3, -1, 4, 5] },
  { name: 'Rock / Pop', gains: [4, -2, 2, 5, 4] },
  { name: 'Voix / Podcasts', gains: [-3, 2, 5, 3, -1] },
  { name: 'Acoustic / Jazz', gains: [3, 2, 1, 3, 4] },
];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  channel,
  settings,
  onUpdate,
  onClose,
}) => {
  const isA = channel === 'A';
  const themeColor = isA ? 'text-cyan-400' : 'text-purple-400';
  const themeBg = isA ? 'bg-cyan-500' : 'bg-purple-500';
  const themeBorder = isA ? 'border-cyan-500/40' : 'border-purple-500/40';

  const handleGainChange = (index: number, val: number) => {
    const newGains = [...settings.eqGains];
    newGains[index] = val;
    onUpdate({ eqGains: newGains });
  };

  const FREQ_LABELS = ['60 Hz', '230 Hz', '910 Hz', '4 kHz', '14 kHz'];
  const BAND_NAMES = ['Sub Bass', 'Bass', 'Mids', 'Highs', 'Treble'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${isA ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Égaliseur 5 Bandes</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${isA ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                Périphérique {channel}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ajustez les fréquences audio spécifiquement pour la sortie {channel}
            </p>
          </div>
        </div>

        {/* EQ Presets Bar */}
        <div className="my-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Préréglages d'Égalisation
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EQ_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onUpdate({ eqGains: preset.gains })}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Band Faders */}
        <div className="grid grid-cols-5 gap-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 my-5">
          {settings.eqGains.map((gain, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                {gain > 0 ? `+${gain}` : gain} dB
              </span>

              <div className="h-36 flex items-center py-2">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gain}
                  onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                  className={`h-32 appearance-none cursor-pointer rounded-lg bg-slate-800 ${isA ? 'accent-cyan-400' : 'accent-purple-400'}`}
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-white block leading-none mb-0.5">
                  {FREQ_LABELS[index]}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {BAND_NAMES[index]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sub Controls: Bass Boost & Reset */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ bassBoost: !settings.bassBoost })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                settings.bassBoost
                  ? `${isA ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-purple-500/20 text-purple-400 border-purple-500/40'}`
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Bass Boost (+6dB)</span>
            </button>
          </div>

          <button
            onClick={() => onUpdate({ eqGains: [0, 0, 0, 0, 0], bassBoost: false })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser à zéro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
