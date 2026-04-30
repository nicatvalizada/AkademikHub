import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  articleImportFromLinkResultSchema,
  type ArticleImportFromLinkResult,
} from "@akademik/shared";

const MAX_HTML_LENGTH = 2_000_000;
const MAX_CONTENT_LENGTH = 16_000;
const MIN_CONTENT_LENGTH = 120;
const MAX_TAGS = 8;
const MAX_REDIRECTS = 5;
const MIN_CANDIDATE_SCORE = 700;
const BOILERPLATE_SECTION_PATTERN =
  /<(?:section|div|aside|nav|footer|header|ul|ol)\b[^>]*(?:class|id)=["'][^"']*(?:comment|comments|reply|related|recommend|recommended|share|social|author|meta|breadcrumb|sidebar|menu|footer|header|newsletter|subscribe|promo|banner|ads?|advert|outbrain|taboola|tags?|most-popular|popular|latest|trending|read-more|more-from|next|previous)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div|aside|nav|footer|header|ul|ol)>/gi;
const BOILERPLATE_PARAGRAPH_PATTERN =
  /^(?:ana səhifə|home|homepage|read more|more from|latest|latest news|recommended|related|share|follow us|subscribe|newsletter|comments?|leave a comment|sign in|login|register|menu|breadcrumb|previous|next|popular|trending|cookie|privacy policy|terms of use)\b/i;
const BOILERPLATE_LINE_FRAGMENT_PATTERN =
  /\b(?:ana səhifə|home|read more|latest news|follow us|share this|related articles?|recommended|newsletter|subscribe|leave a comment|all rights reserved|privacy policy|terms of use|copyright)\b/i;
const TAG_VERB_SUFFIXES = [
  "acaq",
  "əcək",
  "araq",
  "ərək",
  "dı",
  "di",
  "du",
  "dü",
  "dır",
  "dir",
  "dur",
  "dür",
  "əcəkdir",
  "acaqdır",
  "edir",
  "əcəkdi",
  "ir",
  "miş",
  "mış",
  "muş",
  "müş",
  "mişdir",
  "mışdır",
  "muşdur",
  "müşdür",
  "malı",
  "məli",
  "ub",
  "üb",
  "ydı",
  "ydi",
  "yub",
  "yüb",
];

const TAG_STOPWORDS = new Set([
  "a",
  "about",
  "after",
  "against",
  "ai",
  "all",
  "also",
  "and",
  "article",
  "as",
  "at",
  "az",
  "be",
  "been",
  "before",
  "between",
  "bir",
  "biraz",
  "bu",
  "buna",
  "bunun",
  "by",
  "can",
  "cookie",
  "da",
  "de",
  "də",
  "daha",
  "dan",
  "dəki",
  "for",
  "from",
  "haqqında",
  "has",
  "have",
  "ilə",
  "ilədir",
  "iləki",
  "in",
  "into",
  "is",
  "it",
  "its",
  "kimi",
  "lakin",
  "məqalə",
  "məqalənin",
  "nə",
  "nəticə",
  "of",
  "olan",
  "olar",
  "olaraq",
  "on",
  "or",
  "qədər",
  "qeyd",
  "səhifə",
  "sayt",
  "share",
  "site",
  "sonra",
  "tech",
  "that",
  "the",
  "their",
  "this",
  "through",
  "to",
  "üçün",
  "və",
  "was",
  "were",
  "with",
  "www",
  "ya",
  "ya-da",
  "yəni",
  "you",
  "your",
  "edir",
  "etdi",
  "etdikdə",
  "etmək",
  "etmiş",
  "etmişdir",
  "etməyə",
  "etməsi",
  "etmişdi",
  "edərək",
  "edən",
  "edilmiş",
  "edilmişdir",
  "oldu",
  "olduğu",
  "olduqda",
  "olmuş",
  "olmuşdur",
  "olunmuş",
  "olunmuşdur",
  "olaraqdır",
]);

const ARTICLE_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
  "Accept-Language": "az,en;q=0.9,tr;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (compatible; AkademikArticleImporter/1.0; +https://akademik.local)",
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  copy: "©",
  gt: ">",
  hellip: "...",
  ldquo: "\"",
  lt: "<",
  mdash: " - ",
  nbsp: " ",
  ndash: " - ",
  quot: "\"",
  rdquo: "\"",
  reg: "®",
  rsquo: "'",
};

