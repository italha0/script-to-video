import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRenderQueue } from '@/lib/queue';
import { createClient as createAuthedClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RenderRequestBody {
	compositionId?: string; // default MessageConversation
	inputProps: any; // Arbitrary JSON used by Remotion
}

function getSupabaseServiceRole() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // prefer service role to insert server-side
	const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	return createServerClient(url, key || anon, {
		cookies: {
			getAll() { return []; },
			setAll() {},
		},
	});
}

export async function POST(req: NextRequest) {
	try {
		if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
			return NextResponse.json({ error: 'Server not configured (SUPABASE_SERVICE_ROLE_KEY missing)' }, { status: 500 });
		}
		const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
		if (queueEnabled && !process.env.REDIS_URL) {
			return NextResponse.json({ error: 'Server not configured (REDIS_URL missing)' }, { status: 500 });
		}
		const body: RenderRequestBody = await req.json();
		if (!body || !body.inputProps) {
			return NextResponse.json({ error: 'inputProps required' }, { status: 400 });
		}
		const compositionId = body.compositionId || 'MessageConversation';
		const jobId = randomUUID();
		// Try to resolve current user from cookies (optional)
		const authed = await createAuthedClient();
		const { data: userData } = await authed.auth.getUser();
		const userId = userData?.user?.id ?? null;

		// Basic shape stored in DB (table to be created separately): video_renders
		const supabase = getSupabaseServiceRole();
		const now = new Date().toISOString();
			const { error } = await supabase.from('video_renders').insert({
			id: jobId,
				user_id: userId,
			status: 'pending',
			composition_id: compositionId,
			input_props: body.inputProps,
			created_at: now,
			updated_at: now,
		});
		if (error) {
			return NextResponse.json({ error: 'DB insert failed', details: error.message }, { status: 500 });
		}
		// enqueue job - only if enabled
		if (queueEnabled) {
			try {
				const queue = getRenderQueue();
				const enqueue = queue.add('render', { jobId });
				await Promise.race([
					enqueue,
					new Promise((_, r) => setTimeout(() => r(new Error('enqueue-timeout')), 2000)),
				]);
			} catch (e) {
				console.error('[API] Enqueue failed, will rely on polling worker');
			}
		}
		return NextResponse.json({ jobId });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
	}
}
