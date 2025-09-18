import twemoji from 'twemoji';
/**
 * Converts a text string into HTML with emoji images using Twemoji, ensuring consistent emoji rendering
 * in headless environments where system color emoji fonts might be unavailable.
 */
export const renderEmojiHTML = (text: string): string => {
  if (!text) return '';
  try {
    return twemoji.parse(text, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
      attributes: () => ({
        draggable: 'false',
        height: '1em',
        width: '1em',
        style: 'display:inline-block;vertical-align:-0.125em;'
      })
    });
  } catch {
    return text;
  }
};
