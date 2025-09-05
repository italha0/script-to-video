import { type NextRequest, NextResponse } from "next/server"
import path from "node:path"
import os from "node:os"
import fs from "node:fs/promises"
// Load heavy Remotion modules at runtime to avoid Next/Webpack bundling issues
type NodeReq = NodeRequire & ((id: string) => any)
const nodeRequire: NodeReq = (eval("require") as unknown) as NodeReq

// Ensure this route runs on the Node.js runtime (not Edge) since we need Puppeteer/FFmpeg
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

let cachedServeUrl: string | null = null

export async function POST(request: NextRequest) {
  try {
    console.log("[generate-video] Starting MP4 render via Remotion...")

  const { messages, characters, showWatermark = true, userCharacterId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // 1) Bundle the Remotion project
    const entry = path.join(process.cwd(), "remotion", "index.tsx")
    const { bundle } = nodeRequire("@remotion/bundler") as typeof import("@remotion/bundler")

    let serveUrl = cachedServeUrl
    if (!serveUrl) {
      console.log("[generate-video] Bundling Remotion entry:", entry)
      serveUrl = await bundle({ entryPoint: entry })
      cachedServeUrl = serveUrl
      console.log("[generate-video] Bundle ready:", serveUrl)
    } else {
      console.log("[generate-video] Using cached bundle:", serveUrl)
    }

    // 2) Get compositions and pick the ChatVideo comp
  const { getCompositions } = nodeRequire("@remotion/renderer") as typeof import("@remotion/renderer")
  const comps = await getCompositions(serveUrl, { inputProps: { messages, characters, showWatermark, userCharacterId } })
    const composition = comps.find((c) => c.id === "ChatVideo")
    if (!composition) {
      return NextResponse.json({ error: "Remotion composition 'ChatVideo' not found" }, { status: 500 })
    }

    // Compute dynamic duration to avoid long renders
    const fps = 30
    const durationFrames = (() => {
      let total = 0
      for (let i = 0; i < messages.length; i++) {
        const wordCount = String(messages[i]?.text ?? "").trim().split(/\s+/).filter(Boolean).length
        const typing = Math.max(30, wordCount * 15) // 0.5s per word, min 1s (30f)
        total += typing + 30 // show 1s
        if (i < messages.length - 1) total += 15 // pause 0.5s between messages
      }
      return Math.max(90, total) // at least 3 seconds
    })()
    console.log("[generate-video] Computed duration:", durationFrames, "frames (~", (durationFrames / fps).toFixed(1), "s)")

    // 3) Render to a temp MP4
    const tmpOut = path.join(os.tmpdir(), `chat-video-${Date.now()}.mp4`)
    console.log("[generate-video] Rendering to:", tmpOut)

    const { renderMedia } = nodeRequire("@remotion/renderer") as typeof import("@remotion/renderer")
    await renderMedia({
      codec: "h264",
      // Override duration to match the script length
      composition: { ...composition, durationInFrames: durationFrames } as typeof composition,
      serveUrl,
      outputLocation: tmpOut,
  inputProps: { messages, characters, showWatermark, userCharacterId },
      audioCodec: "aac",
      crf: 20,
      imageFormat: "jpeg",
      pixelFormat: "yuv420p",
      logLevel: "verbose",
      onBrowserLog: (log) => {
        // Surface browser logs (and errors) to server for debugging
        console.log("[browser]", log.type, ...log.text)
      },
      // You can tweak concurrency if needed
      // concurrency: 4,
    })

    // 4) Read the file and stream back
  const data = await fs.readFile(tmpOut)
  // Convert Buffer to a fresh ArrayBuffer to avoid SharedArrayBuffer typing issues
  const arrayBuffer = new Uint8Array(data).buffer
  const res = new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="chat-video.mp4"',
    "Content-Length": String(data.byteLength),
        "Cache-Control": "no-store",
      },
    })

    // Best-effort cleanup
    fs.unlink(tmpOut).catch(() => {})
    return res
  } catch (error) {
    console.error("[generate-video] Video generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate video", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
