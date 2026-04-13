import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Library } from 'lucide-react';

interface Place {
  extracted_data?: {
    name?: string;
    country?: string;
    place_type?: string;
    description?: string;
  };
  passage?: string;
  bookReferences?: Array<{
    chapter?: number;
    paragraph?: number;
    book_link?: string;
  }>;
  book_link?: string;
  chapter?: number;
  paragraph?: number;
}

interface PlacesDirectoryProps {
  places: any[];
  onReadInBook?: (entity: any) => void;
}

export default function PlacesDirectory({ places, onReadInBook }: PlacesDirectoryProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 36;

  // Merge places by canonical name
  const mergedPlaces = useMemo(() => {
    const placesMap = new Map<string, Place>();

    places.forEach((place: any) => {
      const name = place.extracted_data?.name || place.name || place.passage?.substring(0, 50) || '';
      if (!name || name.length < 2) return;

      const canonical = name.toLowerCase().trim();

      if (placesMap.has(canonical)) {
        const existing = placesMap.get(canonical)!;
        existing.bookReferences = existing.bookReferences || [];
        if (place.book_link || place.chapter) {
          existing.bookReferences.push({
            chapter: place.chapter,
            paragraph: place.paragraph,
            book_link: place.book_link
          });
        }
        // Preserve most complete data
        if (place.extracted_data?.country && !existing.extracted_data?.country) {
          existing.extracted_data = { ...existing.extracted_data, country: place.extracted_data.country };
        }
        if (place.extracted_data?.place_type && !existing.extracted_data?.place_type) {
          existing.extracted_data = { ...existing.extracted_data, place_type: place.extracted_data.place_type };
        }
      } else {
        placesMap.set(canonical, {
          ...place,
          bookReferences: (place.book_link || place.chapter) ? [{
            chapter: place.chapter,
            paragraph: place.paragraph,
            book_link: place.book_link
          }] : []
        });
      }
    });

    return Array.from(placesMap.values()).sort((a, b) => {
      const nameA = a.extracted_data?.name || a.passage?.substring(0, 50) || '';
      const nameB = b.extracted_data?.name || b.passage?.substring(0, 50) || '';
      return nameA.localeCompare(nameB);
    });
  }, [places]);

  // Get unique first letters
  const firstLetters = Array.from(new Set(
    mergedPlaces.map((p: Place) => {
      const name = p.extracted_data?.name || p.passage?.substring(0, 50) || '';
      return name.charAt(0).toUpperCase();
    }).filter((l: string) => l)
  )).sort();

  // Filter by letter if selected
  const filteredPlaces = useMemo(() => {
    if (!selectedLetter) return mergedPlaces;
    return mergedPlaces.filter((p: Place) => {
      const name = p.extracted_data?.name || p.passage?.substring(0, 50) || '';
      return name.charAt(0).toUpperCase() === selectedLetter;
    });
  }, [mergedPlaces, selectedLetter]);

  // Pagination
  const totalPages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);
  const paginatedPlaces = filteredPlaces.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  useMemo(() => {
    setCurrentPage(0);
  }, [selectedLetter]);

  if (selectedLetter) {
    return (
      <div className="h-full overflow-y-auto px-4 sm:px-8 py-8 bg-ink-500">
        <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <button
            onClick={() => setSelectedLetter(null)}
            className="font-subheading text-gold-300 hover:text-gold-200 mb-6 border border-gold-400/30 px-4 py-2 rounded-full hover:bg-gold-400/10 transition-all"
          >
            ← Back to All Places
          </button>
          <h2 className="font-display text-4xl text-gold-200 text-center mb-6">{selectedLetter}</h2>
          <p className="font-body text-parchment-400 text-center mb-8">{filteredPlaces.length} places</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPlaces.map((place: Place, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-5 hover:border-gold-500 hover:shadow-gold-glow transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-ink-200 mb-1 truncate">
                      {place.extracted_data?.name || place.passage?.substring(0, 50)}
                    </h3>
                    {place.extracted_data?.country && (
                      <p className="font-subheading text-sm text-gold-700">{place.extracted_data.country}</p>
                    )}
                    {place.extracted_data?.place_type && (
                      <p className="font-body text-xs text-ink-100">{place.extracted_data.place_type}</p>
                    )}
                  </div>
                </div>
                {place.extracted_data?.description && (
                  <p className="font-body text-sm text-ink-100 line-clamp-2 mb-3">
                    {place.extracted_data.description}
                  </p>
                )}
                {place.bookReferences && place.bookReferences.length > 0 && (
                  <div className="pt-3 border-t border-gold-400/20">
                    <p className="text-xs font-subheading text-gold-600 mb-2">
                      {place.bookReferences.length} reference{place.bookReferences.length > 1 ? 's' : ''} in book
                    </p>
                    <div className="space-y-1">
                      {place.bookReferences.slice(0, 2).map((ref, idx) => (
                        <button
                          key={idx}
                          onClick={() => onReadInBook?.({ ...place, book_link: ref.book_link, chapter: ref.chapter, paragraph: ref.paragraph })}
                          className="flex items-center gap-2 text-xs font-subheading text-gold-700 hover:text-gold-500 transition-colors"
                        >
                          <Library className="w-3 h-3" />
                          Ch. {ref.chapter || '?'}{ref.paragraph !== undefined ? ` §${ref.paragraph + 1}` : ''}
                        </button>
                      ))}
                      {place.bookReferences.length > 2 && (
                        <p className="text-xs text-parchment-500">
                          +{place.bookReferences.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <span className="font-subheading text-sm text-gold-300">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-8 bg-ink-500">
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <MapPin className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl font-semibold text-gold-200 text-center mb-4">Places Directory</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          {mergedPlaces.length} locations in Chabad history
        </p>

        {/* Alphabet filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {firstLetters.map((letter: string) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className="w-10 h-10 font-display text-gold-300 hover:text-gold-200 hover:bg-gold-400/20 border border-gold-400/40 rounded-full transition-all"
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedPlaces.map((place: Place, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-4 hover:border-gold-500 hover:shadow-gold-glow transition-all"
            >
              <div className="flex items-start gap-3 mb-2">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold text-ink-200 mb-1 truncate">
                    {place.extracted_data?.name || place.passage?.substring(0, 60) || 'Unknown'}
                  </h3>
                  {place.extracted_data?.country && (
                    <p className="font-subheading text-xs text-gold-700">{place.extracted_data.country}</p>
                  )}
                </div>
              </div>
              {place.bookReferences && place.bookReferences.length > 0 && (
                <div className="pt-2 border-t border-gold-400/20">
                  <p className="text-xs font-subheading text-gold-600">
                    {place.bookReferences.length} reference{place.bookReferences.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="font-subheading text-sm text-gold-300">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
