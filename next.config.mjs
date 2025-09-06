/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ensure .d.ts files from packages like esbuild are not parsed by webpack
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'ignore-loader'
    });
    return config;
  }
}

export default nextConfig
