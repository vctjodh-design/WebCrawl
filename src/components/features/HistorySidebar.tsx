import { Clock, Trash2, ExternalLink, X } from 'lucide-react';
import type { HistoryItem } from '@/types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (url: string) => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  currentUrl?: string;
}

const HistorySidebar = ({ history, onSelect, onClear, onRemove, currentUrl }: HistorySidebarProps) => {
  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No scrape history yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Your scraped URLs will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">History</span>
          <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            {history.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {history.map(item => (
          <div
            key={item.id}
            className={`group flex items-start gap-3 px-3 py-3 border-b border-border/20 hover:bg-secondary/30 cursor-pointer transition-colors ${
              currentUrl === item.url ? 'bg-primary/5 border-l-2 border-l-primary' : ''
            }`}
            onClick={() => onSelect(item.url)}
          >
            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${item.success ? 'bg-primary' : 'bg-destructive'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.title || item.url}</p>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.url}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground/60">
                  {new Date(item.scrapedAt).toLocaleTimeString()}
                </span>
                {item.wordCount > 0 && (
                  <span className="text-xs text-muted-foreground/60">
                    {item.wordCount.toLocaleString()} words
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySidebar;
