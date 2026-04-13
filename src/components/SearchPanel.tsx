import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, User, Calendar, MapPin, Sparkles, BookOpen, Building2 } from 'lucide-react';

interface SearchPanelProps {
  entities: any[];
  events: any[];
  onSelectEvent: (event: any) => void;
  onSelectPerson: (person: any) => void;
}

export default function SearchPanel({ entities, events, onSelectEvent, onSelectPerson }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'events' | 'people' | 'places'>('all');

  // Helper to get icon for entity type
  const getEntityIcon = (item: any) => {
    if (item.node_type?.toLowerCase().includes('event')) return <Calendar className="w-5 h-5" />;
    if (item.node_type?.toLowerCase().includes('person')) return <User className="w-5 h-5" />;
    if (item.node_type?.toLowerCase().includes('place')) return <MapPin className="w-5 h-5" />;
    if (item.node_type?.toLowerCase().includes('teaching')) return <BookOpen className="w-5 h-5" />;
    if (item.node_type?.toLowerCase().includes('institution')) return <Building2 className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  // Helper to get color for entity type
  const getEntityColor = (item: any) => {
    if (item.node_type?.toLowerCase().includes('event')) return 'text-gold-600';
    if (item.node_type?.toLowerCase().includes('person')) return 'text-blue-500';
    if (item.node_type?.toLowerCase().includes('place')) return 'text-green-500';
    if (item.node_type?.toLowerCase().includes('teaching')) return 'text-pink-500';
    return 'text-purple-500';
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    let filtered = entities;

    if (filter === 'events') {
      filtered = events;
    } else if (filter === 'people') {
      filtered = entities.filter(e => e.node_type?.toLowerCase().includes('person'));
    } else if (filter === 'places') {
      filtered = entities.filter(e => e.node_type?.toLowerCase().includes('place'));
    }

    return filtered
      .filter(e => {
        const passage = (e.passage || '').toLowerCase();
        const name = ((e as any).name || '').toLowerCase();
        const desc = (e.extracted_data?.description || '').toLowerCase();
        const event = (e.extracted_data?.event || '').toLowerCase();
        return passage.includes(q) || name.includes(q) || desc.includes(q) || event.includes(q);
      })
      .slice(0, 50);
  }, [query, filter, entities, events]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative"
    >
      {/* Aged paper texture overlay */}
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
            <Sparkles className="w-5 h-5 text-gold-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-gold-200">Search the Archives</h1>
          <p className="font-body text-parchment-400 mt-2 italic">Explore the chronicles of Chabad history</p>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for souls, events, or places..."
              className="w-full pl-14 pr-12 py-4 bg-parchment-100/80 backdrop-blur-sm border-2 border-gold-400/40 rounded-xl text-ink-200 placeholder-parchment-500 focus:outline-none focus:border-gold-400 transition-colors font-body text-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-parchment-300 hover:text-gold-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 mt-4 justify-center">
            {(['all', 'events', 'people', 'places'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm capitalize transition-all font-subheading ${
                  filter === f
                    ? 'bg-gold-500 text-ink-200 shadow-gold-glow'
                    : 'bg-parchment-100/50 text-parchment-300 border border-gold-400/30 hover:border-gold-400/60'
                }`}
              >
                {f === 'all' ? 'All Archives' : f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {query && results.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-gold-400/50 mx-auto mb-4" />
              <p className="font-subheading text-parchment-300 text-lg">No chronicles found for "{query}"</p>
              <p className="font-body text-parchment-400 text-sm mt-2">Try searching for a different term</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mb-4 text-center font-subheading text-parchment-300">
              Found {results.length} result{results.length !== 1 ? 's' : ''} in the archives
            </div>
          )}

          <div className="space-y-3">
            {results.map((item, index) => {
              const isEvent = item.node_type?.toLowerCase().includes('event');
              const isPerson = item.node_type?.toLowerCase().includes('person');
              const entityColor = getEntityColor(item);

              return (
                <motion.div
                  key={index}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    if (isEvent) onSelectEvent(item);
                    else if (isPerson) onSelectPerson(item);
                  }}
                  className="bg-parchment-100/70 backdrop-blur-sm border border-gold-400/30 rounded-lg overflow-hidden hover:border-gold-400/60 cursor-pointer transition-all shadow-card group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 ${entityColor}`}>
                        {getEntityIcon(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display font-semibold text-ink-200">
                            {(item as any).name ||
                             item.extracted_data?.name ||
                             item.extracted_data?.event ||
                             item.extracted_data?.description ||
                             item.node_type}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-subheading uppercase tracking-wide bg-gold-400/20 text-gold-700 rounded-full">
                            {item.node_type}
                          </span>
                        </div>
                        <p className="font-body text-sm text-ink-100 line-clamp-2 leading-relaxed">
                          {item.passage?.substring(0, 150)}
                          {item.passage && item.passage.length > 150 && '...'}
                        </p>
                        {item.year && (
                          <div className="mt-2 font-subheading text-xs text-gold-700">{item.year}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
