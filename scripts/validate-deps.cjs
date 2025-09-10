#!/usr/bin/env node
/**
 * Dependency validator for production deployment
 * This script checks if all required dependencies for video generation are available
 */

const requiredModules = [
  'isexe',
  'shebang-regex', 
  'shebang-command',
  'which',
  'cross-spawn',
  'execa',
  'get-stream',
  'human-signals',
  'is-stream',
  'merge-stream',
  'npm-run-path',
  'onetime',
  'signal-exit',
  'strip-final-newline',
  'path-key',
  '@remotion/renderer',
  '@sparticuz/chromium'
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
