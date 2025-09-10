import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, unlinkSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

// Force dynamic to avoid caching & ensure Node runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Character {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

interface Message {
  id: string;
  characterId: string;
  text: string;
  timestamp: number;
}

interface RequestBody {
  characters: Character[];
  messages: Message[];
  isPro: boolean;
}

export async function POST(request: NextRequest) {
  let propsPath: string | null = null;
  let outputPath: string | null = null;
  let hadError = false;
  let childStdout = '';
  let childStderr = '';

  try {
    console.log('[API] Starting video generation (programmatic renderer)...');
    
    const body: RequestBody = await request.json();
    const { characters, messages, isPro } = body;

    if (!characters || !messages || messages.length === 0) {
      console.log('[API] Invalid request - no characters or messages');
      return NextResponse.json(
        { error: 'Invalid request: characters and messages are required' },
        { status: 400 }
      );
    }

    console.log('[API] Processing', messages.length, 'messages with', characters.length, 'characters');

    // Transform data for Remotion
    // Determine outgoing vs incoming.
    // In the redesigned editor we use ids 'them' and 'you'. Outgoing (right side / blue) should be 'you'.
    // Fallback: if legacy numeric ids, treat first character as 'them'.
    const hasYouId = characters.some(c=>c.id==='you');
    const remotionMessages = messages.map((msg, index) => {
      const isOutgoing = hasYouId ? msg.characterId === 'you' : (characters[1] ? msg.characterId === characters[1].id : false);
      return {
        id: index + 1,
        text: msg.text,
        sent: isOutgoing,
        time: `0:${String(index * 2).padStart(2, '0')}`
      };
    });

    console.log('[API] Transformed messages for Remotion:', remotionMessages);

    // Choose a writable directory. In Vercel serverless functions the filesystem is read-only
    // except for /tmp, so we must place temp artifacts there. Locally we keep using the repo folder.
  const writableRoot = process.env.VERCEL ? os.tmpdir() : process.cwd();
  let outputDir = join(writableRoot, 'out');
    try {
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
        console.log('[API] Created output directory:', outputDir);
      }
    } catch (dirErr) {
      console.error('[API] Failed to ensure output directory. Falling back to os.tmpdir()', dirErr);
      // Last resort – try tmp directly
      const fallback = os.tmpdir();
      const fbOut = join(fallback, 'out');
      if (!existsSync(fbOut)) {
        mkdirSync(fbOut, { recursive: true });
      }
      console.log('[API] Using fallback output directory:', fbOut);
      outputDir = fbOut;
      (global as any).__videoOutputFallback = true; // mark for diagnostics
      // redefine for subsequent logic
      (outputPath as any) = null; // just to silence TS if reused before assignment
    }

    // Create unique output path
    const timestamp = Date.now();
    outputPath = join(outputDir, `video-${timestamp}.mp4`);
    propsPath = join(outputDir, `props-${timestamp}.json`);

    // Write props to temporary file
  const contactCharacter = characters.find(c=> c.id === 'them') || characters[0];
  const propsData = { messages: remotionMessages, contactName: contactCharacter?.name || 'Contact' };
    writeFileSync(propsPath, JSON.stringify(propsData, null, 2));

    console.log('[API] Props file created at:', propsPath);
    console.log('[API] Output path:', outputPath);
    console.log('[API] Props data:', JSON.stringify(propsData, null, 2));

    // Use external Node script to perform Remotion rendering to avoid React context issues in Next API route
    const rendererScript = join(process.cwd(), 'scripts', 'render-video.cjs');
    const scriptExists = existsSync(rendererScript);
    if (!scriptExists) {
      console.warn('[API] External renderer script missing; will attempt inline rendering fallback.');
    }

    // Helpful log for serverless environment path resolution
    console.log('[API] CWD:', process.cwd());
    const remotionEntry = join(process.cwd(), 'remotion', 'index.ts');
    console.log('[API] Files expected to exist:', rendererScript, remotionEntry);
    console.log('[API] Exists check:', {
      rendererScript: existsSync(rendererScript),
      remotionEntry: existsSync(remotionEntry),
      remotionPkg: existsSync(join(process.cwd(), 'node_modules', 'remotion')),
      remotionRenderer: existsSync(join(process.cwd(), 'node_modules', '@remotion', 'renderer'))
    });
    console.log('[API] Running on Vercel?', !!process.env.VERCEL, 'Node ENV:', process.env.NODE_ENV);
    if (process.env.REMOTION_BROWSER_EXECUTABLE) {
      console.log('[API] Using custom REMOTION_BROWSER_EXECUTABLE');
    }

    // Build arguments: script propsPath outputPath compositionId fpsOverride(optional) messagesLength
    if (!scriptExists) {
      throw new Error('Renderer script missing (scripts/render-video.cjs). Cannot render video. (Did outputFileTracingIncludes capture it?)');
    }

    const args = [rendererScript, propsPath, outputPath, 'MessageConversation'];
    console.log('[API] Spawning renderer:', process.execPath, args.join(' '));
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await new Promise<void>((resolve, reject) => {
      child.stdout.on('data', (d) => {
        const line = d.toString();
        childStdout += line;
        console.log('[Renderer STDOUT]', line.trim());
      });
      child.stderr.on('data', (d) => {
        const line = d.toString();
        childStderr += line;
        console.warn('[Renderer STDERR]', line.trim());
      });
      child.on('exit', (code) => {
        if (code === 0) return resolve();
        hadError = true;
        reject(new Error(`Renderer exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });

    if (!existsSync(outputPath)) {
      throw new Error('Render finished but output file missing');
    }

    const videoBuffer = readFileSync(outputPath);
    console.log('[API] Render complete. Size:', videoBuffer.length);

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="chat-video-${timestamp}.mp4"`,
        'Content-Length': String(videoBuffer.length),
      }
    });

  } catch (error) {
    console.error('[API] Video generation failed:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[API] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
  // Handle specific error types
      if (error.message.includes('Renderer script missing')) {
        statusCode = 404;
        errorMessage = 'Renderer script missing. Ensure outputFileTracingIncludes includes scripts/render-video.cjs';
      } else if (error.message.includes('ENOENT') && error.message.includes('/tmp')) {
        statusCode = 500;
        errorMessage = 'Temp directory issue. /tmp should be writable but was not. Check serverless permissions.';
      } else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Required files not found (remotion bundle or assets). Verify outputFileTracingIncludes paths.';
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        statusCode = 408;
        errorMessage = 'Video generation timed out. Please try again.';
  }
    }

    return NextResponse.json(
      { 
        error: 'Video generation failed', 
        details: errorMessage,
        fullError: error instanceof Error ? error.message : String(error),
        stdout: childStdout || undefined,
        stderr: childStderr || undefined,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  } finally {
    // Clean up temporary files
    if (propsPath) {
      try {
        unlinkSync(propsPath);
        console.log('[API] Props file cleaned up');
      } catch (cleanupError) {
        console.warn('[API] Could not clean up props file:', cleanupError);
      }
    }
    
    if (outputPath && !hadError) { // keep output if there was an error for inspection
      try {
        unlinkSync(outputPath);
        console.log('[API] Video file cleaned up');
      } catch (cleanupError) {
        console.warn('[API] Could not clean up video file:', cleanupError);
      }
    }
  }
}
