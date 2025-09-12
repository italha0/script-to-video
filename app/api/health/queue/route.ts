import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
    const redisUrl = process.env.REDIS_URL || '';
    const hasRedisUrl = Boolean(redisUrl);
    const redisScheme = redisUrl ? (redisUrl.split(':')[0] || null) : null;
    const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    return NextResponse.json({
      queueEnabled,
      hasRedisUrl,
      redisScheme,
      supabaseConfigured,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