export class ArticleImportError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "ARTICLE_IMPORT_FAILED",
  ) {
    super(message);
    this.name = "ArticleImportError";
  }
}

export async function importArticleFromUrl(rawUrl: string): Promise<ArticleImportFromLinkResult> {
  const url = normalizeUrl(rawUrl);

  let response: Response;
  let resolvedUrl: string;
  try {
    const result = await fetchArticleUrl(url);
    response = result.response;
    resolvedUrl = result.resolvedUrl;
  } catch (err) {
    if (err instanceof ArticleImportError) throw err;
    throw new ArticleImportError(
      "Linkə qoşulmaq mümkün olmadı. Linki və saytın əlçatanlığını yoxlayın.",
      502,
      "ARTICLE_IMPORT_FETCH_FAILED",
    );
  }

  if (!response.ok) {
    throw new ArticleImportError(
      "Linkdən məqalə almaq mümkün olmadı.",
      502,
      "ARTICLE_IMPORT_HTTP_ERROR",
    );
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const raw = (await response.text()).slice(0, MAX_HTML_LENGTH);

  const result = contentType.includes("text/plain")
    ? extractFromPlainText(raw, resolvedUrl)
    : extractFromHtml(raw, resolvedUrl);

  return articleImportFromLinkResultSchema.parse(result);
}

async function fetchArticleUrl(
  url: string,
  redirectCount = 0,
): Promise<{ response: Response; resolvedUrl: string }> {
  await assertPublicFetchTarget(url);

  const response = await fetch(url, {
    headers: ARTICLE_FETCH_HEADERS,
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });

  if (isRedirect(response.status)) {
    if (redirectCount >= MAX_REDIRECTS) {
      throw new ArticleImportError(
        "Link çox sayda yönləndirmə etdi.",
        400,
        "ARTICLE_IMPORT_TOO_MANY_REDIRECTS",
      );
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new ArticleImportError(
        "Link yönləndirməsi düzgün deyil.",
        400,
        "ARTICLE_IMPORT_INVALID_REDIRECT",
      );
    }

    const nextUrl = normalizeUrl(new URL(location, url).toString());
    return fetchArticleUrl(nextUrl, redirectCount + 1);
  }

  return { response, resolvedUrl: response.url || url };
}

function isRedirect(status: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

async function assertPublicFetchTarget(rawUrl: string): Promise<void> {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.replace(/^\[(.*)\]$/, "$1");

  if (parsed.username || parsed.password) {
    throw new ArticleImportError(
      "İstifadəçi məlumatı olan linklər dəstəklənmir.",
      400,
      "ARTICLE_IMPORT_INVALID_URL",
    );
  }

  if (isBlockedHostname(hostname)) {
    throw new ArticleImportError(
      "Lokal və ya daxili şəbəkə linkləri dəstəklənmir.",
      400,
      "ARTICLE_IMPORT_BLOCKED_URL",
    );
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some((record) => isPrivateAddress(record.address))) {
    throw new ArticleImportError(
      "Lokal və ya daxili şəbəkə linkləri dəstəklənmir.",
      400,
      "ARTICLE_IMPORT_BLOCKED_URL",
    );
  }
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  );
}

function isPrivateAddress(address: string): boolean {
  const embeddedIpv4 = address.toLowerCase().match(/(?:\d{1,3}\.){3}\d{1,3}$/)?.[0];
  if (embeddedIpv4 && isPrivateIpv4(embeddedIpv4)) return true;

  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("ff")) return true;

  const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return firstHextet >= 0xfe80 && firstHextet <= 0xfebf;
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToNumber(address);
  if (value === null) return true;

  return [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ].some(([base, bits]) => ipv4InRange(value, String(base), Number(bits)));
}

function ipv4ToNumber(address: string): number | null {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return null;
  }
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function ipv4InRange(address: number, baseAddress: string, maskBits: number): boolean {
  const base = ipv4ToNumber(baseAddress);
  if (base === null) return false;
  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return (address & mask) === (base & mask);
}

function extractFromPlainText(text: string, resolvedUrl: string): ArticleImportFromLinkResult {
  const title = fallbackTitleFromUrl(resolvedUrl);
  const content = finalizeContent(normalizePlainText(text), title);
  if (content.length < MIN_CONTENT_LENGTH) {
    throw new ArticleImportError(
      "Linkdən kifayət qədər məqalə məzmunu çıxarmaq olmadı.",
      422,
      "ARTICLE_IMPORT_CONTENT_TOO_SHORT",
    );
  }

  return {
    title,
    content,
    link: resolvedUrl,
    tags: generateAutomaticTags(title, content),
  };
}

