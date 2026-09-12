'use client';

import React, { useRef, useEffect } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { setupCanvasDPI } from '@/lib/canvasUtils';
import { SERVICES, REGIONS } from '@/lib/dataGenerator';

export function Heatmap() {
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

    const records = bufferRef.current.slice(-500);

    // Grid: Services (Y rows) x Regions (X cols)
    const padding = { top: 20, right: 10, bottom: 25, left: 65 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const cellW = plotW / REGIONS.length;
    const cellH = plotH / SERVICES.length;

    // Draw Column Headers (Regions)
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    REGIONS.forEach((region, colIdx) => {
      const x = padding.left + colIdx * cellW + cellW / 2;
      ctx.fillText(region.substring(0, 4), x, padding.top - 6);
    });

    // Draw Row Headers (Services)
    ctx.textAlign = 'right';
    SERVICES.forEach((srv, rowIdx) => {
      const y = padding.top + rowIdx * cellH + cellH / 2 + 3;
      ctx.fillText(srv.replace(' Gateway', '').substring(0, 6), padding.left - 6, y);
    });

    // Draw Cells
    SERVICES.forEach((srv, rowIdx) => {
      REGIONS.forEach((region, colIdx) => {
        const matching = records.filter((r) => r.service === srv && r.region === region);
        const avg =
          matching.length > 0
            ? matching.reduce((acc, r) => acc + r[filters.metric], 0) / matching.length
            : 0;

        // Color intensity based on metric
        let ratio = Math.min(1, Math.max(0.1, avg / 120));
        if (filters.metric === 'errors') ratio = Math.min(1, avg / 0.5);
        if (filters.metric === 'cpu') ratio = Math.min(1, avg / 100);

        // Heat color: cool slate/blue to warm amber/red
        const r = Math.round(30 + ratio * 200);
        const g = Math.round(50 + (1 - ratio) * 80);
        const b = Math.round(90 + (1 - ratio) * 120);

        const x = padding.left + colIdx * cellW + 1;
        const y = padding.top + rowIdx * cellH + 1;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, cellW - 2, cellH - 2);

        // Value text
        ctx.fillStyle = ratio > 0.6 ? '#ffffff' : '#94a3b8';
        ctx.font = '8px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(avg > 0 ? Math.round(avg).toString() : '-', x + cellW / 2, y + cellH / 2 + 3);
      });
    });
  }, [bufferRef, dataVersion, filters.metric]);

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 flex flex-col h-[220px]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-muted mb-2">
        Regional Heatmap ({filters.metric})
      </div>
      <div ref={containerRef} className="relative flex-1 w-full min-h-[140px]">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>
    </div>
  );
}
