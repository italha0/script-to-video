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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ jobId: string }> | { jobId: string } }) {
	try {
		const supabase = getSupabaseServiceRole();
		const { jobId } = await ctx.params;
		const { data, error } = await supabase.from('video_renders').select('status, url').eq('id', jobId).maybeSingle();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json(data);
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
	}
}
