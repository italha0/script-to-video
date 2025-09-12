# Overview

ChatVideo is a Next.js application that allows users to create viral-style videos from chat conversations. The platform converts text message scripts into animated video content suitable for social media platforms like TikTok, Instagram Reels, and YouTube Shorts. Users can design chat conversations with customizable themes, characters, and styling, then render them as MP4 videos using Remotion for video generation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses Next.js 14 with React Server Components and TypeScript. The UI is built with shadcn/ui components for a consistent design system, using Tailwind CSS for styling with a custom pink-accent theme. The main editor interface allows users to create and preview chat conversations in real-time using Remotion Player for instant preview without backend processing.

State management is handled through React hooks with local state for the editor components. The application supports both authenticated and unauthenticated users, with protected routes for the main editor functionality.

## Video Generation System

The video rendering uses a hybrid approach with two phases:
- **Preview Mode**: Client-side preview using Remotion Player for instant feedback
- **Production Rendering**: Backend worker system for final video generation

The Remotion configuration includes custom chat message components that simulate iPhone-style messaging interfaces with animated typing effects, bubble appearances, and realistic timing. Videos are rendered at mobile-optimized dimensions (390x844) suitable for vertical social media content.

## Authentication & Authorization

User authentication is managed through Supabase Auth with session-based middleware. The middleware handles automatic redirects for protected routes and preserves the original destination when redirecting unauthenticated users to login. Auth state is managed client-side with automatic session refresh.

## Data Storage & Management

User data including saved scripts, character configurations, and render job status are stored in Supabase. The application supports saving and loading chat scripts with full character and message data persistence. Video files are stored in Azure Blob Storage with time-limited SAS URLs for secure access.

## Worker Architecture

Video rendering is handled by a separate worker system that can operate in two modes:
- **Queue-based**: Using Redis/BullMQ for job queuing (production)
- **Polling-based**: Direct Supabase polling for simpler deployment scenarios

The worker uses Remotion's headless renderer with Chromium to generate final videos, uploading completed files to Azure Blob Storage and updating job status in Supabase.

# External Dependencies

## Core Services
- **Supabase**: Primary database, authentication, and real-time subscriptions
- **Azure Blob Storage**: Video file storage with SAS token-based access
- **Redis/BullMQ**: Optional job queue system for scalable rendering

## Video & Media Processing
- **Remotion**: Video composition and rendering engine
- **@sparticuz/chromium**: Optimized Chromium build for serverless environments
- **@remotion/player**: Client-side video preview component

## UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

## Development & Deployment
- **Vercel**: Hosting platform with optimized Next.js deployment
- **TypeScript**: Type safety and enhanced development experience
- **Geist Font**: Modern font stack for improved typography