/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    // This is the modern way to handle this in recent Next.js versions
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
        // This is crucial: Explicitly include the native Linux binary for rendering on Vercel
        "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      ],
    },
  },
  webpack: (config, { isServer, webpack }) => {
    // Your existing Webpack config is good, no changes needed here.
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
