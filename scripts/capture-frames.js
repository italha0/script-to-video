// Capture frames from the /frame page using Playwright and save PNGs locally.
// Usage (Windows cmd):
//   set URL=http://localhost:3000
//   node scripts/capture-frames.js
// Optional env:
//   URL - base Next server URL
//   FRAMES - total frames to capture (default 150)
//   WIDTH, HEIGHT - viewport (default 1080x1920)
//   FPS - frame rate (default 30)
//   OUT - output dir (default frames_out)
//   PAYLOAD - JSON string with { messages, characters, userCharacterId }

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

const URL_BASE = process.env.URL || 'http://localhost:3000'
const TOTAL_FRAMES = parseInt(process.env.FRAMES || '150', 10)
const WIDTH = parseInt(process.env.WIDTH || '1080', 10)
const HEIGHT = parseInt(process.env.HEIGHT || '1920', 10)
const FPS = parseInt(process.env.FPS || '30', 10)
const OUT = process.env.OUT || 'frames_out'

const DEFAULT_MESSAGES = [
  { id: '1', characterId: 'a', text: "what're you doing tonight?" },
  { id: '2', characterId: 'self', text: 'ugh i have to study', service: 'sms', status: 'failed' },
  { id: '3', characterId: 'self', text: 'you?', service: 'imessage', status: 'delivered' },
]
const DEFAULT_CHARACTERS = [ { id: 'a', name: 'Alex' } ]
let PAYLOAD
if (process.env.PAYLOAD_FILE && fs.existsSync(process.env.PAYLOAD_FILE)) {
  PAYLOAD = JSON.parse(fs.readFileSync(process.env.PAYLOAD_FILE, 'utf8'))
  console.log('Loaded payload from', process.env.PAYLOAD_FILE)
} else if (process.env.PAYLOAD) {
  PAYLOAD = JSON.parse(process.env.PAYLOAD)
  console.log('Loaded payload from PAYLOAD env')
} else {
  PAYLOAD = { messages: DEFAULT_MESSAGES, characters: DEFAULT_CHARACTERS, userCharacterId: 'self' }
  console.log('Using default demo payload')
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
  const page = await context.newPage()

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const params = new URLSearchParams({
      frame: String(i),
      messages: JSON.stringify(PAYLOAD.messages),
      characters: JSON.stringify(PAYLOAD.characters),
      userCharacterId: PAYLOAD.userCharacterId || 'self',
    })
    const url = `${URL_BASE}/frame?${params.toString()}`
    await page.goto(url, { waitUntil: 'load', timeout: 15000 })
    await page.waitForTimeout(10)
    const buf = await page.screenshot({ type: 'png' })
    const name = String(i).padStart(5, '0') + '.png'
    fs.writeFileSync(path.join(OUT, name), buf)
    if (i % FPS === 0) console.log(`saved ${i + 1}/${TOTAL_FRAMES}`)
  }

  await browser.close()
  console.log('done:', OUT)
})().catch((e) => {
  console.error('capture failed:', e)
  process.exit(1)
})
