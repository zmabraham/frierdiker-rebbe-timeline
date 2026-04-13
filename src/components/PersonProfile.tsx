import { motion } from 'framer-motion';
import { Calendar, BookOpen, Crown, ChevronLeft, Library, Quote } from 'lucide-react';

interface PersonProfileProps {
  person: any;
  events: any[];
  onBack?: () => void;
  onReadInBook?: (entity: any) => void;
}

export default function PersonProfile({ person, events, onBack, onReadInBook }: PersonProfileProps) {
  const name = (person as any).name || person.extracted_data?.name || person.passage || 'Unknown';

  const personEvents = events.filter((e: any) => {
    const passage = (e.passage || '').toLowerCase();
    const desc = (e.extracted_data?.event || e.extracted_data?.description || '').toLowerCase();
    const nameParts = name.toLowerCase().split(' ');
    return nameParts.some((part: string) => part.length > 2 && (passage.includes(part) || desc.includes(part)));
  }).sort((a: any, b: any) => (a.year || 0) - (b.year || 0));

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
          <span>Back to Directory</span>
        </motion.button>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Person Profile Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-parchment-100/90 backdrop-blur-sm border border-gold-400/40 rounded-lg overflow-hidden shadow-ornate mb-8 text-center relative"
        >
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-400/50 via-gold-400 to-gold-400/50" />

          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold-400/30" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold-400/30" />

          <div className="p-10">
            {/* Avatar */}
            <div className="w-28 h-28 bg-gradient-to-br from-gold-300 to-gold-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-gold-glow border-4 border-gold-400/30">
              <Crown className="w-14 h-14 text-ink-200" />
            </div>

            <h1 className="font-display text-4xl font-semibold mb-2 text-ink-200">{name}</h1>

            {person.extracted_data?.title && (
              <p className="font-subheading text-lg text-gold-700 mb-2">{person.extracted_data.title}</p>
            )}

            {person.extracted_data?.role && (
              <p className="font-body text-parchment-700 mb-4 italic">{person.extracted_data.role}</p>
            )}

            {person.extracted_data?.years && (
              <div className="flex items-center justify-center gap-2 text-sm font-subheading text-parchment-400">
                <Calendar className="w-4 h-4 text-gold-600" />
                <span>{person.extracted_data.years}</span>
              </div>
            )}

            {/* Read in Book button */}
            {person.passage && onReadInBook && (
              <div className="mt-6 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onReadInBook(person)}
                  className="flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 rounded-full font-subheading text-sm text-gold-600 hover:bg-gold-500/30 hover:text-gold-700 transition-all"
                >
                  <Library className="w-4 h-4" />
                  <span>Read in Book</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Book References */}
        {(person.bookReferences || personEvents.length > 0) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-2xl font-semibold mb-6 flex items-center justify-center gap-3 text-gold-300">
              <BookOpen className="w-7 h-7" />
              References in the Book
            </h2>
            <div className="space-y-3">
              {/* Direct book references */}
              {person.bookReferences && person.bookReferences.length > 0 && person.bookReferences.map((ref: any, index: number) => (
                <motion.button
                  key={`ref-${index}`}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onReadInBook?.({ ...person, book_link: ref.book_link, chapter: ref.chapter, paragraph: ref.paragraph })}
                  className="w-full text-left bg-parchment-100/80 border border-gold-400/40 rounded-lg p-4 hover:border-gold-500 hover:shadow-gold-glow transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Quote className="w-4 h-4 text-gold-600" />
                        <span className="font-subheading text-xs text-gold-700">
                          Chapter {ref.chapter || '?'}{ref.paragraph !== undefined ? `, Paragraph ${ref.paragraph + 1}` : ''}
                        </span>
                      </div>
                      <p className="font-body text-sm text-ink-100 line-clamp-2">
                        {person.passage?.substring(0, 150) || 'Reference in book'}
                      </p>
                    </div>
                    <Library className="w-5 h-5 text-gold-600 group-hover:text-gold-500 transition-colors shrink-0" />
                  </div>
                </motion.button>
              ))}
              {/* Event references */}
              {personEvents.slice(0, 8).map((evt: any, index: number) => (
                <motion.button
                  key={`evt-${index}`}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (person.bookReferences?.length || 0) * 0.03 + index * 0.03 }}
                  onClick={() => onReadInBook?.(evt)}
                  className="w-full text-left bg-parchment-100/80 border border-gold-400/40 rounded-lg p-4 hover:border-gold-500 hover:shadow-gold-glow transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {evt.year && (
                        <div className="inline-block px-2 py-0.5 rounded text-xs font-subheading text-gold-700 border border-gold-400/30 mb-2">
                          {evt.year}
                        </div>
                      )}
                      <h3 className="font-display font-semibold text-ink-200 mb-1">
                        {evt.extracted_data?.event || evt.extracted_data?.description || 'Event'}
                      </h3>
                      <p className="font-body text-sm text-ink-100 line-clamp-2">
                        {evt.passage?.substring(0, 150)}...
                      </p>
                    </div>
                    <Library className="w-5 h-5 text-gold-600 group-hover:text-gold-500 transition-colors shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Additional Details */}
        {Object.entries(person.extracted_data || {}).length > 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-parchment-100/70 backdrop-blur-sm border border-gold-400/30 rounded-lg p-6"
          >
            <h3 className="font-display text-xl font-semibold mb-6 text-gold-700">Biographical Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(person.extracted_data)
                .filter(([key]) => !['name', 'title', 'role', 'years'].includes(key))
                .slice(0, 6)
                .map(([key, value]: [string, any]) => (
                  <div key={key} className="border-b border-gold-400/10 pb-3 last:border-0">
                    <dt className="font-subheading text-xs text-parchment-700 uppercase tracking-wide">{key}</dt>
                    <dd className="font-body text-ink-200 mt-1">{String(value ?? '')}</dd>
                  </div>
                ))}
            </dl>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
