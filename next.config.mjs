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
    }
    return config;
  },
};

export default nextConfig;
