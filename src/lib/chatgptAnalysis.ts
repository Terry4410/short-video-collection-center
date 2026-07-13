import type { BookmarkPriority, BookmarkStatus } from '../types/bookmark';

export type ChatGptAnalysisResult = {
  title?: string;
  summary?: string;
  mainCategory?: string;
  subCategory?: string;
  tags?: string[];
  placeName?: string;
  addressHint?: string;
  hasLocation?: boolean;
  status?: BookmarkStatus | string;
  priority?: BookmarkPriority | string;
  confidence?: number;
  analysisBasis?: 'public_content' | 'title_only' | 'unavailable' | string;
  needsConfirmation?: boolean;
};

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function objectCandidates(rawText: string): string[] {
  const candidates = [rawText.trim()];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < rawText.length; index += 1) {
    const character = rawText[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') { inString = true; continue; }
    if (character === '{') {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (character === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(rawText.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return candidates;
}

export function parseChatGptAnalysisResult(rawText: string): ChatGptAnalysisResult {
  const withoutCodeFence = rawText.replace(/\x60\x60\x60(?:json)?/gi, '').trim();

  for (const candidate of objectCandidates(withoutCodeFence)) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      const value = parsed as Record<string, unknown>;
      const confidence = typeof value.confidence === 'number'
        ? Math.max(0, Math.min(100, Math.round(value.confidence)))
        : undefined;

      return {
        title: text(value.title),
        summary: text(value.summary),
        mainCategory: text(value.mainCategory),
        subCategory: text(value.subCategory),
        tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : undefined,
        placeName: text(value.placeName),
        addressHint: text(value.addressHint),
        hasLocation: typeof value.hasLocation === 'boolean' ? value.hasLocation : undefined,
        status: text(value.status),
        priority: text(value.priority),
        confidence,
        analysisBasis: text(value.analysisBasis),
        needsConfirmation: typeof value.needsConfirmation === 'boolean' ? value.needsConfirmation : undefined,
      };
    } catch {
      // Keep trying later JSON objects when a pasted conversation contains extra text.
    }
  }
  throw new Error('找不到可解析的 JSON object');
}