function extractFromHtml(html: string, resolvedUrl: string): ArticleImportFromLinkResult {
  const title = extractTitle(html, resolvedUrl);
  const content = extractBestContent(html, title);
  const tags = mergeTags(extractTags(html), generateAutomaticTags(title, content));

  if (content.length < MIN_CONTENT_LENGTH) {
    throw new ArticleImportError(
      "Linkdən kifayət qədər məqalə məzmunu çıxarmaq olmadı. Bəzi saytlar məzmunu qoruyur və ya JavaScript ilə yükləyir.",
      422,
      "ARTICLE_IMPORT_CONTENT_TOO_SHORT",
    );
  }

  return {
    title,
    content,
    link: resolvedUrl,
    tags,
  };
}

function extractTitle(html: string, resolvedUrl: string): string {
  const candidates = [
    findMetaContent(html, "property", "og:title"),
    findMetaContent(html, "name", "twitter:title"),
    findMetaContent(html, "name", "title"),
    findTagContent(html, "title"),
    findTagContent(html, "h1"),
  ];

  for (const candidate of candidates) {
    const cleaned = cleanTitle(candidate);
    if (cleaned) return cleaned;
  }

  return fallbackTitleFromUrl(resolvedUrl);
}

function extractTags(html: string): string[] {
  const tags: string[] = [];
  const keywords = findMetaContent(html, "name", "keywords");
  if (keywords) {
    tags.push(...keywords.split(/[;,|]/g));
  }

  const articleTags = findAllMetaContents(html, "property", "article:tag");
  tags.push(...articleTags);

  const seen = new Set<string>();
  return tags
    .map((tag) => normalizeInlineText(tag))
    .filter((tag) => tag.length >= 2 && tag.length <= 40)
    .filter(isKeywordLikeTag)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase("az");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_TAGS);
}

