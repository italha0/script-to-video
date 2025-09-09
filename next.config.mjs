/** @type {import('next').NextConfig} */
import webpack from "webpack";

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
  webpack: (config, { isServer }) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: "ignore-loader" });
    if (isServer) {
      // Use a direct import for webpack's IgnorePlugin
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /^@remotion\/compositor-(linux-arm64-(musl|gnu)|darwin-arm64|win32-x64|linux-arm64)$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
