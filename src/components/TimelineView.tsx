import { motion } from 'framer-motion';
import { ChevronRight, Crown } from 'lucide-react';

interface Era {
  id: string;
  name: string;
  years: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}

interface Event {
  year: number | null;
  extracted_data: { description?: string; event?: string };
}

interface TimelineViewProps {
  eras: Era[];
  events: Event[];
  onSelectEra: (era: Era) => void;
}

export default function TimelineView({ eras, events, onSelectEra }: TimelineViewProps) {

  // Count events per era - include events without years (they appear in all eras for now)
  const getEventCount = (era: Era) => {
    const eventsWithYears = events.filter(e => e.year && e.year >= era.startYear && e.year <= era.endYear).length;
    const eventsWithoutYears = events.filter(e => !e.year).length;
    return eventsWithYears + eventsWithoutYears;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center px-8 bg-ink-500 relative overflow-hidden"
    >
      {/* Aged paper texture overlay */}
      <div className="absolute inset-0 bg-aged-paper opacity-40 pointer-events-none" />

      {/* Decorative corner flourishes */}
      <div className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-gold-400/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-32 h-32 border-r-2 border-t-2 border-gold-400/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-32 h-32 border-l-2 border-b-2 border-gold-400/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-gold-400/30 pointer-events-none" />

      {/* Hero Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold-400" />
          <Crown className="w-6 h-6 text-gold-400" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="text-6xl font-display font-semibold mb-4 text-gold-200 tracking-wide">
          The Living Timeline
        </h2>
        <p className="font-body text-parchment-400 text-xl max-w-3xl mx-auto leading-relaxed italic">
          "Undaunted" — A Journey Through the Eras of Chabad Lubavitch
        </p>
        <div className="mt-6 font-subheading text-parchment-300 text-base max-w-2xl mx-auto">
          Explore four defining chapters of leadership, sacrifice, and renewal.
          Click upon any era to discover the souls and stories that shaped history.
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative w-full max-w-7xl">
        {/* Ornate Timeline Base Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent rounded-full transform -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-gold-300/40 transform -translate-y-1/2" />

        {/* Era Cards */}
        <div className="flex justify-between items-center relative gap-4">
          {eras.map((era, index) => {
            const eventCount = getEventCount(era);

            return (
              <motion.div
                key={era.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.12, duration: 0.6 }}
                className="relative group flex-1 max-w-[220px]"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => onSelectEra(era)}
                >
                  <motion.div
                    whileHover={{ scale: 1.03, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-parchment-100/95 backdrop-blur-sm border border-gold-400/40 rounded-lg overflow-hidden shadow-ornate"
                    style={{
                      borderWidth: '1.5px'
                    }}
                  >
                    {/* Inner parchment texture */}
                    <div className="absolute inset-0 bg-parchment opacity-60" />
                    <div className="absolute inset-0 bg-aged-paper opacity-50" />

                    {/* Decorative header bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: era.color }}
                    />

                    {/* Era Indicator */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div
                        className="w-8 h-8 rounded-full border-3 border-parchment-200 shadow-lg flex items-center justify-center bg-parchment-100"
                        style={{ borderColor: era.color }}
                      >
                        <div
                          className="w-3 h-3 rounded-full animate-pulse"
                          style={{ backgroundColor: era.color }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-5">
                      <h3 className="font-display text-xl font-semibold mb-2 text-ink-200 leading-tight">
                        {era.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-gold-400/30" />
                        <span className="font-subheading text-sm text-gold-700 tracking-wider uppercase">
                          {era.years}
                        </span>
                        <div className="h-px flex-1 bg-gold-400/30" />
                      </div>
                      <p className="font-body text-ink-100 text-sm leading-relaxed mb-4 line-clamp-3">
                        {era.description}
                      </p>

                      {/* Event Count - Elegant counter */}
                      <div className="flex items-center justify-between mb-3 pt-3 border-t border-gold-300/20">
                        <span className="font-subheading text-xs text-parchment-700 italic">
                          {eventCount} chronicles
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(Math.min(5, Math.ceil(eventCount / 10)))].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: era.color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Click hint */}
                      <div className="flex items-center justify-between text-xs text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-subheading">
                        <span className="italic">Explore era</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Decorative corner accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-gold-400/50" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-gold-400/50" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-gold-400/50" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-gold-400/50" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 font-subheading text-parchment-300 text-sm tracking-wide relative z-10"
      >
        <span className="text-gold-500">✦</span> Select an era to begin your journey
        <span className="text-gold-500"> ✦</span> Use search to find specific souls or events
        <span className="text-gold-500"> ✦</span>
      </motion.p>
    </motion.div>
  );
}