function generateAutomaticTags(title: string, content: string): string[] {
  const scores = new Map<string, number>();
  const titleWords = tokenizeTagWords(title);

  titleWords.forEach((word, index) => {
    const current = scores.get(word) ?? 0;
    scores.set(word, current + 10 + Math.max(0, 5 - index));
  });

  for (let index = 0; index < Math.min(titleWords.length - 1, 4); index += 1) {
    const phrase = `${titleWords[index]} ${titleWords[index + 1]}`;
    if (phrase.length <= 40) {
      const current = scores.get(phrase) ?? 0;
      scores.set(phrase, current + 12 - index);
    }
  }

  const contentWords = tokenizeTagWords(content.slice(0, 10_000));
  contentWords.forEach((word) => {
    const current = scores.get(word) ?? 0;
    scores.set(word, current + 1);
  });

  const ranked = [...scores.entries()]
    .filter(([, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .map(([tag]) => tag);

  return selectTopTags(ranked);
}

function tokenizeTagWords(text: string): string[] {
  const matches = text
    .toLocaleLowerCase("az")
    .match(/\p{L}[\p{L}\p{N}-]{2,}/gu);

  if (!matches) return [];

  return matches
    .map((word) => word.replace(/^-+|-+$/g, ""))
    .filter((word) => word.length >= 3 && word.length <= 40)
    .filter((word) => !/^\d+$/.test(word))
    .filter(isKeywordLikeWord);
}

function mergeTags(...groups: string[][]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const rawTag of group) {
      const tag = normalizeInlineText(rawTag).toLocaleLowerCase("az");
      if (!tag || tag.length < 2 || tag.length > 40 || seen.has(tag) || !isKeywordLikeTag(tag)) continue;
      seen.add(tag);
      merged.push(tag);
      if (merged.length >= MAX_TAGS) return merged;
    }
  }

  return merged;
}

function selectTopTags(candidates: string[]): string[] {
  const selected: string[] = [];

  for (const candidate of candidates) {
    const normalized = candidate.toLocaleLowerCase("az");
    const isSingleWord = !normalized.includes(" ");
    const overlaps = selected.some((tag) => {
      const words = tag.split(" ");
      return tag === normalized || (isSingleWord && words.includes(normalized));
    });

    if (overlaps) continue;
    selected.push(normalized);
    if (selected.length >= MAX_TAGS) break;
  }

  return selected;
}

function isKeywordLikeTag(tag: string): boolean {
  const normalized = normalizeInlineText(tag).toLocaleLowerCase("az");
  if (!normalized) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  return words.every(isKeywordLikeWord);
}

function isKeywordLikeWord(word: string): boolean {
  if (!word || TAG_STOPWORDS.has(word)) return false;
  if (word.length < 3 || word.length > 40) return false;

  if (TAG_VERB_SUFFIXES.some((suffix) => word.length > suffix.length + 2 && word.endsWith(suffix))) {
    return false;
  }

  return true;
}

function extractBestContent(html: string, title: string): string {
  const candidates = collectCandidateHtmlBlocks(html);
  const scoredCandidates = candidates
    .map((candidate) => {
      const cleanedHtml = cleanCandidateHtml(candidate);
      const text = finalizeContent(htmlToText(cleanedHtml), title);
      return {
        text,
        score: scoreCandidateContent(cleanedHtml, text),
      };
    })
    .filter((candidate) => candidate.text);

  const bestCandidate = scoredCandidates.sort((a, b) => b.score - a.score)[0];
  if (bestCandidate && bestCandidate.score >= MIN_CANDIDATE_SCORE) {
    return trimContent(bestCandidate.text, MAX_CONTENT_LENGTH);
  }

  const bodyHtml = cleanCandidateHtml(findBodyHtml(html) ?? html);
  const bodyText = finalizeContent(htmlToText(bodyHtml), title);
  if (bodyText) {
    return trimContent(bodyText, MAX_CONTENT_LENGTH);
  }

  return trimContent(bestCandidate?.text ?? "", MAX_CONTENT_LENGTH);
}

function collectCandidateHtmlBlocks(html: string): string[] {
  const cleaned = removeNoiseBlocks(html);
  const matches = [
    ...collectTagBlocks(cleaned, "article"),
    ...collectTagBlocks(cleaned, "main"),
    ...collectPatternBlocks(
      cleaned,
      /<(?:section|div)\b[^>]*(?:class|id)=["'][^"']*(?:article|content|post|entry|story|main|body|markdown|blog|text)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi,
    ),
  ];

  const unique = new Set<string>();
  const result: string[] = [];
  for (const match of matches) {
    const normalized = match.replace(/\s+/g, " ").trim();
    if (!normalized || normalized.length < 120 || unique.has(normalized)) continue;
    unique.add(normalized);
    result.push(match);
  }
  return result;
}

function collectTagBlocks(html: string, tag: string): string[] {
  return collectPatternBlocks(
    html,
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"),
  );
}

function collectPatternBlocks(html: string, pattern: RegExp): string[] {
  const blocks: string[] = [];
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match) {
    if (match[1]) blocks.push(match[1]);
    match = pattern.exec(html);
  }
  return blocks;
}

function findBodyHtml(html: string): string | null {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1] ?? null;
}

function removeNoiseBlocks(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(?:script|style|noscript|svg|iframe|canvas|form|button|input|nav|footer|header|aside|template)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript|svg|iframe|canvas|form|button|input|nav|footer|header|aside|template)>/gi,
      " ",
    );
}

