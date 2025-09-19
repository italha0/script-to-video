# ChatVideo - Replit Setup

## Project Overview
ChatVideo is a Next.js application that turns chat scripts into viral videos using Remotion. It allows users to create engaging TikTok, Instagram Reels, and YouTube Shorts from chat conversations without video editing skills.

## Architecture
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Video Processing**: Remotion for video generation
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Azure Blob Storage
- **UI Components**: Radix UI components with custom styling
- **Queue System**: BullMQ with Redis (optional)

## Current Status
✅ **Setup Complete**:
- Dependencies installed
- Development server configured on port 5000
- Next.js configured for Replit proxy compatibility
- Deployment configuration set for autoscale
- TypeScript and ESLint configured

⚠️ **Environment Variables Required**:
The application requires the following environment variables to function:

**Required for Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Required for Azure Blob Storage:**
- `AZURE_STORAGE_CONNECTION_STRING` - Azure storage connection string
- OR both:
  - `AZURE_STORAGE_ACCOUNT_NAME` - Azure storage account name
  - `AZURE_STORAGE_ACCOUNT_KEY` - Azure storage account key

**Optional for Queue System:**
- `REDIS_URL` - Redis connection URL (if using queue functionality)
- `RENDER_QUEUE_ENABLED` - Set to 'true' to enable queue system

## Development Workflow
The project is configured to run on port 5000 with hostname 0.0.0.0 for Replit compatibility. The development server automatically restarts when changes are made.

## Recent Changes
- 2025-09-19: Initial Replit setup completed
- Configured Next.js for Replit proxy support
- Set up development workflow on port 5000
- Configured deployment for autoscale

## Project Structure
- `/app` - Next.js app directory with routes and API endpoints
- `/components` - Reusable React components
- `/lib` - Utility functions and service configurations
- `/remotion` - Remotion video compositions
- `/public` - Static assets
- `/scripts` - Build and utility scripts