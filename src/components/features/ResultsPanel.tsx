import { useState } from 'react';
import { Copy, Check, ExternalLink, FileText, Link2, Image, Info, Clock, Hash, Globe, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { ScrapeResult } from '@/types';

interface ResultsPanelProps {
  result: ScrapeResult;
}

type TabId = 'markdown' | 'links' | 'images' | 'metadata' | 'raw';

const ResultsPanel = ({ result }: ResultsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('markdown');
  const [copied, setCopied] = useState(false);

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'markdown', label: 'Markdown', icon: FileText },
    { id: 'links', label: 'Links', icon: Link2, count: result.links.length },
    { id: 'images', label: 'Images', icon: Image, count: result.images.length },
    { id: 'metadata', label: 'Metadata', icon: Info },
    { id: 'raw', label: 'HTML', icon: Hash },
  ];

  const getContent = (): string => {
    switch (activeTab) {
      case 'markdown': return result.markdown;
      case 'links': return result.links.map(l => `${l.type === 'internal' ? '[INT]' : '[EXT]'} ${l.text} → ${l.href}`).join('\n');
      case 'images': return result.images.map(i => `![${i.alt}](${i.src})`).join('\n');
      case 'metadata': return JSON.stringify(result.metadata, null, 2);
      case 'raw': return result.html.substring(0, 50000);
      default: return '';
    }
  };

  const handleCopy = async () => {
    const content = getContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div className="mt-6 rounded-xl border border-border/60 bg-card overflow-hidden animate-fade-in">
      {/* Result header */}
      <div className="px-4 py-3 border-b border-border/40 bg-secondary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${result.success ? 'bg-primary' : 'bg-destructive'}`} />
              <span className={`text-xs font-medium ${result.success ? 'text-primary' : 'text-destructive'}`}>
                {result.success ? 'Success' : 'Error'}
              </span>
              <span className="text-xs text-muted-foreground">
                {result.metadata.loadTime}ms
              </span>
              {result.usedEngine && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  via {result.usedEngine}
                </span>
              )}
            </div>
            <h2 className="text-sm font-medium text-foreground truncate">
              {result.metadata.title || result.url}
            </h2>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary font-mono flex items-center gap-1 mt-0.5 truncate"
            >
              {result.url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex gap-3 text-xs text-muted-foreground flex-shrink-0">
            <div className="text-center">
              <p className="font-bold text-foreground text-sm">{result.metadata.wordCount.toLocaleString()}</p>
              <p>words</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-sm">{result.links.length}</p>
              <p>links</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-sm">{result.images.length}</p>
              <p>images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/40 bg-card overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <div className="ml-auto pl-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[500px] overflow-auto">
        {activeTab === 'markdown' && (
          <MarkdownView content={result.markdown} />
        )}
        {activeTab === 'links' && (
          <LinksView links={result.links} />
        )}
        {activeTab === 'images' && (
          <ImagesView images={result.images} />
        )}
        {activeTab === 'metadata' && (
          <MetadataView metadata={result.metadata} url={result.url} scrapedAt={result.scrapedAt} />
        )}
        {activeTab === 'raw' && (
          <pre className="p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
            {result.html.substring(0, 50000)}
            {result.html.length > 50000 && (
              <span className="text-primary">{'\n\n'}... truncated ({result.html.length.toLocaleString()} total chars)</span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
};

const MarkdownView = ({ content }: { content: string }) => {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No markdown content extracted
      </div>
    );
  }
  return (
    <pre className="p-4 text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
      {content}
    </pre>
  );
};

const LinksView = ({ links }: { links: ScrapeResult['links'] }) => {
  const [filter, setFilter] = useState<'all' | 'internal' | 'external'>('all');
  const filtered = filter === 'all' ? links : links.filter(l => l.type === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 flex-shrink-0">
        {(['all', 'internal', 'external'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f} ({f === 'all' ? links.length : links.filter(l => l.type === f).length})
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No links found</div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((link, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-secondary/30 group transition-colors">
                <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
                  link.type === 'internal'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary text-muted-foreground border border-border/40'
                }`}>
                  {link.type === 'internal' ? 'INT' : 'EXT'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{link.text}</p>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary font-mono truncate block"
                  >
                    {link.href}
                  </a>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ImagesView = ({ images }: { images: ScrapeResult['images'] }) => {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No images found
      </div>
    );
  }
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((img, i) => (
        <div key={i} className="group rounded-lg overflow-hidden border border-border/40 hover:border-primary/40 transition-colors">
          <div className="aspect-video bg-secondary/40 overflow-hidden">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="p-2">
            <p className="text-xs text-muted-foreground truncate">{img.alt || 'No alt text'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const MetadataView = ({
  metadata,
  url,
  scrapedAt,
}: {
  metadata: ScrapeResult['metadata'];
  url: string;
  scrapedAt: string;
}) => {
  const rows: { label: string; value: string | number; icon?: React.ElementType }[] = [
    { label: 'Title', value: metadata.title || '—', icon: FileText },
    { label: 'Description', value: metadata.description || '—', icon: Info },
    { label: 'Keywords', value: metadata.keywords || '—' },
    { label: 'OG Title', value: metadata.ogTitle || '—' },
    { label: 'OG Description', value: metadata.ogDescription || '—' },
    { label: 'Canonical URL', value: metadata.canonical || url },
    { label: 'Language', value: metadata.language || '—', icon: Globe },
    { label: 'Load Time', value: `${metadata.loadTime}ms`, icon: Clock },
    { label: 'Word Count', value: metadata.wordCount.toLocaleString() },
    { label: 'Char Count', value: metadata.charCount.toLocaleString() },
    { label: 'H1 Tags', value: metadata.h1Count },
    { label: 'H2 Tags', value: metadata.h2Count },
    { label: 'Links Found', value: metadata.linkCount },
    { label: 'Images Found', value: metadata.imageCount },
    { label: 'Scraped At', value: new Date(scrapedAt).toLocaleString() },
  ];

  return (
    <div className="p-4 space-y-2">
      {rows.map(row => (
        <div key={row.label} className="flex gap-4 py-2 border-b border-border/20 last:border-0">
          <span className="text-xs text-muted-foreground w-32 flex-shrink-0 font-medium">{row.label}</span>
          <span className="text-xs text-foreground font-mono flex-1 break-all">{String(row.value)}</span>
        </div>
      ))}

      {metadata.ogImage && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">OG Image Preview</p>
          <img
            src={metadata.ogImage}
            alt="OG Image"
            className="max-h-48 rounded-lg border border-border/40 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
