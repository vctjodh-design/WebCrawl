export interface ScrapeOptions {
  format: 'markdown' | 'html' | 'text';
  includeLinks: boolean;
  includeImages: boolean;
  includeMetadata: boolean;
  timeout: number;
}

export interface LinkItem {
  text: string;
  href: string;
  type: 'internal' | 'external';
}

export interface ImageItem {
  src: string;
  alt: string;
}

export interface ScrapeMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  language: string;
  wordCount: number;
  charCount: number;
  loadTime: number;
  statusCode: number;
  contentType: string;
  h1Count: number;
  h2Count: number;
  linkCount: number;
  imageCount: number;
}

export interface ScrapeResult {
  url: string;
  markdown: string;
  html: string;
  text: string;
  links: LinkItem[];
  images: ImageItem[];
  metadata: ScrapeMetadata;
  scrapedAt: string;
  success: boolean;
  error?: string;
  usedEngine?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  scrapedAt: string;
  success: boolean;
  wordCount: number;
}
