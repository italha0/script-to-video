/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "/api/generate-video": [
      "./scripts/render-video.cjs",
      "./remotion/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: "ignore-loader" });
    if (isServer) {
      // Ignore all optional native Remotion compositor platform builds; they are dynamically required but optional.
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@remotion\/compositor-/,
        })
      );

      // Prevent Webpack from trying to bundle platform-specific native compositor binaries that are optional.
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@remotion/compositor-win32-x64-msvc': false,
        '@remotion/compositor-darwin-x64': false,
        '@remotion/compositor-darwin-arm64': false,
        '@remotion/compositor-linux-x64-gnu': false,
        '@remotion/compositor-linux-x64-musl': false,
        '@remotion/compositor-linux-arm64-gnu': false,
        '@remotion/compositor-linux-arm64-musl': false,
      };
    }
    return config;
  },
};

export default nextConfig;
