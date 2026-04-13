import { motion } from 'framer-motion';
import { MapPin, Calendar, User, ArrowRight, BookOpen, Quote, ChevronLeft, Library } from 'lucide-react';

interface EventDetailProps {
  event: any;
  places: any[];
  onSelectPerson: (person: any) => void;
  onBack?: () => void;
  onReadInBook?: (entity: any) => void;
}

export default function EventDetail({ event, onSelectPerson, onBack, onReadInBook }: EventDetailProps) {
  const extractPeople = () => {
    const passage = event.passage || '';
    const matches = passage.match(/(Rabbi [A-Z][a-z]+|Rebbe|The [A-Z][a-z]+)/g);
    return matches ? [...new Set(matches)] : [];
  };

  const mentionedPeople = extractPeople();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative"
    >
      {/* Aged paper texture overlay */}
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      {/* Back button at top */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onBack}
          className="relative z-20 mb-6 flex items-center gap-2 px-4 py-2 font-subheading text-sm text-gold-300 hover:text-gold-200 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Era</span>
        </motion.button>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Event Header Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-parchment-100/90 backdrop-blur-sm border border-gold-400/40 rounded-lg overflow-hidden shadow-ornate mb-8"
        >
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-400/50 via-gold-400 to-gold-400/50" />

          <div className="p-8">
            {event.year && (
              <div className="flex items-center gap-2 text-gold-700 mb-4 font-subheading tracking-wide">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">{event.year}</span>
              </div>
            )}
            <h2 className="font-display text-4xl font-semibold mb-4 text-ink-200 leading-tight">
              {event.extracted_data?.event || event.extracted_data?.description || 'Historical Chronicle'}
            </h2>
            {event.extracted_data?.location && (
              <div className="flex items-center gap-2 text-parchment-700 font-subheading">
                <MapPin className="w-4 h-4 text-gold-600" />
                <span>{event.extracted_data.location}</span>
              </div>
            )}
          </div>

          {/* Decorative corner accents */}
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold-400/30" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold-400/30" />
        </motion.div>

        {/* Passage Quote */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-parchment-100/70 backdrop-blur-sm border-l-4 border-gold-400/50 rounded-r-lg p-8 mb-8 relative"
        >
          <Quote className="absolute top-4 left-4 w-8 h-8 text-gold-400/50" />
          <p className="font-body text-xl leading-relaxed text-ink-100 italic pl-8">
            {event.passage}
          </p>
          {onReadInBook && (
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReadInBook(event)}
                className="flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 rounded-full font-subheading text-sm text-gold-600 hover:bg-gold-500/30 hover:text-gold-700 transition-all"
              >
                <Library className="w-4 h-4" />
                <span>Read in Book</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* People Mentioned */}
        {mentionedPeople.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-parchment-100/70 backdrop-blur-sm border border-gold-400/30 rounded-lg p-6 mb-8"
          >
            <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-3 text-gold-700">
              <User className="w-6 h-6" />
              Souls Mentioned
            </h3>
            <div className="flex flex-wrap gap-3">
              {mentionedPeople.map((person, index: number) => (
                <button
                  key={index}
                  onClick={() => onSelectPerson({ extracted_data: { name: person as string }, passage: '' })}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-parchment-200/50 border border-gold-400/40 rounded-full hover:border-gold-500 hover:bg-parchment-300 transition-all font-subheading text-ink-200"
                >
                  <span>{person as string}</span>
                  <ArrowRight className="w-4 h-4 text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Additional Details */}
        {Object.entries(event.extracted_data || {}).length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-3 text-gold-700">
              <BookOpen className="w-6 h-6" />
              Archive Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(event.extracted_data)
                .filter(([key]) => !['event', 'description', 'location', 'date', 'year'].includes(key))
                .slice(0, 6)
                .map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-parchment-100/50 border border-gold-400/20 rounded-lg p-4">
                    <div className="font-subheading text-xs text-parchment-700 uppercase tracking-wide mb-1">{key}</div>
                    <div className="font-body text-ink-200">{String(value ?? '')}</div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
