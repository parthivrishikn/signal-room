'use client';

import React, { useRef, useEffect } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { setupCanvasDPI, formatNumber } from '@/lib/canvasUtils';
import { SERVICES } from '@/lib/dataGenerator';

export function BarChart() {
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

    // Calculate mean value per service over the last 500 points
    const records = bufferRef.current.slice(-500);
    const serviceMeans = SERVICES.map((srv) => {
      const matching = records.filter((r) => r.service === srv);
      if (matching.length === 0) return { service: srv, value: 0 };
      const avg =
        matching.reduce((acc, r) => acc + r[filters.metric], 0) / matching.length;
      return { service: srv, value: Math.round(avg * 10) / 10 };
    });

    const maxVal = Math.max(...serviceMeans.map((s) => s.value), 10);
    const padding = { top: 20, right: 15, bottom: 25, left: 40 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const barWidth = Math.min(plotW / SERVICES.length - 8, 36);
    const gap = (plotW - barWidth * SERVICES.length) / (SERVICES.length + 1);

    // Draw baseline grid
    ctx.strokeStyle = '#252830';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw bars
    serviceMeans.forEach((item, idx) => {
      const x = padding.left + gap + idx * (barWidth + gap);
      const barHeight = (item.value / maxVal) * plotH;
      const y = height - padding.bottom - barHeight;

      // Fill bar
      const isSelected = filters.service === item.service || filters.service === 'All';
      ctx.fillStyle = isSelected ? '#38bdf8' : '#484f58';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label below
      ctx.fillStyle = '#8b949e';
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      // Abbreviate service name if needed
      const shortName = item.service.replace(' Gateway', '').substring(0, 5);
      ctx.fillText(shortName, x + barWidth / 2, height - padding.bottom + 12);

      // Value above bar
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(formatNumber(item.value), x + barWidth / 2, Math.max(10, y - 4));
    });
  }, [bufferRef, dataVersion, filters.metric, filters.service]);

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 flex flex-col h-[220px]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-muted mb-2">
        Service Comparison (Avg {filters.metric})
      </div>
      <div ref={containerRef} className="relative flex-1 w-full min-h-[140px]">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>
    </div>
  );
}
