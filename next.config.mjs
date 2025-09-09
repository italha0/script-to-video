/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // New (>= Next 15) top-level option (was experimental.outputFileTracingIncludes)
  outputFileTracingIncludes: {
    '/api/generate-video': [
      './scripts/render-video.cjs',
      './remotion/**/*'
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: 'ignore-loader' });
    if (isServer) {
      const { IgnorePlugin } = require('webpack');
      // Remotion renderer attempts to conditionally require many platform-specific
      // compositor binaries. Only one will actually be needed at runtime, but
      // webpack tries to resolve all static require() calls and fails for the
      // ones not installed (arm64 variants). We ignore the unsupported ones.
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /^@remotion\/compositor-(linux-arm64-(musl|gnu)|darwin-arm64|win32-x64|linux-arm64)$/
        })
      );
    }
    return config;
  },
};

export default nextConfig;
