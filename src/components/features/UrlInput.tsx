import { useState, useRef, useEffect } from 'react';
import { Globe, Zap, ChevronDown, Settings } from 'lucide-react';
import type { ScrapeOptions } from '@/types';

interface UrlInputProps {
  onScrape: (url: string, options: ScrapeOptions) => void;
  isLoading: boolean;
  defaultUrl?: string;
}

const DEFAULT_OPTIONS: ScrapeOptions = {
  format: 'markdown',
  includeLinks: true,
  includeImages: true,
  includeMetadata: true,
  timeout: 30,
};

const EXAMPLE_URLS = [
  'https://www.fastscore.com/',
  'https://news.ycombinator.com/',
  'https://github.com/trending',
  'https://en.wikipedia.org/wiki/Web_scraping',
];

const UrlInput = ({ onScrape, isLoading, defaultUrl }: UrlInputProps) => {
  const [url, setUrl] = useState(defaultUrl || '');
  const [options, setOptions] = useState<ScrapeOptions>(DEFAULT_OPTIONS);
  const [showOptions, setShowOptions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultUrl) setUrl(defaultUrl);
  }, [defaultUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onScrape(url.trim(), options);
  };

  const handleExampleClick = (exUrl: string) => {
    setUrl(exUrl);
    setTimeout(() => onScrape(exUrl, options), 50);
  };

  return (
    <div className="w-full">
      {/* Main input form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center rounded-xl border transition-all duration-200 ${
            focused
              ? 'border-primary glow-border bg-card'
              : 'border-border/60 bg-card hover:border-border'
          }`}
        >
          <div className="pl-4 pr-2 flex-shrink-0">
            <Globe className={`w-4 h-4 transition-colors ${focused ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="https://www.fastscore.com/"
            className="flex-1 bg-transparent py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none"
            disabled={isLoading}
            autoComplete="url"
          />

          <div className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Options"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="hidden sm:inline">Crawling...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scrape</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options panel */}
        {showOptions && (
          <div className="mt-2 p-4 rounded-xl border border-border/60 bg-card animate-fade-in">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Scrape Options
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeLinks}
                  onChange={e => setOptions(o => ({ ...o, includeLinks: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Links</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={e => setOptions(o => ({ ...o, includeImages: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Images</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={e => setOptions(o => ({ ...o, includeMetadata: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Metadata</span>
              </label>
              <div className="flex items-center gap-2">
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                <select
                  value={options.format}
                  onChange={e => setOptions(o => ({ ...o, format: e.target.value as ScrapeOptions['format'] }))}
                  className="bg-secondary text-xs text-foreground rounded px-2 py-1 border border-border/60 outline-none"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Example URLs */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground/60">Try:</span>
        {EXAMPLE_URLS.map(exUrl => (
          <button
            key={exUrl}
            onClick={() => handleExampleClick(exUrl)}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors disabled:opacity-40 truncate max-w-[160px]"
          >
            {exUrl.replace('https://', '')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UrlInput;
