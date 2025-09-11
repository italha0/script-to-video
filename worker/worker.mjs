import { Worker, QueueEvents, Job } from 'bullmq';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { BlobServiceClient } from '@azure/storage-blob';
import { uploadToAzureBlob, generateSASUrl } from '../lib/azure-blob.js';
import { RENDER_QUEUE_NAME } from '../lib/queue.js';
import fetch from 'node-fetch';

// Simple Supabase REST usage (avoids shipping service key in worker code via supabase-js, but we can also use supabase-js)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
if (!process.env.REDIS_URL) {
  console.error('Missing REDIS_URL');
  process.exit(1);
}

function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchJob(jobId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/video_renders?id=eq.${jobId}&select=*`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const json = await resp.json();
  return json[0];
}

async function updateJob(jobId, patch) {
  await fetch(`${SUPABASE_URL}/rest/v1/video_renders?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type':'application/json', 'Prefer':'return=representation' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  });
}

async function processRender(jobId) {
  const record = await fetchJob(jobId);
  if (!record) throw new Error('Record not found');
  if (record.status !== 'pending') return;
  await updateJob(jobId, { status: 'processing' });

  const compositionId = record.composition_id || 'MessageConversation';
  const inputProps = record.input_props || {};

  // ensure bundle location (prebundled inside image) via prebundle script path
  const prebundledMarker = join(process.cwd(), 'prebundled', 'serveUrl.txt');
  let serveUrl = null;
  if (existsSync(prebundledMarker)) {
    serveUrl = readFileSync(prebundledMarker, 'utf-8').trim();
  } else {
    // fallback to bundling (slower) - not recommended in prod
    const { bundle } = await import('@remotion/bundler');
    serveUrl = await bundle(join(process.cwd(), 'remotion', 'index.ts'));
  }
  const comps = await getCompositions(serveUrl, { inputProps });
  const comp = comps.find(c => c.id === compositionId);
  if (!comp) throw new Error('Composition not found: ' + compositionId);
  const msgCount = (inputProps.messages || []).length;
  const durationInFrames = Math.max(comp.durationInFrames, Math.round((msgCount * 2 + 4) * comp.fps));

  const workDir = process.env.WORK_DIR || os.tmpdir();
  const outDir = join(workDir, 'renders');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outputPath = join(outDir, `${jobId}.mp4`);

  await renderMedia({
    composition: { ...comp, durationInFrames },
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    concurrency: 2,
  });

  const blobName = await uploadToAzureBlob(outputPath, `${jobId}.mp4`);
  const sasUrl = generateSASUrl(blobName, 60);
  await updateJob(jobId, { status: 'done', url: sasUrl });
}

const worker = new Worker(RENDER_QUEUE_NAME, async (job) => {
  const { jobId } = job.data;
  try {
    await processRender(jobId);
    return { success: true };
  } catch (e) {
    console.error('[WORKER] Job failed', jobId, e);
    await updateJob(jobId, { status: 'error', error_message: e.message });
    throw e;
  }
}, { connection: { url: process.env.REDIS_URL } });

new QueueEvents(RENDER_QUEUE_NAME, { connection: { url: process.env.REDIS_URL } });

worker.on('completed', (job)=> console.log('Job completed', job.id));
worker.on('failed', (job, err)=> console.log('Job failed', job?.id, err?.message));

console.log('[WORKER] Started, awaiting jobs...');
