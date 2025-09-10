#!/usr/bin/env node
/**
 * Test script to verify remotion module resolution
 */

console.log('[MODULE-TEST] Testing remotion module resolution...');

try {
  console.log('[MODULE-TEST] Testing remotion...');
  const remotion = require('remotion');
  console.log('✅ remotion - OK');
} catch (error) {
  console.error('❌ remotion - FAILED:', error.message);
}

try {
  console.log('[MODULE-TEST] Testing remotion/version...');
  const version = require('remotion/version');
  console.log('✅ remotion/version - OK:', version);
} catch (error) {
  console.error('❌ remotion/version - FAILED:', error.message);
}

try {
  console.log('[MODULE-TEST] Testing @remotion/renderer...');
  const renderer = require('@remotion/renderer');
  console.log('✅ @remotion/renderer - OK');
} catch (error) {
  console.error('❌ @remotion/renderer - FAILED:', error.message);
}

console.log('[MODULE-TEST] Module resolution test complete.');