function cleanCandidateHtml(html: string): string {
  return removeNoiseBlocks(html)
    .replace(BOILERPLATE_SECTION_PATTERN, " ")
    .replace(
      /<(?:section|div|p|span)\b[^>]*(?:class|id)=["'][^"']*(?:caption|credit|source|disclaimer|sponsor)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div|p|span)>/gi,
      " ",
    );
}

function htmlToText(html: string): string {
  return normalizePlainText(
    removeNoiseBlocks(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<\/(?:p|div|section|article|main|li|ul|ol|h1|h2|h3|h4|h5|h6|blockquote|pre|tr|table)>/gi, "\n\n")
      .replace(/<\/td>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function normalizePlainText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function finalizeContent(text: string, title: string): string {
  const lines = text
    .split(/\n{2,}/)
    .map((line) => normalizeInlineText(line))
    .filter(Boolean);

  const titleKey = normalizeInlineText(title).toLocaleLowerCase("az");
  const seen = new Set<string>();
  const paragraphs = lines.filter((line) => {
    const key = line.toLocaleLowerCase("az");
    if (key === titleKey) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    if (line.length < 25 && !line.startsWith("- ")) return false;
    if (isBoilerplateParagraph(line)) return false;
    if (/^(share|subscribe|cookie|advertisement|reklam|comments?|sign in|login)\b/i.test(line)) {
      return false;
    }
    return true;
  });

  return trimContent(paragraphs.join("\n\n"), MAX_CONTENT_LENGTH);
}

function trimContent(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const parts = text.split(/\n\n/);
  const kept: string[] = [];
  let size = 0;
  for (const part of parts) {
    const nextSize = size + part.length + (kept.length ? 2 : 0);
    if (nextSize > maxLength) break;
    kept.push(part);
    size = nextSize;
  }

  if (kept.length > 0) return kept.join("\n\n");
  return text.slice(0, maxLength).trimEnd();
}

function scoreContent(text: string): number {
  const paragraphs = text.split(/\n\n/).filter(Boolean);
  const longParagraphs = paragraphs.filter((paragraph) => paragraph.length >= 120).length;
  const sentenceCount = (text.match(/[.!?](?:\s|$)/g) || []).length;
  return text.length + longParagraphs * 300 + sentenceCount * 20;
}

function scoreCandidateContent(html: string, text: string): number {
  if (!text) return 0;

  const paragraphTagCount = (html.match(/<p\b/gi) || []).length;
  const headingCount = (html.match(/<h[1-4]\b/gi) || []).length;
  const articleHintCount =
    (html.match(/\b(?:article|entry|post|story|content|markdown)\b/gi) || []).length;
  const linkCount = (html.match(/<a\b/gi) || []).length;
  const boilerplateHits = (text.match(BOILERPLATE_LINE_FRAGMENT_PATTERN) || []).length;

  return (
    scoreContent(text) +
    paragraphTagCount * 80 +
    headingCount * 40 +
    articleHintCount * 35 -
    linkCount * 12 -
    boilerplateHits * 180
  );
}

function isBoilerplateParagraph(line: string): boolean {
  if (BOILERPLATE_PARAGRAPH_PATTERN.test(line)) return true;
  if (BOILERPLATE_LINE_FRAGMENT_PATTERN.test(line) && line.length < 140) return true;
  if ((line.match(/\|/g) || []).length >= 3) return true;
  if ((line.match(/›|»|>/g) || []).length >= 2 && line.length < 120) return true;
  if ((line.match(/[A-Za-z0-9_-]+\.(?:com|net|org|az|io)\b/g) || []).length >= 2) return true;
  return false;
}

function cleanTitle(value: string | null | undefined): string {
  const text = normalizeInlineText(value ?? "");
  if (!text) return "";

  const parts = text.split(/\s[|:>-]\s/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[0].length >= 18) {
    return parts[0];
  }
  return text;
}

function fallbackTitleFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const lastSegment = url.pathname.split("/").filter(Boolean).at(-1);
    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment)
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ");
      const cleaned = normalizeInlineText(decoded);
      if (cleaned) return cleaned;
    }
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "İdxal edilən məqalə";
  }
}

function normalizeInlineText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function findTagContent(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? normalizeInlineText(match[1]) : null;
}

function findMetaContent(html: string, attr: "name" | "property", value: string): string | null {
  const escaped = escapeRegExp(value);
  const patterns = [
    new RegExp(
      `<meta[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return normalizeInlineText(match[1]);
  }
  return null;
}

function findAllMetaContents(html: string, attr: "name" | "property", value: string): string[] {
  const escaped = escapeRegExp(value);
  const patterns = [
    new RegExp(
      `<meta[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "gi",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escaped}["'][^>]*>`,
      "gi",
    ),
  ];

  const results: string[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null = pattern.exec(html);
    while (match) {
      if (match[1]) results.push(normalizeInlineText(match[1]));
      match = pattern.exec(html);
    }
  }
  return results;
}

function normalizeUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new ArticleImportError("Düzgün məqalə linki daxil edin.", 400, "ARTICLE_IMPORT_INVALID_URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ArticleImportError("Yalnız http və https linkləri dəstəklənir.", 400, "ARTICLE_IMPORT_INVALID_URL");
  }

  parsed.hash = "";
  return parsed.toString();
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
    const normalized = String(body).toLowerCase();
    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return ENTITY_MAP[normalized] ?? entity;
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
