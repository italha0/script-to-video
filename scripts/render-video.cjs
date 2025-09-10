#!/usr/bin/env node
/*
  Usage: node scripts/render-video.cjs <propsPath> <outputPath> <compositionId>
*/
const { readFileSync } = require('fs');
const path = require('path');
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');

async function run() {
  const [,, propsPath, outputPath, compositionId] = process.argv;
  if (!propsPath || !outputPath || !compositionId) {
    console.error('Missing args: propsPath outputPath compositionId');
    process.exit(1);
  }
  console.log('[RENDER] Starting render');
  console.log('[RENDER] Node version:', process.version);
  console.log('[RENDER] Platform:', process.platform, 'Arch:', process.arch);

  // Try to set a Chromium executable path for serverless (Vercel) if not provided
  if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
    try {
      const chromium = require('@sparticuz/chromium');
      const execPath = await chromium.executablePath();
      process.env.REMOTION_BROWSER_EXECUTABLE = execPath;
      // Also set Puppeteer fallback env var
      process.env.PUPPETEER_EXECUTABLE_PATH = execPath;
      console.log('[RENDER] Using serverless Chromium at', execPath);
    } catch (e) {
      console.warn('[RENDER] Could not resolve @sparticuz/chromium executable', e?.message || e);
    }
  } else {
    console.log('[RENDER] REMOTION_BROWSER_EXECUTABLE already set');
  }
  const entry = path.join(process.cwd(), 'remotion', 'index.ts');
  const bundleLocation = await bundle(entry);
  console.log('[RENDER] Bundled at', bundleLocation);
  const props = JSON.parse(readFileSync(propsPath, 'utf-8'));
  console.log('[RENDER] Messages count:', (props.messages || []).length);
  const comps = await getCompositions(bundleLocation, { inputProps: props });
  const comp = comps.find(c => c.id === compositionId);
  if (!comp) {
    console.error('[RENDER] Composition not found:', compositionId);
    process.exit(1);
  }

  // Determine dynamic duration based on messages (2s per + 4 tail)
  const msgCount = (props.messages || []).length;
  const perMessage = 2; // seconds
  const tail = 4; // seconds
  const desired = Math.round((msgCount * perMessage + tail) * comp.fps);
  const durationInFrames = Math.max(comp.durationInFrames, desired);
  console.log('[RENDER] Using durationInFrames', durationInFrames);

  await renderMedia({
    composition: { ...comp, durationInFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: props,
  concurrency: process.env.VERCEL ? 1 : 2, // lower concurrency in serverless envs
    dumpBrowserLogs: false,
    onProgress: (p) => {
      if (p.renderedFrames % 30 === 0) {
        process.stdout.write(`\n[RENDER] ${p.renderedFrames}/${durationInFrames} ${(p.progress*100).toFixed(1)}%`);
      }
    }
  });
  console.log('\n[RENDER] Success');
}

run().catch(err => {
  console.error('[RENDER] Failed', err);
  process.exit(1);
});
