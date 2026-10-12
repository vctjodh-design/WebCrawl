import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';

import Header from '@/components/layout/Header';
import HeroSection from '@/components/features/HeroSection';
import UrlInput from '@/components/features/UrlInput';
import LoadingState from '@/components/features/LoadingState';
import ResultsPanel from '@/components/features/ResultsPanel';
import HistorySidebar from '@/components/features/HistorySidebar';

import { scrapeUrl } from '@/lib/scraper';
import { getHistory, addToHistory, clearHistory, removeFromHistory } from '@/lib/history';
import type { ScrapeResult, ScrapeOptions, HistoryItem } from '@/types';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => getHistory());
  const [showSidebar, setShowSidebar] = useState(true);
  const [hasScraped, setHasScraped] = useState(false);

  const handleScrape = useCallback(async (url: string, options: ScrapeOptions) => {
    setIsLoading(true);
    setCurrentUrl(url);
    setResult(null);
    setHasScraped(true);

    console.log('[Index] Starting scrape for:', url);

    const scrapeResult = await scrapeUrl(url);
    setResult(scrapeResult);
    setIsLoading(false);

    if (scrapeResult.success) {
      toast.success(`Scraped successfully — ${scrapeResult.metadata.wordCount.toLocaleString()} words extracted`);
    } else {
      toast.error(`Scrape failed: ${scrapeResult.error || 'Unknown error'}`);
    }

    // Add to history
    const histItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      title: scrapeResult.metadata.title || url,
      scrapedAt: scrapeResult.scrapedAt,
      success: scrapeResult.success,
      wordCount: scrapeResult.metadata.wordCount,
    };
    addToHistory(histItem);
    setHistory(getHistory());
  }, []);

  const handleHistorySelect = (url: string) => {
    handleScrape(url, {
      format: 'markdown',
      includeLinks: true,
      includeImages: true,
      includeMetadata: true,
      timeout: 30,
    });
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success('History cleared');
  };

  const handleRemoveHistory = (id: string) => {
    removeFromHistory(id);
    setHistory(getHistory());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Hero - only show before first scrape */}
            {!hasScraped && (
              <HeroSection onExampleClick={url => handleScrape(url, {
                format: 'markdown',
                includeLinks: true,
                includeImages: true,
                includeMetadata: true,
                timeout: 30,
              })} />
            )}

            {/* URL Input */}
            <UrlInput
              onScrape={handleScrape}
              isLoading={isLoading}
              defaultUrl={hasScraped ? currentUrl : ''}
            />

            {/* Loading state */}
            {isLoading && <LoadingState url={currentUrl} />}

            {/* Results */}
            {!isLoading && result && <ResultsPanel result={result} />}

            {/* Empty state after first view */}
            {!isLoading && !result && hasScraped && (
              <div className="mt-8 text-center text-muted-foreground text-sm">
                Enter a URL above to start scraping
              </div>
            )}
          </div>
        </main>

        {/* History sidebar */}
        <aside
          className={`flex-shrink-0 border-l border-border/40 bg-card/50 transition-all duration-300 overflow-hidden ${
            showSidebar ? 'w-72' : 'w-0'
          } hidden lg:block`}
        >
          <div className="w-72 h-full">
            <HistorySidebar
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleClearHistory}
              onRemove={handleRemoveHistory}
              currentUrl={currentUrl}
            />
          </div>
        </aside>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="hidden lg:flex fixed right-4 bottom-4 w-10 h-10 items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border shadow-lg transition-colors"
          title={showSidebar ? 'Hide history' : 'Show history'}
        >
          {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Index;
