// Shared emoji utilities for both client and Node scripts

export const toCodePoints = (grapheme: string) =>
  Array.from(grapheme)
    .map((c) => c.codePointAt(0)!)
    .map((cp) => cp.toString(16))
    .join('-')
    .toLowerCase();

export const isEmojiGrapheme = (grapheme: string) => {
  return Array.from(grapheme).some((c) => /\p{Extended_Pictographic}/u.test(c));
};

export const segmentGraphemes = (text: string): string[] => {
  if (!text) return [];
  const Seg = (Intl as any).Segmenter;
  if (!Seg) return [text];
  const seg = new Seg(undefined, { granularity: 'grapheme' });
  const it = (seg as any).segment(text)[Symbol.iterator]();
  const out: string[] = [];
  let cur = it.next();
  while (!cur.done) {
    out.push(cur.value.segment as string);
    cur = it.next();
  }
  return out;
};

export const extractEmojiCodesFromText = (text: string): string[] => {
  const codes = new Set<string>();
  for (const g of segmentGraphemes(text)) {
    if (isEmojiGrapheme(g)) codes.add(toCodePoints(g));
  }
  return Array.from(codes);
};
