/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // Ensure the Remotion composition source and the standalone render script
  // are included in the serverless/function bundle in production.
  // Without this, Vercel's file tracing can omit them because they are only
  // referenced via spawn() + path joins, leading to ENOENT in production.
  experimental: {
    outputFileTracingIncludes: {
      // Match the route path for the API handler
      '/api/generate-video': [
        './scripts/render-video.cjs',
        './remotion/**/*'
      ],
    },
  },
  webpack: (config) => {
    config.module.rules.push({ test: /\.d\.ts$/, use: 'ignore-loader' });
    return config;
  },
};

export default nextConfig;
