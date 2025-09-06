import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  try {
    console.log('[API] Starting video generation...');
    
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
    const remotionMessages = messages.map((msg, index) => {
      const character = characters.find(c => c.id === msg.characterId);
      const isFirstCharacter = character?.id === characters[0]?.id;
      
      return {
        id: index + 1,
        text: msg.text,
        sent: isFirstCharacter,
        time: `0:${String(index * 2).padStart(2, '0')}`
      };
    });

    console.log('[API] Transformed messages for Remotion:', remotionMessages);

    // Ensure output directory exists
    const outputDir = join(process.cwd(), 'out');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log('[API] Created output directory:', outputDir);
    }

    // Create unique output path
    const timestamp = Date.now();
    outputPath = join(outputDir, `video-${timestamp}.mp4`);
    propsPath = join(outputDir, `props-${timestamp}.json`);

    // Write props to temporary file
    const propsData = { messages: remotionMessages };
    writeFileSync(propsPath, JSON.stringify(propsData, null, 2));

    console.log('[API] Props file created at:', propsPath);
    console.log('[API] Output path:', outputPath);
    console.log('[API] Props data:', JSON.stringify(propsData, null, 2));

    // First, let's test if remotion is available
    try {
      const versionResult = await execAsync('npx remotion --version', {
        cwd: process.cwd(),
        timeout: 30000
      });
      console.log('[API] Remotion version check:', versionResult.stdout);
    } catch (versionError) {
      console.error('[API] Remotion version check failed:', versionError);
      throw new Error(`Remotion is not properly installed: ${versionError}`);
    }

    // Check if our remotion files exist
    const remotionIndexPath = join(process.cwd(), 'remotion', 'index.ts');
    if (!existsSync(remotionIndexPath)) {
      throw new Error(`Remotion index file not found at: ${remotionIndexPath}`);
    }
    console.log('[API] Remotion index file found:', remotionIndexPath);

    // Build the command
    const command = `npx remotion render remotion/index.ts MessageConversation "${outputPath}" --props="${propsPath}" --log=info`;
    console.log('[API] Executing command:', command);
    console.log('[API] Working directory:', process.cwd());

    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    console.log('[API] Command completed successfully');
    console.log('[API] Command stdout:', stdout);
    if (stderr) {
      console.warn('[API] Command stderr:', stderr);
    }

    // Check if video file exists
    if (!existsSync(outputPath)) {
      console.error('[API] Video file was not created at:', outputPath);
      throw new Error('Video file was not created after successful command execution');
    }

    // Read the video file
    const videoBuffer = readFileSync(outputPath);
    console.log('[API] Video buffer size:', videoBuffer.length);

    // Return the video as a response
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="chat-video-${timestamp}.mp4"`,
        'Content-Length': videoBuffer.length.toString(),
      },
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
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Required files not found. Please ensure the Remotion setup is complete.';
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        statusCode = 408;
        errorMessage = 'Video generation timed out. Please try again.';
      } else if (error.message.includes('Command failed')) {
        statusCode = 500;
        errorMessage = `Remotion command failed: ${error.message}`;
      } else if (error.message.includes('not properly installed')) {
        statusCode = 500;
        errorMessage = 'Remotion is not properly installed or configured.';
      }
    }

    return NextResponse.json(
      { 
        error: 'Video generation failed', 
        details: errorMessage,
        fullError: error instanceof Error ? error.message : String(error),
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
    
    if (outputPath) {
      try {
        unlinkSync(outputPath);
        console.log('[API] Video file cleaned up');
      } catch (cleanupError) {
        console.warn('[API] Could not clean up video file:', cleanupError);
      }
    }
  }
}
