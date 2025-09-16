// Allow running outside Docker: load .env if present
try { require('dotenv').config(); } catch {}

const { Worker, QueueEvents } = require('bullmq');
const { readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const os = require('os');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const { uploadToAzureBlob, generateSASUrl } = require('../lib/dist/azure-blob.js');
const { RENDER_QUEUE_NAME } = require('../lib/dist/queue.js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing Supabase env vars'); process.exit(1); }
const QUEUE_ENABLED = process.env.RENDER_QUEUE_ENABLED === 'true';

// Quick Azure sanity hint on startup
if (!process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
  console.warn('[WORKER] Azure envs missing (no upload possible): AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY');
}

// Debug: print which project and role we're using (do not log secrets)
try {
  const role = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString('utf8')).role;
  console.log('[WORKER] Supabase URL:', SUPABASE_URL);
  console.log('[WORKER] Supabase key role:', role);
} catch { /* ignore */ }

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
  if (record.status !== 'pending' && record.status !== 'processing') return;
  
  // Only update to processing if it's pending (avoid race conditions)
  if (record.status === 'pending') {
    await updateJob(jobId, { status:'processing' });
  }
  const compositionId = record.composition_id || 'MessageConversation';
  const inputProps = record.input_props || {};
  // Use system Chromium instead of bundled Chrome Headless Shell
  if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      let foundPath = '';
      if (process.platform === 'win32') {
        try {
          const { stdout } = await execAsync('where chrome');
          foundPath = (stdout || '').split(/\r?\n/).find(Boolean) || '';
        } catch {}
        if (!foundPath) {
          try {
            const { stdout } = await execAsync('where msedge');
            foundPath = (stdout || '').split(/\r?\n/).find(Boolean) || '';
          } catch {}
        }
      } else {
        try {
          const { stdout } = await execAsync('which chromium');
          foundPath = (stdout || '').trim();
        } catch {}
        if (!foundPath) {
          try {
            const { stdout } = await execAsync('which google-chrome');
            foundPath = (stdout || '').trim();
          } catch {}
        }
      }
      if (foundPath) {
        process.env.REMOTION_BROWSER_EXECUTABLE = foundPath.trim();
        process.env.PUPPETEER_EXECUTABLE_PATH = foundPath.trim();
        console.log('[WORKER] Using system Chromium/Chrome at', foundPath.trim());
      } else {
        // Fallback to serverless chromium
        try {
          const chromium = require('@sparticuz/chromium');
          const execPath = await chromium.executablePath();
          process.env.REMOTION_BROWSER_EXECUTABLE = execPath;
          process.env.PUPPETEER_EXECUTABLE_PATH = execPath;
          console.log('[WORKER] Using serverless Chromium at', execPath);
        } catch (e2) {
          console.error('[WORKER] Could not resolve any Chromium executable', e2?.message || e2);
        }
      }
    } catch (e) {
      console.warn('[WORKER] Browser executable detection errored', e?.message || e);
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
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
  await renderMedia({ 
    composition:{ ...comp, durationInFrames }, 
    serveUrl, 
    codec:'h264', 
    outputLocation: outputPath, 
    inputProps, 
    concurrency:1,
    browserExecutable,
    chromiumOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  });
  const blobName = await uploadToAzureBlob(outputPath, `${jobId}.mp4`, 'videos', 'chat-video.mp4');
  const sasUrl = generateSASUrl(blobName, 60);
  const baseUrl = typeof sasUrl === 'string' ? sasUrl.split('?')[0] : '';
  await updateJob(jobId,{ status:'done', url: baseUrl });
}
let worker = null;
if (QUEUE_ENABLED) {
  if (!process.env.REDIS_URL) {
    console.warn('[WORKER] RENDER_QUEUE_ENABLED is true but REDIS_URL is missing. Queue processing disabled.');
  } else {
    worker = new Worker(RENDER_QUEUE_NAME, async (job)=>{ const { jobId } = job.data; try { await processRender(jobId); return { success:true }; } catch(e){ console.error('[WORKER] Job failed', jobId, e); await updateJob(jobId,{ status:'error', error_message: e.message }); throw e; } }, { connection:{ url: process.env.REDIS_URL, maxRetriesPerRequest: 1, connectTimeout: 2000 }});
    new QueueEvents(RENDER_QUEUE_NAME,{ connection:{ url: process.env.REDIS_URL, maxRetriesPerRequest: 1, connectTimeout: 2000 }});
    worker.on('completed',(job)=> console.log('Job completed', job.id));
    worker.on('failed',(job,err)=> console.log('Job failed', job?.id, err?.message));
    console.log('[WORKER] Queue worker started');
  }
}

// Polling fallback: pick up pending jobs even if Redis is unavailable or enqueue failed.
async function pollingSweep(){
  try{
    const url = `${SUPABASE_URL}/rest/v1/video_renders?select=id&status=in.(pending,processing)&order=created_at.asc&limit=5`;
    const r = await fetch(url, { headers:{ apikey: SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}` }});
    if (!r.ok) {
      const txt = await r.text().catch(()=> '');
      console.error('[WORKER] polling fetch failed', r.status, txt);
      return;
    }
    const rows = await r.json();
    console.log(`[WORKER] sweep: ${Array.isArray(rows)? rows.length: 0} pending`);
    for (const row of rows){
      console.log('[WORKER] processing pending job', row.id);
      try {
        await processRender(row.id);
      } catch(e){
        console.error('[WORKER] Fallback processing failed', row.id, e?.message||e);
        try { await updateJob(row.id, { status: 'error', error_message: (e && e.message) || String(e) }); } catch {}
      }
    }
    if (!rows || rows.length === 0) {
      // Extra debug: fetch a few recent rows to validate visibility and statuses
      const sampleUrl = `${SUPABASE_URL}/rest/v1/video_renders?select=id,status,created_at&order=created_at.desc&limit=3`;
      const s = await fetch(sampleUrl, { headers:{ apikey: SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}` }});
      const sample = s.ok ? await s.json() : [];
      console.log('[WORKER] recent rows (id,status):', Array.isArray(sample) ? sample.map(r=> `${r.id}:${r.status}`).join(', ') : 'n/a');
    }
  } catch (e){ console.error('[WORKER] polling sweep error', e?.message||e); }
}
setInterval(pollingSweep, 15000);
pollingSweep();
console.log('[WORKER] Polling fallback active');
