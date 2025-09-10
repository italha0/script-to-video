#!/usr/bin/env node
/**
 * Pre-bundle the Remotion project at build time so the serverless function
 * only needs @remotion/renderer (not @remotion/bundler + webpack + react-dom at runtime).
 */
const { bundle } = require('@remotion/bundler');
const path = require('path');
const fs = require('fs');
(async () => {
  const entry = path.join(process.cwd(), 'remotion', 'index.ts');
  console.log('[PREBUNDLE] Bundling', entry);
  const bundleLocation = await bundle(entry);
  const outDir = path.join(process.cwd(), 'prebundled');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // bundle() returns a directory path we can just copy or reference. We'll just write a marker file.
  fs.writeFileSync(path.join(outDir, 'serveUrl.txt'), bundleLocation, 'utf-8');
  console.log('[PREBUNDLE] Done. serveUrl stored in prebundled/serveUrl.txt:', bundleLocation);
})();
