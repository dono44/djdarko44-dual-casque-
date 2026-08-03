import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Sparkles,
  Download,
  Zap,
  Sliders,
  Bluetooth,
  Volume2,
  Layers,
  HelpCircle,
  Vibrate,
  Radio,
  ExternalLink
} from 'lucide-react';
import { triggerHaptic, isAndroidDevice } from '../utils/haptics';

interface AndroidModeCardProps {
  onApplyLatencyPreset: (channel: 'A' | 'B', ms: number) => void;
  onOpenAndroidGuide: () => void;
}

export const AndroidModeCard: React.FC<AndroidModeCardProps> = ({
  onApplyLatencyPreset,
  onOpenAndroidGuide,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [activeBrand, setActiveBrand] = useState<'samsung' | 'xiaomi' | 'pixel' | 'other'>('samsung');
  const [selectedLatencyPreset, setSelectedLatencyPreset] = useState<string>('aac');

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleSelectPreset = (presetKey: string, delayA: number, delayB: number) => {
    setSelectedLatencyPreset(presetKey);
    triggerHaptic('light');
    onApplyLatencyPreset('A', delayA);
    onApplyLatencyPreset('B', delayB);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side Info */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mode Spécial Android</span>
            </span>

            {isAndroidDevice() && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                📱 Appareil Android Détecté
              </span>
            )}

            {isInstalled && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> App Installée
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              DJ DARKO44 • Dual Output Android
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Diffusez votre son simultanément sur 2 casques/enceintes Bluetooth ou combinez 1 Bluetooth + le haut-parleur de votre téléphone.
            </p>
          </div>

          {/* Quick Latency Presets for Android */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Préréglages Latence Android:</span>

            <button
              onClick={() => handleSelectPreset('direct', 0, 0)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                selectedLatencyPreset === 'direct'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Direct (0 ms)
            </button>

            <button
              onClick={() => handleSelectPreset('sbc', 0, 120)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                selectedLatencyPreset === 'sbc'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              SBC Standard (+120 ms B)
            </button>

            <button
              onClick={() => handleSelectPreset('aac', 0, 80)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                selectedLatencyPreset === 'aac'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              AAC Bluetooth (+80 ms B)
            </button>

            <button
              onClick={() => handleSelectPreset('aptx', 0, 35)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                selectedLatencyPreset === 'aptx'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              aptX Low Latency (+35 ms B)
            </button>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex flex-wrap lg:flex-col items-stretch justify-center gap-2.5 min-w-[200px]">
          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Installer l'App Android</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAndroidGuide();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Guide Samsung & Android</span>
          </button>
        </div>
      </div>
    </div>
  );
};
