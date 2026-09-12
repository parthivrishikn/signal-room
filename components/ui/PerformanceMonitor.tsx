'use client';

import React from 'react';
import { PerformanceStats } from '@/lib/types';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  stats: PerformanceStats;
}

export function PerformanceMonitor({ stats }: PerformanceMonitorProps) {
  const statusColors: Record<string, string> = {
    Healthy: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
    Degraded: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
    Heavy: 'text-rose-400 border-rose-500/40 bg-rose-950/20',
  };

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 text-xs font-mono">
      {/* Title + Health Status */}
      <div className="flex items-center justify-between pb-2 border-b border-telemetry-border mb-2.5">
        <div className="flex items-center gap-1.5 text-telemetry-muted font-semibold uppercase tracking-wider text-[11px]">
          <Activity size={13} className="text-telemetry-accent" />
          <span>Runtime Performance HUD</span>
        </div>

        <div
          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
            statusColors[stats.status] || statusColors.Healthy
          }`}
        >
          {stats.status.toUpperCase()}
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* FPS */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">FRAME RATE</div>
          <div className="text-base font-bold text-telemetry-text mt-0.5 flex items-baseline gap-1">
            <span
              className={
                stats.fps >= 55
                  ? 'text-emerald-400'
                  : stats.fps >= 30
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {stats.fps}
            </span>
            <span className="text-[10px] text-telemetry-muted">FPS</span>
          </div>
          <div className="text-[9px] text-telemetry-dim">Target: 60 FPS</div>
        </div>

        {/* Frame Time */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">FRAME TIME</div>
          <div className="text-base font-bold text-telemetry-text mt-0.5">
            {stats.frameTime} <span className="text-[10px] text-telemetry-muted">ms</span>
          </div>
          <div className="text-[9px] text-telemetry-dim">Budget: 16.6ms</div>
        </div>

        {/* Render Time */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">CANVAS RENDER</div>
          <div className="text-base font-bold text-telemetry-accent mt-0.5">
            {stats.renderTime} <span className="text-[10px] text-telemetry-muted">ms</span>
          </div>
          <div className="text-[9px] text-telemetry-dim">Direct 2D rAF</div>
        </div>

        {/* Processing Time */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">PROCESSING</div>
          <div className="text-base font-bold text-telemetry-text mt-0.5">
            {stats.processingTime} <span className="text-[10px] text-telemetry-muted">ms</span>
          </div>
          <div className="text-[9px] text-telemetry-dim">Stream compute</div>
        </div>

        {/* Dataset Size */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">BUFFER POINTS</div>
          <div className="text-base font-bold text-telemetry-text mt-0.5">
            {stats.datasetSize.toLocaleString()}
          </div>
          <div className="text-[9px] text-telemetry-dim">Active ring buffer</div>
        </div>

        {/* Visible Points */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border">
          <div className="text-[10px] text-telemetry-muted">VISIBLE POINTS</div>
          <div className="text-base font-bold text-telemetry-text mt-0.5">
            {stats.visiblePoints.toLocaleString()}
          </div>
          <div className="text-[9px] text-telemetry-dim">Downsampled view</div>
        </div>

        {/* Memory */}
        <div className="bg-telemetry-panel p-2 rounded border border-telemetry-border col-span-2 sm:col-span-1">
          <div className="text-[10px] text-telemetry-muted">JS HEAP</div>
          <div className="text-sm font-bold text-telemetry-text mt-0.5 truncate">
            {stats.memoryUsage}
          </div>
          <div className="text-[9px] text-telemetry-dim">performance.memory</div>
        </div>
      </div>
    </div>
  );
}
