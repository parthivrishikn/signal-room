import { NextResponse } from 'next/server';
import { generateInitialTelemetry } from '@/lib/dataGenerator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : 1000;

  const safeCount = Math.min(Math.max(count || 1000, 100), 10000);
  const data = generateInitialTelemetry(safeCount);

  return NextResponse.json({
    status: 'ok',
    count: data.records.length,
    timestamp: Date.now(),
    data: data.records,
    incidents: data.incidents,
  });
}
