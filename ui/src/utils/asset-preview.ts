import {
  extract3DModelUrls,
  extractImageUrls,
  extractVideoUrls,
} from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils';

export type AssetPreviewType = 'text' | 'video' | '3d' | 'json' | 'unknown';

const TEXT_KEYS = ['data', 'content', 'text', 'message', 'result', 'output', 'outputText', 'outputtext'] as const;

function unescapeNewlines(s: string) {
  // Handle "\\n" sequences coming from JSON-encoded content
  return s.includes('\\n') ? s.replaceAll('\\n', '\n') : s;
}

function isPureImageUrl(s: string) {
  const trimmed = s.trim();
  if (!trimmed.startsWith('http')) return false;
  const urls = extractImageUrls(trimmed);
  return urls.length === 1 && urls[0] === trimmed;
}

export function normalizeTextOutput(renderData: any): string | null {
  if (renderData == null) return null;
  if (typeof renderData === 'string') {
    const s = unescapeNewlines(renderData);
    // 避免把“输入图片 URL 回显”当成文本输出
    if (isPureImageUrl(s)) return null;
    return s;
  }

  if (typeof renderData !== 'object') return String(renderData);

  // Direct keys
  for (const k of TEXT_KEYS) {
    const v = (renderData as any)?.[k];
    if (typeof v === 'string' && v.trim() !== '') {
      const s = unescapeNewlines(v);
      if (isPureImageUrl(s)) continue;
      return s;
    }
  }

  // Nested common shape: { data: { content: "..." } }
  const nested = (renderData as any)?.data;
  if (nested && typeof nested === 'object') {
    for (const k of TEXT_KEYS) {
      const v = (nested as any)?.[k];
      if (typeof v === 'string' && v.trim() !== '') {
        const s = unescapeNewlines(v);
        if (isPureImageUrl(s)) continue;
        return s;
      }
    }
  }

  return null;
}

export function detectAssetPreview(renderType: string | undefined, renderData: any): {
  type: AssetPreviewType;
  url?: string;
  text?: string;
} {
  // Try to find media urls even when wrapped in json
  const asString = typeof renderData === 'string' ? renderData : safeStringify(renderData);
  const videos = extractVideoUrls(asString);
  const models = extract3DModelUrls(asString);

  if (renderType === 'video' || videos.length > 0) return { type: 'video', url: videos[0] ?? asString };
  if (models.length > 0) return { type: '3d', url: models[0] };

  const text = normalizeTextOutput(renderData);
  if (text) return { type: 'text', text };

  if ((renderType ?? '').toLowerCase() === 'json') return { type: 'json' };
  if (typeof renderData === 'string') return { type: 'text', text: renderData };
  return { type: 'unknown' };
}

export function isTextLikeOutput(renderType: string | undefined, renderData: any) {
  const t = (renderType ?? '').toLowerCase();
  if (t === 'text') return true;
  // JSON that actually contains text fields should be treated as text
  if (t === 'json' && normalizeTextOutput(renderData)) return true;
  return false;
}

function safeStringify(data: any) {
  try {
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return String(data ?? '');
  }
}


