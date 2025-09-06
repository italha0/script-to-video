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
    concurrency: 2,
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
