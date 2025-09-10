# Remotion Dependencies Guide

This file documents all the required dependencies for video generation in production environments.

## Core Requirements

### Essential Remotion Dependencies
- `@remotion/renderer` - Core video rendering engine
- `@sparticuz/chromium` - Headless browser for serverless environments
- `remotion` - Core Remotion library
- `ws` - WebSocket library (required by @remotion/renderer)
- `extract-zip` - Archive extraction (used by Remotion)
- `source-map` - Source map support

### Process Management (execa and dependencies)
- `execa` - Process execution library
- `cross-spawn` - Cross-platform process spawning
- `get-stream` - Get stream as string/buffer
- `human-signals` - Human-friendly process signals
- `is-stream` - Check if something is a stream
- `merge-stream` - Merge multiple streams
- `mimic-fn` - Function mimicking utility
- `npm-run-path` - Get PATH for npm run
- `onetime` - Ensure function is called only once
- `signal-exit` - Fire callback when process exits
- `strip-final-newline` - Strip final newline from string

### Command Line Tools
- `which` - Cross-platform which command
- `isexe` - Check if file is executable
- `path-key` - PATH environment variable key
- `shebang-command` - Parse shebang command
- `shebang-regex` - Regular expression for matching shebangs

## Production Deployment Notes

### Netlify Function Size Limit
- Functions must be under 250MB
- Use `node_bundler = "nft"` for better tree-shaking
- Include only essential dependencies in function tracing

### Vercel/AWS Lambda
- All dependencies are required for video generation
- Use outputFileTracingIncludes in next.config.mjs
- Prebundle Remotion assets to reduce runtime dependencies

## Validation

Run `node scripts/validate-deps.cjs` to check if all dependencies are available.

## Troubleshooting

If you get "Cannot find module" errors:
1. Check if the missing module is in this list
2. Add it to package.json dependencies
3. Add it to next.config.mjs outputFileTracingIncludes
4. Update the validation script

## DO NOT REMOVE

These dependencies are NOT optional - removing any of them will cause
video generation to fail in production with "Cannot find module" errors.
