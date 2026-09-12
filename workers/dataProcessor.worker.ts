import { MetricType, TelemetryRecord } from '@/lib/types';

export interface WorkerRequest {
  id: string;
  type: 'downsample_lttb' | 'aggregate_stats';
  payload: {
    records: TelemetryRecord[];
    targetPoints?: number;
    metric?: MetricType;
  };
}

export interface WorkerResponse {
  id: string;
  type: 'downsample_lttb' | 'aggregate_stats';
  durationMs: number;
  data: any;
}

/**
 * Largest Triangle Three Buckets (LTTB) Downsampling Algorithm
 * Preserves visual peaks, valleys, and local extremes for high-density time series.
 */
function lttbDownsample(
  data: TelemetryRecord[],
  threshold: number,
  metric: MetricType
): TelemetryRecord[] {
  if (threshold >= data.length || threshold === 0) {
    return data;
  }

  const sampled: TelemetryRecord[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always include the first point
  let aIndex = 0;
  sampled.push(data[aIndex]);

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (c)
    let cIndexStart = Math.floor((i + 1) * bucketSize) + 1;
    let cIndexEnd = Math.floor((i + 2) * bucketSize) + 1;
    cIndexEnd = Math.min(cIndexEnd, data.length);

    let avgX = 0;
    let avgY = 0;
    const cLength = cIndexEnd - cIndexStart;

    for (let c = cIndexStart; c < cIndexEnd; c++) {
      avgX += data[c].timestamp;
      avgY += data[c][metric];
    }
    avgX /= cLength || 1;
    avgY /= cLength || 1;

    // Current bucket range (b)
    let bIndexStart = Math.floor(i * bucketSize) + 1;
    let bIndexEnd = Math.floor((i + 1) * bucketSize) + 1;
    bIndexEnd = Math.min(bIndexEnd, data.length);

    // Point a
    const pointAX = data[aIndex].timestamp;
    const pointAY = data[aIndex][metric];

    let maxArea = -1;
    let maxAreaIndex = bIndexStart;

    for (let b = bIndexStart; b < bIndexEnd; b++) {
      // Area of triangle formed by point a, candidate point b, and average point c
      const area =
        Math.abs(
          (pointAX - avgX) * (data[b][metric] - pointAY) -
            (pointAX - data[b].timestamp) * (avgY - pointAY)
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = b;
      }
    }

    sampled.push(data[maxAreaIndex]);
    aIndex = maxAreaIndex; // Next a is this bucket's selected point
  }

  // Always include the last point
  sampled.push(data[data.length - 1]);
  return sampled;
}

/**
 * Statistical percentiles and summary compute
 */
function calculateStats(records: TelemetryRecord[], metric: MetricType) {
  if (records.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  }

  const values = records.map((r) => r[metric]).sort((a, b) => a - b);
  const sum = values.reduce((acc, v) => acc + v, 0);

  const getPercentile = (p: number) => {
    const idx = Math.floor(values.length * (p / 100));
    return values[Math.min(idx, values.length - 1)];
  };

  return {
    min: values[0],
    max: values[values.length - 1],
    avg: parseFloat((sum / values.length).toFixed(2)),
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
}

// Web Worker message listener
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;
  const t0 = performance.now();

  let result: any = null;

  if (type === 'downsample_lttb') {
    const target = payload.targetPoints || 1000;
    const metric = payload.metric || 'latency';
    result = lttbDownsample(payload.records, target, metric);
  } else if (type === 'aggregate_stats') {
    const metric = payload.metric || 'latency';
    result = calculateStats(payload.records, metric);
  }

  const durationMs = parseFloat((performance.now() - t0).toFixed(2));

  const response: WorkerResponse = {
    id,
    type,
    durationMs,
    data: result,
  };

  self.postMessage(response);
};

export {};
