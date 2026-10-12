import type { ScrapeResult, LinkItem, ImageItem, ScrapeMetadata } from '@/types';

// ─── Engine Registry ─────────────────────────────────────────────────────────
// Engines are tried in order. Jina Reader handles Cloudflare / JS-heavy sites.
// CORS proxies are fallbacks for lighter targets.

export interface EngineResult {
  html: string;
  markdown: string; // pre-built markdown (Jina returns it directly)
  ok: boolean;
  engineName: string;
  isMarkdownDirect: boolean; // skip HTML parse when true
}

const JINA_HEADERS = {
  'Accept': 'text/plain, text/markdown, */*',
  'X-Return-Format': 'markdown',
  'X-Timeout': '30',
  'X-Remove-Selector': 'header,nav,footer,.cookie,#cookie,.ads,.ad',
};

type ScrapeEngine = {
  name: string;
  build: (url: string, apiKey?: string) => string;
  extract: (res: Response) => Promise<{ html: string; markdown: string; ok: boolean }>;
  needsApiKey?: boolean;
  isMarkdownDirect?: boolean;
};

const ENGINES: ScrapeEngine[] = [
  // ── 1. Jina Reader (free, bypasses Cloudflare via real headless browser) ──
  {
    name: 'Jina Reader',
    build: (url) => `https://r.jina.ai/${url}`,
    isMarkdownDirect: true,
    extract: async (res) => {
      const text = await res.text();
      return { html: '', markdown: text, ok: res.ok && text.length > 100 };
    },
  },

  // ── 2. Jina Reader (with scraping mode header for heavier Cloudflare) ──
  {
    name: 'Jina Reader (scraping mode)',
    build: (url) => `https://r.jina.ai/${url}`,
    isMarkdownDirect: true,
    extract: async (res) => {
      const text = await res.text();
      return { html: '', markdown: text, ok: res.ok && text.length > 100 };
    },
  },

  // ── 3. corsproxy.io ──
  {
    name: 'corsproxy.io',
    build: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    extract: async (res) => ({ html: await res.text(), markdown: '', ok: res.ok }),
  },

  // ── 4. AllOrigins ──
  {
    name: 'AllOrigins',
    build: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    extract: async (res) => {
      const data = await res.json();
      return { html: data.contents as string || '', markdown: '', ok: !!data.contents };
    },
  },

  // ── 5. CodeTabs ──
  {
    name: 'CodeTabs',
    build: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    extract: async (res) => ({ html: await res.text(), markdown: '', ok: res.ok }),
  },

  // ── 6. ThingProxy ──
  {
    name: 'ThingProxy',
    build: (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
    extract: async (res) => ({ html: await res.text(), markdown: '', ok: res.ok }),
  },
];

// ─── HTML → Markdown ─────────────────────────────────────────────────────────

function htmlToMarkdown(doc: Document, baseUrl: string): string {
  // Remove noise
  ['script', 'style', 'noscript', 'iframe', 'aside', '.cookie-banner', '#cookie', '.ad'].forEach(sel => {
    try { doc.querySelectorAll(sel).forEach(el => el.remove()); } catch { /* skip */ }
  });

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\s+/g, ' ').trim();
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const children = () => Array.from(node.childNodes).map(processNode).filter(t => t.trim()).join(' ');

    switch (tag) {
      case 'h1': return `# ${children()}\n\n`;
      case 'h2': return `## ${children()}\n\n`;
      case 'h3': return `### ${children()}\n\n`;
      case 'h4': return `#### ${children()}\n\n`;
      case 'h5': return `##### ${children()}\n\n`;
      case 'h6': return `###### ${children()}\n\n`;
      case 'p': { const t = children().trim(); return t ? `${t}\n\n` : ''; }
      case 'br': return '\n';
      case 'hr': return '\n---\n\n';
      case 'strong': case 'b': { const t = children(); return t ? `**${t}**` : ''; }
      case 'em': case 'i': { const t = children(); return t ? `*${t}*` : ''; }
      case 'code': { const t = children(); return t ? `\`${t}\`` : ''; }
      case 'pre': return `\`\`\`\n${el.textContent || ''}\n\`\`\`\n\n`;
      case 'blockquote': return `> ${children()}\n\n`;
      case 'a': {
        const href = el.getAttribute('href') || '';
        const text = children().trim() || href;
        if (!href || href.startsWith('javascript') || href === '#') return text;
        try {
          const abs = href.startsWith('http') ? href : new URL(href, baseUrl).href;
          return `[${text}](${abs})`;
        } catch { return text; }
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'image';
        if (!src) return '';
        try {
          const abs = src.startsWith('http') ? src : new URL(src, baseUrl).href;
          return `![${alt}](${abs})`;
        } catch { return ''; }
      }
      case 'ul': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map(li => `- ${(li.textContent || '').replace(/\s+/g, ' ').trim()}`);
        return items.length ? items.join('\n') + '\n\n' : '';
      }
      case 'ol': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li, i) => `${i + 1}. ${(li.textContent || '').replace(/\s+/g, ' ').trim()}`);
        return items.length ? items.join('\n') + '\n\n' : '';
      }
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (!rows.length) return '';
        return rows.map((row, ri) => {
          const cells = Array.from(row.querySelectorAll('th,td'))
            .map(c => (c.textContent || '').replace(/\s+/g, ' ').trim());
          const line = '| ' + cells.join(' | ') + ' |';
          const sep = ri === 0 ? '\n| ' + cells.map(() => '---').join(' | ') + ' |' : '';
          return line + sep;
        }).join('\n') + '\n\n';
      }
      case 'li': case 'nav': case 'header': case 'footer': case 'script': case 'style': return '';
      default: { const t = children().trim(); return t ? t + ' ' : ''; }
    }
  }

  const main = doc.querySelector('main, article, [role="main"]') || doc.body;
  return (processNode(main) || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Link / Image / Metadata Extractors ──────────────────────────────────────

function extractLinks(doc: Document, baseUrl: string): LinkItem[] {
  const links: LinkItem[] = [];
  const seen = new Set<string>();
  let baseHost = '';
  try { baseHost = new URL(baseUrl).hostname; } catch { /**/ }

  doc.querySelectorAll('a[href]').forEach(el => {
    const href = el.getAttribute('href') || '';
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!href || /^(javascript|mailto|tel|#)/.test(href)) return;
    let abs: string;
    try { abs = href.startsWith('http') ? href : new URL(href, baseUrl).href; } catch { return; }
    if (seen.has(abs)) return;
    seen.add(abs);
    let host = '';
    try { host = new URL(abs).hostname; } catch { return; }
    links.push({ text: text || abs, href: abs, type: host === baseHost ? 'internal' : 'external' });
  });

  return links.slice(0, 200);
}

function extractImages(doc: Document, baseUrl: string): ImageItem[] {
  const images: ImageItem[] = [];
  const seen = new Set<string>();
  doc.querySelectorAll('img[src]').forEach(el => {
    const src = el.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) return;
    let abs: string;
    try { abs = src.startsWith('http') ? src : new URL(src, baseUrl).href; } catch { return; }
    if (seen.has(abs)) return;
    seen.add(abs);
    images.push({ src: abs, alt: el.getAttribute('alt') || '' });
  });
  return images.slice(0, 50);
}

function extractMetadata(doc: Document, loadTime: number): ScrapeMetadata {
  const meta = (name: string) =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') || '';
  const bodyText = doc.body?.textContent || '';
  const words = bodyText.trim().split(/\s+/).filter(Boolean);
  return {
    title: doc.title || '',
    description: meta('description'),
    keywords: meta('keywords'),
    ogTitle: meta('og:title'),
    ogDescription: meta('og:description'),
    ogImage: meta('og:image'),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    language: doc.documentElement.getAttribute('lang') || '',
    wordCount: words.length,
    charCount: bodyText.length,
    loadTime,
    statusCode: 200,
    contentType: 'text/html',
    h1Count: doc.querySelectorAll('h1').length,
    h2Count: doc.querySelectorAll('h2').length,
    linkCount: doc.querySelectorAll('a').length,
    imageCount: doc.querySelectorAll('img').length,
  };
}

// ─── Build metadata from raw markdown (Jina path) ────────────────────────────

function metadataFromMarkdown(md: string, loadTime: number, url: string): ScrapeMetadata {
  // Jina includes a title line like "Title: ..."
  const titleMatch = md.match(/^Title:\s*(.+)$/m);
  const descMatch = md.match(/^Description:\s*(.+)$/m);
  const words = md.trim().split(/\s+/).filter(Boolean);
  const h1Count = (md.match(/^# /gm) || []).length;
  const h2Count = (md.match(/^## /gm) || []).length;
  const linkCount = (md.match(/\[.*?\]\(.*?\)/g) || []).length;
  const imgCount = (md.match(/!\[.*?\]\(.*?\)/g) || []).length;

  return {
    title: titleMatch ? titleMatch[1].trim() : url,
    description: descMatch ? descMatch[1].trim() : '',
    keywords: '',
    ogTitle: titleMatch ? titleMatch[1].trim() : '',
    ogDescription: descMatch ? descMatch[1].trim() : '',
    ogImage: '',
    canonical: url,
    language: '',
    wordCount: words.length,
    charCount: md.length,
    loadTime,
    statusCode: 200,
    contentType: 'text/markdown',
    h1Count,
    h2Count,
    linkCount,
    imageCount: imgCount,
  };
}

// ─── Extract links from Jina markdown ────────────────────────────────────────

function linksFromMarkdown(md: string, baseUrl: string): LinkItem[] {
  const links: LinkItem[] = [];
  const seen = new Set<string>();
  let baseHost = '';
  try { baseHost = new URL(baseUrl).hostname; } catch { /**/ }

  const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(md)) !== null) {
    const [, text, href] = match;
    if (seen.has(href)) continue;
    seen.add(href);
    let host = '';
    try { host = new URL(href).hostname; } catch { continue; }
    links.push({ text: text || href, href, type: host === baseHost ? 'internal' : 'external' });
  }
  return links.slice(0, 200);
}

function imagesFromMarkdown(md: string): ImageItem[] {
  const images: ImageItem[] = [];
  const seen = new Set<string>();
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = imgRegex.exec(md)) !== null) {
    const [, alt, src] = match;
    if (seen.has(src)) continue;
    seen.add(src);
    images.push({ src, alt });
  }
  return images.slice(0, 50);
}

// ─── Main scrape function ─────────────────────────────────────────────────────

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const start = Date.now();
  const scrapedAt = new Date().toISOString();

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    console.log('[WebCrawl] Starting scrape:', targetUrl);

    let lastError = '';
    let successEngine = '';

    for (let i = 0; i < ENGINES.length; i++) {
      const engine = ENGINES[i];
      try {
        const builtUrl = engine.build(targetUrl);
        console.log(`[WebCrawl] Engine ${i + 1}/${ENGINES.length}: ${engine.name}`);

        // Build fetch options - Jina needs specific headers
        const fetchHeaders: HeadersInit =
          engine.name.startsWith('Jina')
            ? { ...JINA_HEADERS, ...(i === 1 ? { 'X-Proxy-Url': 'auto' } : {}) }
            : { Accept: 'text/html,*/*' };

        const res = await fetch(builtUrl, {
          signal: AbortSignal.timeout(20000),
          headers: fetchHeaders,
        });

        const extracted = await engine.extract(res);

        const hasContent =
          extracted.ok &&
          (extracted.markdown.trim().length > 50 || extracted.html.trim().length > 200);

        // Detect Cloudflare challenge page in HTML response
        const isCfChallenge =
          !engine.isMarkdownDirect &&
          (extracted.html.includes('cf-browser-verification') ||
            extracted.html.includes('Cloudflare') && extracted.html.includes('challenge') ||
            extracted.html.includes('jschl_vc') ||
            extracted.html.includes('__cf_chl'));

        if (hasContent && !isCfChallenge) {
          successEngine = engine.name;
          console.log(`[WebCrawl] ✓ Success via ${engine.name}`);

          const loadTime = Date.now() - start;

          // ── Jina path: markdown already built ──────────────────────────
          if (engine.isMarkdownDirect) {
            const md = extracted.markdown;
            return {
              url: targetUrl,
              markdown: md,
              html: '',
              text: md.replace(/[#*`\[\]!>|-]/g, '').replace(/\s+/g, ' ').trim(),
              links: linksFromMarkdown(md, targetUrl),
              images: imagesFromMarkdown(md),
              metadata: metadataFromMarkdown(md, loadTime, targetUrl),
              scrapedAt,
              success: true,
              usedEngine: successEngine,
            };
          }

          // ── HTML proxy path ─────────────────────────────────────────────
          const parser = new DOMParser();
          const doc = parser.parseFromString(extracted.html, 'text/html');
          if (!doc.querySelector('base')) {
            const base = doc.createElement('base');
            base.setAttribute('href', targetUrl);
            doc.head?.appendChild(base);
          }

          return {
            url: targetUrl,
            markdown: htmlToMarkdown(doc, targetUrl),
            html: extracted.html,
            text: (doc.body?.textContent || '').replace(/\s+/g, ' ').trim(),
            links: extractLinks(doc, targetUrl),
            images: extractImages(doc, targetUrl),
            metadata: extractMetadata(doc, loadTime),
            scrapedAt,
            success: true,
            usedEngine: successEngine,
          };
        } else {
          lastError = isCfChallenge
            ? `${engine.name}: Cloudflare challenge returned`
            : `${engine.name}: empty/insufficient response`;
          console.warn(`[WebCrawl] ✗ ${lastError}`);
        }
      } catch (err) {
        lastError = `${engine.name}: ${(err as Error).message}`;
        console.warn(`[WebCrawl] ✗ ${lastError}`);
      }
    }

    throw new Error(`All engines failed. Last: ${lastError}`);
  } catch (error) {
    const loadTime = Date.now() - start;
    const err = error as Error;
    console.error('[WebCrawl] Final error:', err.message);

    return {
      url: targetUrl,
      markdown: '',
      html: '',
      text: '',
      links: [],
      images: [],
      metadata: {
        title: '', description: '', keywords: '', ogTitle: '', ogDescription: '',
        ogImage: '', canonical: '', language: '',
        wordCount: 0, charCount: 0, loadTime,
        statusCode: 0, contentType: '',
        h1Count: 0, h2Count: 0, linkCount: 0, imageCount: 0,
      },
      scrapedAt,
      success: false,
      error: err.message,
    };
  }
}
