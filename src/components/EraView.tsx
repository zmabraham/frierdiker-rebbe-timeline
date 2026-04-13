import { motion } from 'framer-motion';
import { User, Calendar, BookOpen, Quote, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Era {
  id: string;
  name: string;
  years: string;
  description: string;
  color: string;
}

interface EraViewProps {
  era: Era;
  events: any[];
  onSelectEvent: (event: any) => void;
  onSelectPerson: (person: any) => void;
}

export default function EraView({ era, events, onSelectEvent, onSelectPerson }: EraViewProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const displayedEvents = showAllEvents ? events : events.slice(0, 18);

  const getEraPeople = () => {
    const mentioned = new Set<string>();
    events.forEach((evt: any) => {
      const passage = evt.passage || '';
      const matches = passage.match(/(Rabbi [A-Z][a-z]+|Rebbe|The [A-Z][a-z]+)/g);
      matches?.forEach((m: string) => mentioned.add(m));
    });
    return Array.from(mentioned).slice(0, 12);
  };

  const eraPeople = getEraPeople();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative"
    >
      {/* Aged paper texture overlay */}
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Era Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
            <BookOpen className="w-5 h-5 text-gold-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
          </div>

          <div
            className="inline-block px-6 py-2 rounded-full text-sm font-subheading tracking-wider mb-6 border border-gold-400/40"
            style={{
              backgroundColor: `${era.color}15`,
              color: era.color
            }}
          >
            {era.years}
          </div>
          <h2 className="font-display text-5xl font-semibold mb-4 text-gold-200">{era.name}</h2>
          <p className="font-body text-parchment-400 text-xl max-w-2xl mx-auto italic leading-relaxed">
            {era.description}
          </p>
        </motion.div>

        {/* Key Events Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h3 className="font-display text-2xl font-semibold flex items-center gap-3 text-gold-300">
              <Calendar className="w-6 h-6" />
              <span>Chronicles of the Era</span>
            </h3>
            <span className="font-subheading text-sm text-parchment-300">({events.length} events)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map((event: any, index: number) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ scale: 1.02, y: -3 }}
                onClick={() => onSelectEvent(event)}
                className="relative bg-parchment-100/90 backdrop-blur-sm border border-gold-400/30 rounded-lg overflow-hidden cursor-pointer shadow-card group"
              >
                {/* Decorative corner */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-400/40" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-400/40" />

                <div className="p-5">
                  {event.year && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-subheading tracking-wide mb-3 border border-gold-400/30"
                      style={{
                        backgroundColor: `${era.color}15`,
                        color: era.color
                      }}
                    >
                      {event.year}
                    </div>
                  )}
                  {event.date && !event.year && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-subheading tracking-wide mb-3 border border-gold-400/30 bg-gold-400/20 text-gold-600">
                      {event.date}
                    </div>
                  )}
                  <h4 className="font-display font-semibold mb-3 line-clamp-2 text-ink-200 leading-snug">
                    {(event as any).name || event.extracted_data?.title || event.extracted_data?.event || event.extracted_data?.description || 'Event'}
                  </h4>
                  <p className="font-body text-sm text-ink-100 line-clamp-3 leading-relaxed">
                    {event.passage?.substring(0, 150)}...
                  </p>
                </div>

                {/* Hover reveal hint */}
                <div className="absolute bottom-3 right-3 text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Quote className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {events.length > 18 && (
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="flex items-center gap-2 px-6 py-3 bg-parchment-100/90 border border-gold-400/40 rounded-full text-sm font-subheading text-ink-200 hover:border-gold-400 transition-all shadow-sm"
              >
                <span>{showAllEvents ? `Show Less (18)` : `Show All (${events.length})`}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllEvents ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
          )}
        </div>

        {/* People Section */}
        {eraPeople.length > 0 && (
          <div>
            <h3 className="font-display text-2xl font-semibold mb-8 flex items-center justify-center gap-3 text-gold-300">
              <User className="w-6 h-6" />
              <span>Souls of This Era</span>
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {eraPeople.map((person: string, index: number) => (
                <motion.button
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onSelectPerson({ extracted_data: { name: person }, passage: '' })}
                  className="px-5 py-2.5 bg-parchment-100/80 border border-gold-400/40 rounded-full text-sm font-subheading text-ink-200 hover:border-gold-400 hover:bg-parchment-200 transition-all shadow-sm"
                >
                  {person}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
