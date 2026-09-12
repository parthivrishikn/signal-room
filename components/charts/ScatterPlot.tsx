'use client';

import React, { useRef, useEffect } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { setupCanvasDPI, scaleLinear, formatNumber } from '@/lib/canvasUtils';

export function ScatterPlot() {
  const { bufferRef, dataVersion, filters } = useTelemetryData();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width <= 0 || height <= 0) return;

    const ctx = setupCanvasDPI(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Sample recent points for correlation plot (e.g. 300 points)
    const records = bufferRef.current.slice(-300);
    if (records.length < 5) return;

    const padding = { top: 15, right: 15, bottom: 25, left: 35 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // X axis: Latency, Y axis: CPU
    const latencies = records.map((r) => r.latency);
    const cpus = records.map((r) => r.cpu);

    const minX = 0;
    const maxX = Math.max(...latencies, 150);
    const minY = 0;
    const maxY = 100; // CPU is 0-100%

    // Axes
    ctx.strokeStyle = '#252830';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('100%', padding.left - 4, padding.top + 5);
    ctx.fillText('0%', padding.left - 4, height - padding.bottom);

    ctx.textAlign = 'center';
    ctx.fillText(`${formatNumber(maxX)}ms`, width - padding.right, height - padding.bottom + 14);

    // Plot points with subtle alpha
    records.forEach((r) => {
      const x = scaleLinear(r.latency, minX, maxX, padding.left, width - padding.right);
      const y = scaleLinear(r.cpu, minY, maxY, height - padding.bottom, padding.top);

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = r.latency > 180 || r.cpu > 80 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.6)';
      ctx.fill();
    });
  }, [bufferRef, dataVersion]);

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 flex flex-col h-[220px]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-muted mb-2 flex justify-between">
        <span>Correlation: Latency vs. CPU</span>
        <span className="font-mono text-[10px] text-telemetry-dim">300 pts</span>
      </div>
      <div ref={containerRef} className="relative flex-1 w-full min-h-[140px]">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>
    </div>
  );
}
