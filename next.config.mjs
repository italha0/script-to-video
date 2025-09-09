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
  webpack: (config) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: 'ignore-loader' });
    return config;
  },
};

export default nextConfig;
