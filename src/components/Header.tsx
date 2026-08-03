import React from 'react';
import { Bluetooth, Speaker, RefreshCw, HelpCircle, ShieldCheck, Cpu, Smartphone, Disc, Radio } from 'lucide-react';
import { AudioEngineCapabilities } from '../types';

interface HeaderProps {
  capabilities: AudioEngineCapabilities;
  onScanDevices: () => void;
  onOpenGuide: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  capabilities,
  onScanDevices,
  onOpenGuide,
  isScanning,
}) => {
  return (
    <header className="bg-slate-950/95 border-b border-cyan-500/30 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 py-3 shadow-lg shadow-cyan-950/40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Name: DJ DARKO44 */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-purple-600 p-0.5 shadow-md shadow-fuchsia-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Disc className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-slate-950 ring-2 ring-slate-950">
                44
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400 font-mono drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                  DJ DARKO44
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-widest uppercase">
                  Dual Audio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
                <Radio className="w-3 h-3 text-fuchsia-400 animate-pulse" />
                <span>Multi-Sortie Bluetooth & HP Téléphone</span>
              </p>
            </div>
          </div>

          <span className="inline-flex sm:hidden items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            <Smartphone className="w-3 h-3 text-emerald-400" /> Mobile
          </span>
        </div>

        {/* Action Controls & Capabilities Badges */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Device Scan Button */}
          <button
            onClick={onScanDevices}
            disabled={isScanning}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-cyan-500/10"
            title="Scanner et détecter les appareils Bluetooth connectés"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scan...' : 'Scan Bluetooth'}</span>
          </button>

          {/* Bluetooth Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-xs font-bold text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all active:scale-95 shadow-sm shadow-emerald-500/10"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guide Connect</span>
          </button>
        </div>
      </div>
    </header>
  );
};
