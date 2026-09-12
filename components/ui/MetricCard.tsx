'use client';

import React from 'react';
import { Sparkline } from '@/components/charts/Sparkline';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  change?: string;
  trend: number[];
  color?: string;
  subtext?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  change,
  trend,
  color = '#38bdf8',
  subtext,
}: MetricCardProps) {
  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[11px] text-telemetry-muted uppercase tracking-wider font-semibold">
        <span>{label}</span>
        {change && (
          <span className="font-mono text-[10px] text-telemetry-live">{change}</span>
        )}
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-mono font-bold text-telemetry-text">{value}</span>
          <span className="text-xs font-mono text-telemetry-muted">{unit}</span>
        </div>
        <Sparkline data={trend} color={color} width={80} height={24} />
      </div>

      {subtext && (
        <div className="text-[10px] font-mono text-telemetry-dim mt-1 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
