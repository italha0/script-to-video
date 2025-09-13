import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAuthedClient } from '@/lib/supabase/server';
import { getRenderQueue } from '@/lib/queue';

// Force dynamic to avoid caching & ensure Node runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Character { id: string; name: string; color: string; avatar?: string }
interface Message { id: string; characterId: string; text: string; timestamp: number }
interface RequestBody { characters: Character[]; messages: Message[]; isPro?: boolean }

function getSupabaseServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, { cookies: { getAll() { return []; }, setAll() {} } });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured (SUPABASE_SERVICE_ROLE_KEY missing)' }, { status: 500 });
    }
    const body: RequestBody = await request.json();
    const { characters, messages } = body;
    if (!characters || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request: characters and messages are required' }, { status: 400 });
    }
    // Transform to Remotion props (same mapping as before)
    const hasYouId = characters.some((c) => c.id === 'you');
    const remotionMessages = messages.map((msg, index) => {
      const isOutgoing = hasYouId ? msg.characterId === 'you' : (characters[1] ? msg.characterId === characters[1].id : false);
      return { id: index + 1, text: msg.text, sent: isOutgoing, time: `0:${String(index * 2).padStart(2, '0')}` };
    });
    const contactCharacter = characters.find((c) => c.id === 'them') || characters[0];
    const inputProps = { messages: remotionMessages, contactName: contactCharacter?.name || 'Contact' };

    const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
    if (queueEnabled && !process.env.REDIS_URL) {
      return NextResponse.json({ error: 'Server not configured (REDIS_URL missing)' }, { status: 500 });
    }

    // Resolve user (optional)
    const authed = await createAuthedClient();
    const { data: userData } = await authed.auth.getUser();
    const userId = userData?.user?.id ?? null;

    // Create DB record and enqueue
    const jobId = randomUUID();
    const now = new Date().toISOString();
    const supabase = getSupabaseServiceRole();
    const { error } = await supabase.from('video_renders').insert({
      id: jobId,
      user_id: userId,
      status: 'pending',
      composition_id: 'MessageConversation',
      input_props: inputProps,
      created_at: now,
      updated_at: now,
    });
    if (error) return NextResponse.json({ error: 'DB insert failed', details: error.message }, { status: 500 });

    if (queueEnabled) {
      // Try enqueue; fail fast to avoid 504s
      try {
        const queue = getRenderQueue();
        const enqueue = queue.add('render', { jobId });
        await Promise.race([
          enqueue,
          new Promise((_, r) => setTimeout(() => r(new Error('enqueue-timeout')), 2000)),
        ]);
      } catch (e: any) {
        // Log only; we still return 202 and rely on worker polling fallback
        console.error('[API] Enqueue failed, will rely on polling worker', e?.message || e);
      }
    }

    return NextResponse.json(
      { jobId, statusUrl: `/api/render/${jobId}/status` },
      { status: 202 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
