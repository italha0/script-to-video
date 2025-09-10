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

      // --- NEW & CRITICAL ADDITIONS ---

      // 1. The FFmpeg binary that Remotion uses for encoding
      "./node_modules/@remotion/renderer/bin/ffmpeg",

      // 2. The native compositor binaries for different Linux environments on Vercel
      "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: "ignore-loader" });
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@remotion\/compositor-/,
        })
      );
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@remotion/compositor-win32-x64-msvc": false,
        "@remotion/compositor-darwin-x64": false,
        "@remotion/compositor-darwin-arm64": false,
        "@remotion/compositor-linux-x64-gnu": false,
        "@remotion/compositor-linux-x64-musl": false,
        "@remotion/compositor-linux-arm64-gnu": false,
        "@remotion/compositor-linux-arm64-musl": false,
      };
      const remotionPkgs = [
        "@remotion/bundler",
        "@remotion/cli",
        "@remotion/renderer",
        "remotion",
      ];

      const originalExternals = config.externals || [];
      config.externals = [
        ...originalExternals,
        ({ request }, callback) => {
          if (remotionPkgs.includes(request)) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
