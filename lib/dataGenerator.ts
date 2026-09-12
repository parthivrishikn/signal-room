import { IncidentEvent, MetricType, RegionId, ServiceId, TelemetryRecord } from './types';

export const SERVICES: ServiceId[] = [
  'API Gateway',
  'Checkout',
  'Search',
  'Auth',
  'Media',
  'Notifications',
];

export const REGIONS: RegionId[] = [
  'Chennai',
  'Mumbai',
  'Singapore',
  'Frankfurt',
  'Virginia',
];

interface ServiceBaseline {
  latency: number; // ms
  requests: number; // req/sec
  errors: number; // %
  cpu: number; // %
  memory: number; // MB
  throughput: number; // MB/s
}

const BASELINES: Record<ServiceId, ServiceBaseline> = {
  'API Gateway': { latency: 24, requests: 4200, errors: 0.04, cpu: 36, memory: 1024, throughput: 190 },
  Checkout: { latency: 115, requests: 880, errors: 0.07, cpu: 55, memory: 2400, throughput: 42 },
  Search: { latency: 68, requests: 2200, errors: 0.03, cpu: 70, memory: 3800, throughput: 130 },
  Auth: { latency: 38, requests: 1750, errors: 0.02, cpu: 44, memory: 1450, throughput: 35 },
  Media: { latency: 145, requests: 640, errors: 0.10, cpu: 62, memory: 5200, throughput: 480 },
  Notifications: { latency: 48, requests: 1300, errors: 0.03, cpu: 30, memory: 820, throughput: 28 },
};

const REGION_LATENCY_OFFSET: Record<RegionId, number> = {
  Chennai: -4,
  Mumbai: -2,
  Singapore: 3,
  Frankfurt: 12,
  Virginia: 18,
};

// Simulation state to maintain continuity and correlation
let currentSpike: {
  active: boolean;
  service: ServiceId;
  region: RegionId;
  durationTicks: number;
  multiplier: number;
  type: 'latency' | 'errors' | 'cpu' | 'traffic';
} = {
  active: false,
  service: 'API Gateway',
  region: 'Mumbai',
  durationTicks: 0,
  multiplier: 1,
  type: 'latency',
};

let recordIdCounter = 1;

export function generateTelemetryPoint(
  timestamp: number = Date.now(),
  forcedService?: ServiceId,
  forcedRegion?: RegionId,
  stressMultiplier: number = 1.0
): { record: TelemetryRecord; incident?: IncidentEvent } {
  const service = forcedService ?? SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const region = forcedRegion ?? REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const base = BASELINES[service];

  // Random walk jitter (-5% to +5%)
  const jitter = (Math.random() - 0.5) * 0.1;
  const regionJitter = REGION_LATENCY_OFFSET[region];

  let incident: IncidentEvent | undefined = undefined;

  // Occasional correlated incident trigger (~0.4% chance per point, or higher if stress mode)
  if (!currentSpike.active && Math.random() < 0.005 * stressMultiplier) {
    const types: ('latency' | 'errors' | 'cpu' | 'traffic')[] = ['latency', 'errors', 'cpu', 'traffic'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    currentSpike = {
      active: true,
      service,
      region,
      durationTicks: Math.floor(15 + Math.random() * 25), // 15-40 ticks
      multiplier: 2.2 + Math.random() * 2.5,
      type: chosenType,
    };

    let title = '';
    let detail = '';
    if (chosenType === 'latency') {
      title = `Latency spike in ${service}`;
      detail = `P99 latency surged above ${Math.round(base.latency * currentSpike.multiplier)}ms in ${region}`;
    } else if (chosenType === 'errors') {
      title = `Error rate increase in ${service}`;
      detail = `HTTP 5xx rate reached ${(base.errors * currentSpike.multiplier).toFixed(2)}% in ${region}`;
    } else if (chosenType === 'cpu') {
      title = `CPU pressure on ${service}`;
      detail = `Node compute reached ${Math.min(99, Math.round(base.cpu * currentSpike.multiplier))}% in ${region}`;
    } else {
      title = `Traffic surge in ${service}`;
      detail = `Inbound throughput peaked at ${Math.round(base.throughput * currentSpike.multiplier)} MB/s in ${region}`;
    }

    incident = {
      id: `inc-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      service,
      region,
      type: chosenType,
      severity: currentSpike.multiplier > 3.0 ? 'critical' : 'warning',
      title,
      detail,
    };
  }

  // Calculate correlated values
  let latencyMult = 1;
  let errorMult = 1;
  let cpuMult = 1;
  let trafficMult = 1;

  if (currentSpike.active && currentSpike.service === service && currentSpike.region === region) {
    if (currentSpike.type === 'latency') {
      latencyMult = currentSpike.multiplier;
      cpuMult = 1 + (currentSpike.multiplier - 1) * 0.4;
      errorMult = 1 + (currentSpike.multiplier - 1) * 0.3;
    } else if (currentSpike.type === 'errors') {
      errorMult = currentSpike.multiplier * 3;
      latencyMult = 1 + (currentSpike.multiplier - 1) * 0.5;
    } else if (currentSpike.type === 'cpu') {
      cpuMult = currentSpike.multiplier;
      latencyMult = 1 + (currentSpike.multiplier - 1) * 0.6;
    } else if (currentSpike.type === 'traffic') {
      trafficMult = currentSpike.multiplier;
      cpuMult = 1 + (currentSpike.multiplier - 1) * 0.7;
      latencyMult = 1 + (currentSpike.multiplier - 1) * 0.3;
    }

    currentSpike.durationTicks -= 1;
    if (currentSpike.durationTicks <= 0) {
      currentSpike.active = false;
    }
  }

  const latency = Math.max(
    4,
    Math.round((base.latency + regionJitter) * (1 + jitter) * latencyMult * stressMultiplier)
  );
  const requests = Math.max(
    50,
    Math.round(base.requests * (1 + jitter * 0.6) * trafficMult * stressMultiplier)
  );
  const errors = Math.min(
    100,
    parseFloat((base.errors * (1 + (Math.random() - 0.4) * 0.2) * errorMult).toFixed(3))
  );
  const cpu = Math.min(
    99.5,
    parseFloat(Math.max(8, base.cpu * (1 + jitter * 0.5) * cpuMult).toFixed(1))
  );
  const memory = Math.round(
    base.memory + (Math.sin(timestamp / 60000) * 120) + (Math.random() * 40 - 20)
  );
  const throughput = Math.max(
    1,
    parseFloat((base.throughput * (1 + jitter) * trafficMult).toFixed(1))
  );

  const record: TelemetryRecord = {
    id: `rec-${recordIdCounter++}`,
    timestamp,
    service,
    region,
    latency,
    requests,
    errors,
    cpu,
    memory,
    throughput,
  };

  return { record, incident };
}

/**
 * Generate initial dataset spanning a historical window
 */
export function generateInitialTelemetry(count: number = 1000): {
  records: TelemetryRecord[];
  incidents: IncidentEvent[];
} {
  const records: TelemetryRecord[] = [];
  const incidents: IncidentEvent[] = [];
  const now = Date.now();
  const timeStepMs = 120; // roughly 120ms between points

  for (let i = count - 1; i >= 0; i--) {
    const t = now - (i * timeStepMs);
    const { record, incident } = generateTelemetryPoint(t);
    records.push(record);
    if (incident) {
      incidents.push(incident);
    }
  }

  return { records, incidents };
}
