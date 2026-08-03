import React, { useEffect, useRef, useState } from 'react';
import { Activity, BarChart2, Radio, Sliders } from 'lucide-react';
import { audioEngineInstance } from '../utils/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'dual-bars' | 'overlay' | 'waveform'>('dual-bars');

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background Grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = '#1e293b33';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 0; x < width; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      const dataA = audioEngineInstance.getSpectrumData('A');
      const dataB = audioEngineInstance.getSpectrumData('B');

      if (visualMode === 'dual-bars') {
        // Top half: Output A (Cyan), Bottom half: Output B (Purple)
        const barCount = Math.min(32, dataA.length);
        const barWidth = (width / barCount) - 2;

        // Channel A (Top half, growing upwards)
        const halfHeight = height / 2 - 4;
        for (let i = 0; i < barCount; i++) {
          const valA = isPlaying ? (dataA[i] || 0) : Math.sin(Date.now() / 300 + i * 0.2) * 15 + 15;
          const barHeightA = (valA / 255) * halfHeight;
          const x = i * (barWidth + 2);
          const y = halfHeight - barHeightA;

          const gradientA = ctx.createLinearGradient(0, y, 0, halfHeight);
          gradientA.addColorStop(0, '#22d3ee');
          gradientA.addColorStop(1, '#0284c7');

          ctx.fillStyle = gradientA;
          ctx.fillRect(x, y, barWidth, barHeightA);
        }

        // Center line divider
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Channel B (Bottom half, growing downwards)
        for (let i = 0; i < barCount; i++) {
          const valB = isPlaying ? (dataB[i] || 0) : Math.cos(Date.now() / 300 + i * 0.2) * 15 + 15;
          const barHeightB = (valB / 255) * halfHeight;
          const x = i * (barWidth + 2);
          const y = height / 2 + 4;

          const gradientB = ctx.createLinearGradient(0, y, 0, y + barHeightB);
          gradientB.addColorStop(0, '#c084fc');
          gradientB.addColorStop(1, '#7e22ce');

          ctx.fillStyle = gradientB;
          ctx.fillRect(x, y, barWidth, barHeightB);
        }
      } else if (visualMode === 'overlay') {
        // Full height overlay frequency spectrum
        const barCount = Math.min(64, dataA.length);
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const valA = isPlaying ? dataA[i] : 20;
          const valB = isPlaying ? dataB[i] : 20;

          const hA = (valA / 255) * height;
          const hB = (valB / 255) * height;

          const x = i * barWidth;

          // Bar A (Cyan transparent)
          ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.fillRect(x, height - hA, barWidth - 1, hA);

          // Bar B (Purple transparent)
          ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
          ctx.fillRect(x, height - hB, barWidth - 1, hB);
        }
      } else {
        // Waveform / Oscilloscope line
        ctx.lineWidth = 2;

        // Waveform A
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        const sliceWidthA = width / dataA.length;
        let xA = 0;
        for (let i = 0; i < dataA.length; i++) {
          const v = isPlaying ? dataA[i] / 128.0 : 1.0;
          const y = (v * height) / 4;
          if (i === 0) ctx.moveTo(xA, y);
          else ctx.lineTo(xA, y);
          xA += sliceWidthA;
        }
        ctx.stroke();

        // Waveform B
        ctx.strokeStyle = '#c084fc';
        ctx.beginPath();
        const sliceWidthB = width / dataB.length;
        let xB = 0;
        for (let i = 0; i < dataB.length; i++) {
          const v = isPlaying ? dataB[i] / 128.0 : 1.0;
          const y = height / 2 + (v * height) / 4;
          if (i === 0) ctx.moveTo(xB, y);
          else ctx.lineTo(xB, y);
          xB += sliceWidthB;
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, visualMode]);

  return (
    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Analyseur de Spectre Double Signal</span>
          <span className="text-[10px] text-slate-400">
            (<span className="text-cyan-400 font-semibold">Cyan: Sortie A</span> •{' '}
            <span className="text-purple-400 font-semibold">Violet: Sortie B</span>)
          </span>
        </div>

        {/* Visualizer Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setVisualMode('dual-bars')}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              visualMode === 'dual-bars'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual Spectres
          </button>
          <button
            onClick={() => setVisualMode('overlay')}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              visualMode === 'overlay'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Superposition
          </button>
          <button
            onClick={() => setVisualMode('waveform')}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              visualMode === 'waveform'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Oscilloscope
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={700}
          height={140}
          className="w-full h-32 block bg-slate-950"
        />
      </div>
    </div>
  );
};
