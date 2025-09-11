import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, {
    cookies: { getAll() { return []; }, setAll() {} },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured (SUPABASE_SERVICE_ROLE_KEY missing)' }, { status: 500 });
    }

    const supabase = getSupabaseServiceRole();

    // Allow caller to override wait window (bounded)
    const url = new URL(req.url);
  // Hard cap to stay under provider function timeouts (override with env)
  const HARD_CAP = Number.parseInt(process.env.API_DOWNLOAD_MAX_WAIT_MS || '10000'); // 10s default
  const qMax = Number(url.searchParams.get('maxWaitMs'));
  const requested = Number.isFinite(qMax) ? Math.max(1000, Math.min(qMax, 10 * 60 * 1000)) : 20_000; // default 20s
  const maxWaitMs = Math.min(requested, HARD_CAP);

    const start = Date.now();
    let lastStatus: string | undefined;
    while (Date.now() - start < maxWaitMs) {
      const { data, error } = await supabase
        .from('video_renders')
        .select('status, url')
        .eq('id', params.jobId)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const { status, url: sasUrl } = data as { status: string; url: string | null };
      lastStatus = status;

      if (status === 'done' && sasUrl) {
        // 302 redirect to SAS URL for direct download
        const resp = NextResponse.redirect(sasUrl, 302);
        resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        resp.headers.set('Pragma', 'no-cache');
        return resp;
      }
      if (status === 'error') {
        return NextResponse.json({ error: 'Render failed' }, { status: 500 });
      }
      await sleep(1500);
    }

    // Timed out waiting — advise client to retry soon and provide status endpoint
  const res = NextResponse.json(
      { status: lastStatus || 'pending', statusUrl: `/api/render/${params.jobId}/status` },
      { status: 202 },
    );
    res.headers.set('Retry-After', '3');
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.headers.set('Pragma', 'no-cache');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
