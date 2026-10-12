import { useState, useEffect } from 'react';

interface LoadingStateProps {
  url: string;
}

const STEPS = [
  { label: 'Resolving DNS & establishing connection', delay: 0 },
  { label: 'Routing through Jina headless browser', delay: 900 },
  { label: 'Executing JavaScript & handling Cloudflare', delay: 1800 },
  { label: 'Bypassing bot protection layers', delay: 2700 },
  { label: 'Extracting & structuring page content', delay: 3600 },
  { label: 'Converting to clean Markdown', delay: 4500 },
];

const StepItem = ({ label, delay, index }: { label: string; delay: number; index: number }) => {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(true), delay);
    const t2 = setTimeout(() => { setDone(true); setActive(false); }, delay + 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  return (
    <div className={`flex items-center gap-3 text-xs font-mono transition-opacity duration-300 ${
      active || done ? 'opacity-100' : 'opacity-30'
    }`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? 'bg-primary/20 border border-primary' :
        active ? 'bg-secondary border border-primary animate-pulse' :
        'bg-secondary border border-border/40'
      }`}>
        {done && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
        {active && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
      </div>
      <span className={done ? 'text-primary' : active ? 'text-foreground' : 'text-muted-foreground'}>
        {done ? '✓ ' : active ? '→ ' : `${index + 1}. `}{label}
      </span>
    </div>
  );
};

const LoadingState = ({ url }: LoadingStateProps) => {
  return (
    <div className="mt-6 rounded-xl border border-border/60 bg-card overflow-hidden animate-fade-in">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/30">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-primary/60" />
        <span className="ml-2 text-xs text-muted-foreground font-mono">webcrawl — scraping</span>
      </div>

      <div className="p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">Crawling target URL</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="text-xs text-primary font-mono">LIVE</span>
            </div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full progress-indeterminate w-1/3" />
          </div>
        </div>

        {/* URL being scraped */}
        <div className="mb-6 p-3 rounded-lg bg-secondary/40 border border-border/40">
          <p className="text-xs text-muted-foreground mb-1">Target URL</p>
          <p className="text-sm font-mono text-primary truncate">{url}</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <StepItem key={step.label} label={step.label} delay={step.delay} index={i} />
          ))}
        </div>

        {/* Log output */}
        <div className="mt-6 p-3 rounded-lg bg-background/60 border border-border/30 font-mono text-xs text-muted-foreground space-y-1">
          <div className="text-primary/70">$ webcrawl --url "{url}"</div>
          <div className="text-muted-foreground/60">Engine 1: Jina Reader (real headless browser + Cloudflare bypass)...</div>
          <div className="text-muted-foreground/60">Fallback chain: CORS proxies if Jina unavailable<span className="cursor-blink" /></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
