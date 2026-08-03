import React, { useState } from 'react';
import {
  X,
  Bluetooth,
  HelpCircle,
  Volume2,
  CheckCircle,
  Monitor,
  Smartphone,
  Info,
  Play
} from 'lucide-react';
import { audioEngineInstance } from '../utils/audioEngine';

interface BluetoothGuideModalProps {
  onClose: () => void;
  onScanDevices: () => void;
}

export const BluetoothGuideModal: React.FC<BluetoothGuideModalProps> = ({
  onClose,
  onScanDevices,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'chrome' | 'windows' | 'mac'>('android');
  const [testPlaying, setTestPlaying] = useState<'A' | 'B' | null>(null);

  const handleTestSound = async (channel: 'A' | 'B') => {
    setTestPlaying(channel);
    // Play short test tone on that specific channel using Web Audio oscillator
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(channel === 'A' ? 440 : 880, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);

      setTimeout(() => {
        setTestPlaying(null);
      }, 1300);
    } catch (err) {
      console.error(err);
      setTestPlaying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Guide de Connexion & Diffusion Double Bluetooth
              </h3>
              <p className="text-xs text-slate-400">
                Comment appairer et diffuser simultanément sur 2 casques ou enceintes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Sound Generators */}
        <div className="my-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white block">Test Sonore Indépendant</span>
            <span className="text-[11px] text-slate-400">
              Émettez un signal de test (La 440Hz / 880Hz) pour valider l'attribution des canaux.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestSound('A')}
              disabled={testPlaying !== null}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>{testPlaying === 'A' ? 'Test A...' : 'Tester Appareil A'}</span>
            </button>
            <button
              onClick={() => handleTestSound('B')}
              disabled={testPlaying !== null}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span>{testPlaying === 'B' ? 'Test B...' : 'Tester Appareil B'}</span>
            </button>
          </div>
        </div>

        {/* Operating System Tabs */}
        <div className="flex border-b border-slate-800 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('chrome')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'chrome'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Navigateur Chrome / Edge
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'windows'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Windows 10 / 11
          </button>
          <button
            onClick={() => setActiveTab('mac')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'mac'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            macOS (Audio MIDI)
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'android'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Android Dual Audio
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 pr-1">
          {activeTab === 'chrome' && (
            <div className="space-y-3">
              <div className="flex gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-1">Routage Direct via l'API Web Audio (setSinkId)</h4>
                  <p className="leading-relaxed">
                    Votre navigateur prend en charge l'API de sélection de périphérique audio.
                    Pour autoriser l'affichage des vrais noms de vos appareils Bluetooth (ex: JBL Flip 6, AirPods) :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 mt-2 text-slate-400">
                    <li>Cliquez sur le bouton <strong>"Scanner Périphériques"</strong> dans l'en-tête.</li>
                    <li>Autorisez l'accès audio dans la pop-up de permission de votre navigateur.</li>
                    <li>Sélectionnez votre premier appareil dans le menu déroulant <strong>Sortie A</strong>.</li>
                    <li>Sélectionnez votre second appareil dans le menu déroulant <strong>Sortie B</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-cyan-300">
                💡 <strong>Astuce Latence :</strong> Si une des enceintes Bluetooth accuse un retard par rapport à l'autre (effet d'écho), utilisez le curseur <strong>"Compensation Latence Bluetooth B"</strong> pour caler les 2 appareils à la milliseconde près.
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white mb-1.5">Configuration Windows (Deux casques / enceintes Bluetooth)</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Allez dans <strong>Paramètres Windows &gt; Bluetooth et appareils</strong> et connectez vos deux casques/enceintes.
                  </li>
                  <li>
                    Appuyez sur <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">Win + R</code>, tapez <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">mmsys.cpl</code> pour ouvrir le Panneau de configuration Son.
                  </li>
                  <li>
                    Dans l'application DJ DARKO44, attribuez <strong>Périphérique A</strong> au premier casque et <strong>Périphérique B</strong> au deuxième casque.
                  </li>
                  <li>
                    Si vos deux appareils partagent une sortie stéréo générale, activez la touche <strong>SPLIT G/D</strong> pour envoyer le canal gauche sur l'appareil 1 et le canal droit sur l'appareil 2.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'mac' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white mb-1.5">Création d'un Périphérique à sorties multiples sur macOS</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Ouvrez l'application <strong>Configuration MIDI audio</strong> (dans Applications &gt; Utilitaires).</li>
                  <li>Cliquez sur le bouton <strong>+</strong> en bas à gauche et choisissez <strong>Créer un périphérique à sorties multiples</strong>.</li>
                  <li>Cochez les deux périphériques Bluetooth connectés dans la liste de droite.</li>
                  <li>Dans DJ DARKO44, votre périphérique combiné apparaîtra directement avec le contrôle fluide du volume individuel.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-3">
              {/* Samsung Galaxy Dual Audio */}
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <h4 className="font-bold text-white text-sm">1. Samsung Galaxy (Fonction "Dual Audio")</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>Allez dans <strong>Paramètres &gt; Connexions &gt; Bluetooth</strong> et appairez vos 2 enceintes ou casques.</li>
                  <li>Faites glisser la barre de notification vers le bas et appuyez sur le bouton <strong>Média (Media Output)</strong>.</li>
                  <li>Cochez les <strong>deux appareils Bluetooth</strong> dans la liste pour les activer en même temps.</li>
                  <li>Revenez dans cette application et utilisez la slider <strong>Compensation Latence</strong> pour aligner le son sans aucun décalage.</li>
                </ol>
              </div>

              {/* Xiaomi & POCO Sound Share */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <h4 className="font-bold text-white text-sm">2. Xiaomi / POCO / Redmi (Partage Audio MIUI/HyperOS)</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>Connectez vos deux écouteurs Bluetooth au téléphone.</li>
                  <li>Ouvrez le volet de contrôle et appuyez longuement sur la tuile <strong>Bluetooth</strong> ou <strong>Audio Share</strong>.</li>
                  <li>Activez le partage audio simultané pour envoyer le flux stéréo vers les deux appareils.</li>
                </ol>
              </div>

              {/* Google Pixel / Stock Android */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  <h4 className="font-bold text-white text-sm">3. Google Pixel / Motorola / OnePlus (Sélecteur Média Android)</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>Lorsque la musique joue dans l'application, ouvrez le panneau de notification Android.</li>
                  <li>Appuyez sur l'icône de périphérique en haut à droite de la carte Média (Media Switcher).</li>
                  <li>Sélectionnez vos sorties Bluetooth connectées.</li>
                </ol>
              </div>

              {/* PWA & Haptics Tip */}
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-300 text-xs">
                📱 <strong>Astuce Android PWA :</strong> Vous pouvez installer cette application directement sur votre écran d'accueil Android en appuyant sur <strong>"Installer l'App Android"</strong> pour l'utiliser comme une vraie application native avec écran complet et contrôles sur l'écran de verrouillage!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
