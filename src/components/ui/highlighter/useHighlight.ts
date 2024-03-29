import useSWR from 'swr';

import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { getHighlighter, type Highlighter } from 'shiki';
import materialThemeLighter from 'tm-themes/themes/material-theme-lighter.json';
import oneDarkPro from 'tm-themes/themes/one-dark-pro.json';

import languageMap from './languageMap';

export const FALLBACK_LANG = 'txt';

const FALLBACK_LANGS = [FALLBACK_LANG];

let cacheHighlighter: Highlighter;

const initHighlighter = async (lang: string): Promise<Highlighter> => {
  let highlighter = cacheHighlighter;
  const language = lang.toLowerCase();

  if (highlighter && FALLBACK_LANGS.includes(language)) return highlighter;

  if (languageMap.includes(language as any) && !FALLBACK_LANGS.includes(language)) {
    FALLBACK_LANGS.push(language);
  }

  highlighter = await getHighlighter({
    langs: FALLBACK_LANGS,
    themes: [oneDarkPro as any, materialThemeLighter as any],
  });

  cacheHighlighter = highlighter;

  return highlighter;
};

export const useHighlight = (text: string, lang: string, isDarkMode: boolean) =>
  useSWR(
    [lang.toLowerCase(), isDarkMode ? 'dark' : 'light', text].join('-'),
    async () => {
      try {
        const language = lang.toLowerCase();
        const highlighter = await initHighlighter(language);
        return highlighter?.codeToHtml(text, {
          lang: languageMap.includes(language as any) ? language : FALLBACK_LANG,
          theme: isDarkMode ? 'one-dark-pro' : 'material-theme-lighter',
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
            transformerNotationWordHighlight(),
            transformerNotationFocus(),
            transformerNotationErrorLevel(),
          ],
        });
      } catch {
        return `<pre><code>${text}</code></pre>`;
      }
    },
    { revalidateOnFocus: false },
  );

export { default as languageMap } from './languageMap';
