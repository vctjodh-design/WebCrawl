import heroBg from '@/assets/hero-bg.jpg';

interface HeroSectionProps {
  onExampleClick: (url: string) => void;
}

const HeroSection = ({ onExampleClick }: HeroSectionProps) => {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-8">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative px-6 py-12 sm:py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Powered by real browser rendering
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
          Turn any website into{' '}
          <span className="text-primary text-glow">clean data</span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Extract markdown, links, images, and metadata from any URL.
          Routes through browser emulation to bypass 403 errors and anti-bot systems.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {['Bypasses CORS', 'Real browser headers', 'Markdown output', 'Metadata extraction', 'Link analysis'].map(feat => (
            <span
              key={feat}
              className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/60 text-muted-foreground border border-border/40"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
