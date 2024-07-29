import chroma from 'chroma-js';

const morandiColorMapper: Record<string, string> = {
  '#c15048': chroma.mix('white', '#c15048', 1, 'hsv').hex(),
  '#e58c3a': '#fadebb',
  '#f3cd5f': '#fef8a3',
  '#98ae36': '#d6e983',
  '#6eb854': '#ceefc5',
  '#56b4a2': '#8dcdc1',
  '#57afe0': '#a5c9dc',
  '#7fa3f8': '#d1dcfb',
  '#b291f7': '#d9caf8',
  '#de7db7': '#f2c1be',
};

export const splitEmojiLink = (
  src = '',
  fallbackColor = 'var(--slate1)',
): { backgroundColor: string; text: string; emoji: string } => {
  if (src.startsWith('emoji') && src.includes(':')) {
    const [, emoji, color, lucide] = src.split(':');
    const morandiColor = morandiColorMapper[color];

    if (lucide) {
      return {
        backgroundColor: morandiColor || color || fallbackColor,
        text: lucide,
        emoji,
      };
    }

    if (emoji && color) {
      return {
        backgroundColor: morandiColor || color || fallbackColor,
        text: emoji,
        emoji,
      };
    }
  }
  return {
    backgroundColor: fallbackColor,
    text: src.length >= 3 ? src.slice(1) : src,
    emoji: '🍀',
  };
};
