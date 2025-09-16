import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateSASUrl } from '@/lib/azure-blob';

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
		const { data, error } = await supabase
			.from('video_renders')
	.select('status, url, blob_name, error_message')
			.eq('id', jobId)
			.maybeSingle();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
						const { status, url, blob_name, error_message } = data as { status: string; url: string | null; blob_name?: string | null; error_message?: string | null };
				let finalUrl = url || null;
						if (status === 'done') {
					try {
								let blobName: string | null = blob_name || null;
								if (!blobName && url) {
									const u = new URL(url);
									if (u.hostname.endsWith('.blob.core.windows.net')) {
										const parts = u.pathname.split('/').filter(Boolean);
										if (parts.length >= 2 && parts[0] === 'videos') {
											blobName = decodeURIComponent(parts.slice(1).join('/'));
										}
									}
								}
								if (blobName) finalUrl = generateSASUrl(blobName, 60);
					} catch {
						// leave finalUrl as-is on parse/generation errors
					}
				}
				return NextResponse.json({ status, url: finalUrl, error: error_message || undefined });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
	}
}
