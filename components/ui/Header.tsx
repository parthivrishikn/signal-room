'use client';

import React from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { SERVICES, REGIONS } from '@/lib/dataGenerator';
import { MetricType, ServiceId, RegionId, TimeRange } from '@/lib/types';
import { Play, Pause, RotateCcw, Zap, Activity } from 'lucide-react';

export function Header() {
  const {
    isRunning,
    setIsRunning,
    resetStream,
    stressMode,
    setStressMode,
    totalPoints,
    bufferCapacity,
    setBufferCapacity,
    filters,
    setServiceFilter,
    setRegionFilter,
    setMetricFilter,
    setTimeRange,
  } = useTelemetryData();

  const metrics: { id: MetricType; label: string }[] = [
    { id: 'latency', label: 'Latency' },
    { id: 'requests', label: 'Requests' },
    { id: 'errors', label: 'Errors' },
    { id: 'cpu', label: 'CPU' },
    { id: 'memory', label: 'Memory' },
    { id: 'throughput', label: 'Throughput' },
  ];

  const timeRanges: TimeRange[] = ['1m', '5m', '1h'];
  const capacities = [1000, 5000, 10000, 25000, 50000];

  return (
    <header className="bg-telemetry-surface border-b border-telemetry-border px-4 py-2.5 flex flex-col gap-2.5">
      {/* Top row: Brand + Telemetry Stream Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-telemetry-live animate-pulse" />
            <span className="font-bold text-sm tracking-tight text-telemetry-text uppercase font-mono">
              Signal Room
            </span>
          </div>
          <span className="text-xs text-telemetry-dim hidden sm:inline">|</span>
          <span className="text-xs text-telemetry-muted hidden sm:inline">
            Live system telemetry, without the noise.
          </span>
        </div>

        {/* Live operational indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-telemetry-muted">Stream:</span>
            <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isRunning ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-telemetry-muted">Points:</span>
            <span className="text-telemetry-text font-bold">
              {totalPoints.toLocaleString()}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-telemetry-dim">
            <span className="px-1.5 py-0.5 bg-telemetry-panel rounded border border-telemetry-border text-[11px] text-telemetry-muted">
              60 FPS Target
            </span>
            <span className="px-1.5 py-0.5 bg-telemetry-panel rounded border border-telemetry-border text-[11px] text-telemetry-muted">
              &lt;100ms Latency Target
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Controls, Filters & Dataset size */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-telemetry-border/60">
        {/* Stream Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              isRunning
                ? 'bg-telemetry-panel hover:bg-telemetry-border text-telemetry-text border-telemetry-border'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 font-bold'
            }`}
          >
            {isRunning ? <Pause size={12} /> : <Play size={12} />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={resetStream}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-telemetry-panel hover:bg-telemetry-border text-telemetry-muted hover:text-white border border-telemetry-border transition-colors"
            title="Reset telemetry buffer"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          {/* Stress test button */}
          <button
            onClick={() => setStressMode(!stressMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              stressMode
                ? 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse font-bold'
                : 'bg-telemetry-panel hover:bg-telemetry-border text-telemetry-muted border-telemetry-border'
            }`}
          >
            <Zap size={12} className={stressMode ? 'text-rose-400' : ''} />
            <span>Stress: {stressMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Service filter */}
          <select
            value={filters.service}
            onChange={(e) => setServiceFilter(e.target.value as ServiceId | 'All')}
            aria-label="Filter by Service"
            className="bg-telemetry-panel text-telemetry-text border border-telemetry-border rounded px-2 py-1 text-xs focus:outline-none focus:border-telemetry-accent"
          >
            <option value="All">Service: All</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Region filter */}
          <select
            value={filters.region}
            onChange={(e) => setRegionFilter(e.target.value as RegionId | 'All')}
            aria-label="Filter by Region"
            className="bg-telemetry-panel text-telemetry-text border border-telemetry-border rounded px-2 py-1 text-xs focus:outline-none focus:border-telemetry-accent"
          >
            <option value="All">Region: All</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Metric selector */}
          <select
            value={filters.metric}
            onChange={(e) => setMetricFilter(e.target.value as MetricType)}
            aria-label="Select Metric"
            className="bg-telemetry-panel text-telemetry-accent border border-telemetry-border rounded px-2 py-1 text-xs font-medium focus:outline-none focus:border-telemetry-accent"
          >
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                Metric: {m.label}
              </option>
            ))}
          </select>

          {/* Time range buttons */}
          <div className="flex items-center bg-telemetry-panel rounded border border-telemetry-border p-0.5">
            {timeRanges.map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  filters.timeRange === r
                    ? 'bg-telemetry-border text-telemetry-text font-bold'
                    : 'text-telemetry-muted hover:text-telemetry-text'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Buffer capacity selector */}
          <select
            value={bufferCapacity}
            onChange={(e) => setBufferCapacity(parseInt(e.target.value, 10))}
            aria-label="Dataset Buffer Size"
            className="bg-telemetry-panel text-telemetry-muted border border-telemetry-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-telemetry-accent"
          >
            {capacities.map((c) => (
              <option key={c} value={c}>
                Buffer: {c.toLocaleString()} pts
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
