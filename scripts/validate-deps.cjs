#!/usr/bin/env node
/**
 *  'remotion',
  'remotion/version',
  'remotion/no-react',
  'debug'
];

console.log('\n[DEP-CHECK] Validating required modules...');dency validator for production deployment
 * This script checks if all required dependencies for video generation are available
 */

const requiredModules = [
  'isexe',
  'shebang-regex', 
  'shebang-command',
  'which',
  'ws',
  'cross-spawn',
  'execa',
  'extract-zip',
  'get-stream',
  'human-signals',
  'is-stream',
  'merge-stream',
  'mimic-fn',
  'npm-run-path',
  'onetime',
  'signal-exit',
  'source-map',
  'strip-final-newline',
  'path-key',
  '@remotion/renderer',
  '@sparticuz/chromium',
  '@remotion/streaming',
  'remotion',
  'remotion/version',
  'remotion/no-react',
  'debug',
  'ms',
  'yauzl',
  'buffer-crc32',
  'pend'
];

console.log('[DEP-CHECK] Validating required modules...');

let allFound = true;

for (const module of requiredModules) {
  try {
    require.resolve(module);
    console.log(`✅ ${module}`);
  } catch (error) {
    console.error(`❌ ${module} - MISSING`);
    allFound = false;
  }
}

if (allFound) {
  console.log('[DEP-CHECK] ✅ All required dependencies found!');
  process.exit(0);
} else {
  console.error('[DEP-CHECK] ❌ Some dependencies are missing!');
  process.exit(1);
}
