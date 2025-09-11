const { Worker, QueueEvents } = require('bullmq');
const { readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const os = require('os');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const { uploadToAzureBlob, generateSASUrl } = require('../lib/azure-blob.js');
const { RENDER_QUEUE_NAME } = require('../lib/queue.js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing Supabase env vars'); process.exit(1); }
if (!process.env.REDIS_URL) { console.error('Missing REDIS_URL'); process.exit(1); }

async function fetchJob(jobId){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/video_renders?id=eq.${jobId}&select=*`, { headers:{ apikey: SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}` }});
  const j = await r.json();
  return j[0];
}
async function updateJob(jobId, patch){
  await fetch(`${SUPABASE_URL}/rest/v1/video_renders?id=eq.${jobId}`, { method:'PATCH', headers:{ apikey: SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })});
}
async function processRender(jobId){
  const record = await fetchJob(jobId);
  if (!record) throw new Error('Record not found');
  if (record.status !== 'pending') return;
  await updateJob(jobId, { status:'processing' });
  const compositionId = record.composition_id || 'MessageConversation';
  const inputProps = record.input_props || {};
  // Ensure a Chromium executable is available
  if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
    try {
      const chromium = require('@sparticuz/chromium');
      const execPath = await chromium.executablePath();
      process.env.REMOTION_BROWSER_EXECUTABLE = execPath;
      process.env.PUPPETEER_EXECUTABLE_PATH = execPath;
      console.log('[WORKER] Using serverless Chromium at', execPath);
    } catch (e) {
      console.warn('[WORKER] Could not resolve @sparticuz/chromium executable', e?.message || e);
    }
  }
  const marker = join(process.cwd(),'prebundled','serveUrl.txt');
  let serveUrl = null;
  if (existsSync(marker)) serveUrl = readFileSync(marker,'utf-8').trim();
  else {
    const { bundle } = require('@remotion/bundler');
    serveUrl = await bundle(join(process.cwd(),'remotion','index.ts'));
  }
  const comps = await getCompositions(serveUrl, { inputProps });
  const comp = comps.find(c=> c.id === compositionId);
  if (!comp) throw new Error('Composition not found: '+compositionId);
  const msgCount = (inputProps.messages || []).length;
  const durationInFrames = Math.max(comp.durationInFrames, Math.round((msgCount*2+4)*comp.fps));
  const workDir = process.env.WORK_DIR || os.tmpdir();
  const outDir = join(workDir,'renders');
  if (!existsSync(outDir)) mkdirSync(outDir,{ recursive:true });
  const outputPath = join(outDir, `${jobId}.mp4`);
  await renderMedia({ composition:{ ...comp, durationInFrames }, serveUrl, codec:'h264', outputLocation: outputPath, inputProps, concurrency:2 });
  const blobName = await uploadToAzureBlob(outputPath, `${jobId}.mp4`);
  const sasUrl = generateSASUrl(blobName, 60);
  await updateJob(jobId,{ status:'done', url: sasUrl });
}
const worker = new Worker(RENDER_QUEUE_NAME, async (job)=>{ const { jobId } = job.data; try { await processRender(jobId); return { success:true }; } catch(e){ console.error('[WORKER] Job failed', jobId, e); await updateJob(jobId,{ status:'error', error_message: e.message }); throw e; } }, { connection:{ url: process.env.REDIS_URL }});
new QueueEvents(RENDER_QUEUE_NAME,{ connection:{ url: process.env.REDIS_URL }});
worker.on('completed',(job)=> console.log('Job completed', job.id));
worker.on('failed',(job,err)=> console.log('Job failed', job?.id, err?.message));
console.log('[WORKER] Started');
