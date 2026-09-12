'use client';

import React, { useRef, useEffect } from 'react';
import { setupCanvasDPI } from '@/lib/canvasUtils';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = '#38bdf8',
  width = 90,
  height = 24,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = setupCanvasDPI(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const step = width / (data.length - 1);

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = height - 2 - ((data[i] - min) / range) * (height - 6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [data, color, width, height]);

  return <canvas ref={canvasRef} className="block shrink-0" />;
}
