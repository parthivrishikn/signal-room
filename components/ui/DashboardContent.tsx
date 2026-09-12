'use client';

import React, { useMemo } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { Header } from '@/components/ui/Header';
import { MetricCard } from '@/components/ui/MetricCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { Heatmap } from '@/components/charts/Heatmap';
import { IncidentTimeline } from '@/components/controls/IncidentTimeline';
import { DataTable } from '@/components/ui/DataTable';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export function DashboardContent() {
  const { bufferRef, dataVersion, totalPoints } = useTelemetryData();

  // Performance tracking
  const { stats, recordRenderTime, recordProcessingTime } = usePerformanceMonitor(
    totalPoints,
    Math.min(totalPoints, 1200)
  );

  // Compute live aggregates and trends for metric cards
  const metricsData = useMemo(() => {
    const t0 = performance.now();
    const records = bufferRef.current;
    if (records.length === 0) {
      return {
        rps: '0',
        rpsTrend: [0],
        errors: '0.000',
        errorsTrend: [0],
        cpu: '0%',
        cpuTrend: [0],
        memory: '0 GB',
        memoryTrend: [0],
      };
    }

    const recent = records.slice(-40);
    const last = records[records.length - 1];

    const rpsTrend = recent.map((r) => r.requests);
    const errorsTrend = recent.map((r) => r.errors);
    const cpuTrend = recent.map((r) => r.cpu);
    const memoryTrend = recent.map((r) => r.memory);

    const t1 = performance.now();
    recordProcessingTime(t1 - t0);

    return {
      rps: last.requests.toLocaleString(),
      rpsTrend,
      errors: last.errors.toFixed(3),
      errorsTrend,
      cpu: `${last.cpu}%`,
      cpuTrend,
      memory: `${(last.memory / 1024).toFixed(2)} GB`,
      memoryTrend,
    };
  }, [bufferRef, dataVersion, recordProcessingTime]);

  return (
    <div className="flex flex-col min-h-screen bg-telemetry-bg text-telemetry-text">
      {/* Header */}
      <Header />

      <main className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-[1680px] w-full mx-auto">
        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Throughput"
            value={metricsData.rps}
            unit="req/s"
            change="steady"
            trend={metricsData.rpsTrend}
            color="#22c55e"
            subtext="Inbound cluster requests"
          />
          <MetricCard
            label="Error Rate"
            value={metricsData.errors}
            unit="%"
            change={parseFloat(metricsData.errors) > 0.2 ? 'spike' : 'nominal'}
            trend={metricsData.errorsTrend}
            color="#ef4444"
            subtext="HTTP 5xx error frequency"
          />
          <MetricCard
            label="CPU Utilization"
            value={metricsData.cpu}
            unit=""
            trend={metricsData.cpuTrend}
            color="#f59e0b"
            subtext="Aggregate compute load"
          />
          <MetricCard
            label="Memory Footprint"
            value={metricsData.memory}
            unit=""
            trend={metricsData.memoryTrend}
            color="#a855f7"
            subtext="Allocated container RAM"
          />
        </div>

        {/* Primary Chart & Incident Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Main Line Chart (8 cols) */}
          <div className="lg:col-span-8 min-h-[380px]">
            <LineChart onRenderTime={recordRenderTime} />
          </div>

          {/* Incident Timeline (4 cols) */}
          <div className="lg:col-span-4 min-h-[380px]">
            <IncidentTimeline />
          </div>
        </div>

        {/* Secondary Visualizations (3 Columns: Bar, Scatter, Heatmap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BarChart />
          <ScatterPlot />
          <Heatmap />
        </div>

        {/* Real-time Performance HUD */}
        <PerformanceMonitor stats={stats} />

        {/* Virtualized Telemetry Table */}
        <DataTable />
      </main>

      {/* Footer */}
      <footer className="border-t border-telemetry-border px-4 py-2 bg-telemetry-surface text-[11px] font-mono text-telemetry-dim flex flex-wrap items-center justify-between">
        <div>SIGNAL ROOM v1.0 • PURE CANVAS &amp; SVG RENDERING ENGINE • NO EXTERNAL CHART LIBS</div>
        <div>CLIENT-SIDE SIMULATION • NEXT.JS APP ROUTER</div>
      </footer>
    </div>
  );
}
