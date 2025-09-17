/*
 Prefetch Twemoji SVGs used in your render props into public/emoji/.
 Usage examples (cmd.exe):
   node scripts/prefetch-emojis.cjs remotion out/props.json
   node scripts/prefetch-emojis.cjs inline "[{\"text\":\"Hello 😊\",\"sent\":true}]"
 If no args are given, it will use the default composition props in remotion/Root.tsx.
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

const toCodePoints = (grapheme) =>
  Array.from(grapheme)
    .map((c) => c.codePointAt(0))
    .map((cp) => cp.toString(16))
    .join('-')
    .toLowerCase();

const isEmojiGrapheme = (grapheme) => Array.from(grapheme).some((c) => /\p{Extended_Pictographic}/u.test(c));

const segmentGraphemes = (text) => {
  if (!text) return [];
  const Seg = Intl.Segmenter;
  if (!Seg) return [text];
  const seg = new Seg(undefined, { granularity: 'grapheme' });
  const out = [];
  for (const s of seg.segment(text)) out.push(s.segment);
  return out;
};

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const download = (url, dest) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      file.close(); fs.unlink(dest, () => {});
      return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
    }
    res.pipe(file);
    file.on('finish', () => file.close(resolve));
  }).on('error', (err) => {
    file.close(); fs.unlink(dest, () => {});
    reject(err);
  });
});

const extractEmojiCodes = (messages) => {
  const set = new Set();
  for (const m of messages || []) {
    const text = m.text || '';
    for (const g of segmentGraphemes(text)) {
      if (isEmojiGrapheme(g)) set.add(toCodePoints(g));
    }
  }
  return Array.from(set);
};

const loadMessages = async () => {
  const mode = process.argv[2];
  const arg = process.argv[3];
  if (mode === 'inline') {
    return JSON.parse(arg);
  }
  if (mode === 'remotion') {
    // load defaultProps from remotion/Root.tsx by a naive parse (keeps script simple)
    const rootPath = path.resolve('remotion/Root.tsx');
    const src = fs.readFileSync(rootPath, 'utf8');
    const match = src.match(/messages:\s*(\[[\s\S]*?\])/);
    if (match) {
      // eslint-disable-next-line no-eval
      const arr = eval(match[1].replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":'));
      return arr;
    }
  }
  if (arg && fs.existsSync(arg)) {
    const json = JSON.parse(fs.readFileSync(arg, 'utf8'));
    return json.messages || json;
  }
  return [];
};

(async () => {
  const messages = await loadMessages();
  const codes = extractEmojiCodes(messages);
  if (!codes.length) {
    console.log('No emoji to prefetch.');
    return;
  }
  const outDir = path.resolve('public/emoji');
  ensureDir(outDir);
  console.log(`Prefetching ${codes.length} emoji to public/emoji ...`);
  for (const code of codes) {
    const dest = path.join(outDir, `${code}.svg`);
    if (fs.existsSync(dest)) continue;
    const url = `${CDN_BASE}/${code}.svg`;
    try {
      await download(url, dest);
      console.log('✔', code);
    } catch (e) {
      console.warn('✖', code, String(e.message || e));
    }
  }
  console.log('Done.');
})();
