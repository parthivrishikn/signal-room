import { useState, useEffect, useRef } from 'react';
import { PerformanceStats } from '@/lib/types';
import { PerformanceTracker } from '@/lib/performanceUtils';

export function usePerformanceMonitor(datasetSize: number, visiblePoints: number) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.6,
    renderTime: 1.2,
    processingTime: 0.5,
    datasetSize,
    visiblePoints,
    memoryUsage: 'Measuring...',
    status: 'Healthy',
  });

  const trackerRef = useRef<PerformanceTracker>(new PerformanceTracker());
  const renderTimeRef = useRef<number>(1.2);
  const procTimeRef = useRef<number>(0.5);

  const recordRenderTime = (timeMs: number) => {
    renderTimeRef.current = parseFloat(timeMs.toFixed(2));
  };

  const recordProcessingTime = (timeMs: number) => {
    procTimeRef.current = parseFloat(timeMs.toFixed(2));
  };

  useEffect(() => {
    let animId: number;
    let lastUiUpdate = performance.now();

    const loop = (now: number) => {
      const { fps, frameTime } = trackerRef.current.registerFrame(now);

      // Throttle React state updates for the HUD to ~200ms to avoid hurting render FPS
      if (now - lastUiUpdate > 200) {
        lastUiUpdate = now;
        const mem = trackerRef.current.getMemoryUsage();
        const status = trackerRef.current.getStatus(fps);

        setStats({
          fps,
          frameTime,
          renderTime: renderTimeRef.current,
          processingTime: procTimeRef.current,
          datasetSize,
          visiblePoints,
          memoryUsage: mem,
          status,
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [datasetSize, visiblePoints]);

  return {
    stats,
    recordRenderTime,
    recordProcessingTime,
  };
}
