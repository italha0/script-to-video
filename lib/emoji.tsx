import React from 'react';
import { toCodePoints, isEmojiGrapheme } from './emoji-util';
import { staticFile } from 'remotion';

// Helper to render emojis via Twemoji SVGs.
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

const resolveEmojiUrl = (code: string, localBase?: string) => {
  if (localBase) return staticFile(`${localBase}/${code}.svg`);
  return `${CDN_BASE}/${code}.svg`;
};

export const renderWithTwemoji = (text: string, size = 18, opts?: { localBase?: string }): React.ReactNode[] => {
  if (!text) return [];
  const seg = (typeof (Intl as any).Segmenter !== 'undefined')
    ? new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  const parts: React.ReactNode[] = [];
  if (!seg) {
    // Fallback: naive split; emojis may be split but still render as plain text
    return [text];
  }

  const iterator = (seg as any).segment(text)[Symbol.iterator]();
  let cur = iterator.next();
  let idx = 0;
  while (!cur.done) {
    const grapheme = cur.value.segment as string;
    if (isEmojiGrapheme(grapheme)) {
      const code = toCodePoints(grapheme);
      const url = resolveEmojiUrl(code, opts?.localBase);
      parts.push(
        <img
          key={`e-${idx}`}
          src={url}
          alt={grapheme}
          style={{ width: size, height: size, verticalAlign: '-3px', display: 'inline-block' }}
          crossOrigin="anonymous"
        />
      );
    } else {
      parts.push(<React.Fragment key={`t-${idx}`}>{grapheme}</React.Fragment>);
    }
    idx++;
    cur = iterator.next();
  }
  return parts;
};

export default renderWithTwemoji;
