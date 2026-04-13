import { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Crown, ChevronLeft, Filter } from 'lucide-react';

interface QuotesViewProps {
  quotes: any[];
}

export default function QuotesView({ quotes }: QuotesViewProps) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Get unique speakers
  const speakers = Array.from(new Set(
    quotes.map(q => q.extracted_data?.speaker || 'Unknown')
  )).sort();

  const filteredQuotes = filter === 'all'
    ? quotes
    : quotes.filter(q => q.extracted_data?.speaker === filter);

  if (selectedQuote) {
    return (
      <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative">
        <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setSelectedQuote(null)}
            className="mb-6 flex items-center gap-2 px-4 py-2 font-subheading text-sm text-gold-300 hover:text-gold-200 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Quotes</span>
          </motion.button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-parchment-100/95 border border-gold-400/50 rounded-lg p-8 shadow-ornate relative"
          >
            <div className="h-1 w-full bg-gradient-to-r from-gold-400/50 via-gold-400 to-gold-400/50 mb-6" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <span className="px-3 py-1 text-xs font-subheading uppercase tracking-wide rounded-full bg-gold-400/20 text-gold-700">
                  Quote
                </span>
                <p className="font-subheading text-sm text-parchment-700 mt-1">
                  {selectedQuote.extracted_data?.speaker || 'Unknown'}
                </p>
              </div>
            </div>

            <blockquote className="font-body text-2xl leading-relaxed text-ink-100 mb-8 italic border-l-4 border-gold-400 pl-6">
              "{selectedQuote.extracted_data?.quote || selectedQuote.passage}"
            </blockquote>

            {selectedQuote.extracted_data?.context && (
              <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4 mb-6">
                <p className="font-subheading text-xs text-gold-700 uppercase mb-1">Context</p>
                <p className="font-body text-sm text-ink-200">{selectedQuote.extracted_data.context}</p>
              </div>
            )}

            {selectedQuote.extracted_data?.source_chapter && (
              <div className="text-right">
                <span className="font-subheading text-xs text-parchment-400">
                  Chapter {selectedQuote.extracted_data.source_chapter}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative">
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
            <Crown className="w-6 h-6 text-gold-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
          </div>
          <h2 className="font-display text-5xl text-gold-200 mb-4">Quotes from the Rebbes</h2>
          <p className="font-body text-parchment-400 text-lg max-w-2xl mx-auto italic">
            Wisdom and insights from the leaders of Chabad
          </p>
        </motion.div>

        {/* Filter */}
        {speakers.length > 1 && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-gold-500" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-subheading transition-all ${
                  filter === 'all'
                    ? 'bg-gold-500 text-ink-200'
                    : 'bg-gold-400/20 text-gold-700 hover:bg-gold-400/30'
                }`}
              >
                All ({quotes.length})
              </button>
              {speakers.slice(0, 6).map(speaker => (
                <button
                  key={speaker}
                  onClick={() => setFilter(speaker)}
                  className={`px-4 py-2 rounded-full text-sm font-subheading transition-all ${
                    filter === speaker
                      ? 'bg-gold-500 text-ink-200'
                      : 'bg-gold-400/20 text-gold-700 hover:bg-gold-400/30'
                  }`}
                >
                  {speaker}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredQuotes.map((quote, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedQuote(quote)}
              className="bg-parchment-100/80 backdrop-blur-sm border border-gold-400/40 rounded-lg p-6 cursor-pointer hover:border-gold-400/70 transition-all shadow-card group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center shrink-0">
                  <Quote className="w-4 h-4 text-gold-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-subheading text-xs text-gold-700 uppercase">
                    {quote.extracted_data?.speaker || 'Unknown'}
                  </p>
                  {quote.extracted_data?.source_chapter && (
                    <p className="font-body text-xs text-parchment-400">
                      Chapter {quote.extracted_data.source_chapter}
                    </p>
                  )}
                </div>
              </div>

              <blockquote className="font-body text-base leading-relaxed text-ink-200 mb-4 line-clamp-4">
                "{quote.extracted_data?.quote || quote.passage}"
              </blockquote>

              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-parchment-400 line-clamp-1">
                  {quote.extracted_data?.context || ''}
                </p>
                <span className="text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity font-subheading text-xs">
                  View →
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredQuotes.length === 0 && (
          <div className="text-center py-16">
            <Quote className="w-12 h-12 text-gold-400/50 mx-auto mb-4" />
            <p className="font-subheading text-parchment-300 text-lg">No quotes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
