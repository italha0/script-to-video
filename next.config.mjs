/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  // NOTE: For Next.js v15+, outputFileTracingIncludes is at the top level, not inside `experimental`.
  outputFileTracingIncludes: {
    "/api/generate-video": [
      // The script to execute
      "./scripts/render-video.cjs",

      // Your Remotion compositions
      "./remotion/**/*",

      // The Remotion config file
      "./remotion.config.ts",

      // The headless browser for rendering
      "./node_modules/@sparticuz/chromium/**/*",

      // Core Remotion packages needed by the script
      "./node_modules/remotion/**/*",
      "./node_modules/@remotion/**/*",
  // Explicitly ensure bundler + internals are traced (some subpackages are dynamically required)
  "./node_modules/@remotion/bundler/**/*",
  "./node_modules/@remotion/media-parser/**/*",
  "./node_modules/@remotion/licensing/**/*",
  "./node_modules/@remotion/webcodecs/**/*",
  "./node_modules/@remotion/studio-shared/**/*",
  "./node_modules/webpack/**/*",

      // --- NEW & CRITICAL ADDITIONS ---

      // 1. The FFmpeg binary that Remotion uses for encoding
      "./node_modules/@remotion/renderer/bin/ffmpeg",

      // 2. The native compositor binaries for different Linux environments on Vercel
      "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    // Ignore TS declaration files so they don't bloat the bundle
    config.module.rules.push({ test: /\.d\.ts$/, use: 'ignore-loader' });
    if (isServer) {
      // Prevent optional native compositor variants from being pulled in (we only trace Linux ones explicitly)
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@remotion\/compositor-/ }));
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@remotion/compositor-win32-x64-msvc': false,
        '@remotion/compositor-darwin-x64': false,
        '@remotion/compositor-darwin-arm64': false,
        '@remotion/compositor-linux-arm64-gnu': false,
        '@remotion/compositor-linux-arm64-musl': false,
      };
      // NOTE: Previously we marked Remotion packages as externals. That prevented Next.js
      // from tracing their internal files leading to MODULE_NOT_FOUND in the serverless
      // function. We now keep them bundled/traced so outputFileTracingIncludes + automatic
      // tracing can capture all required files.
    }
    return config;
  },
};

export default nextConfig;
