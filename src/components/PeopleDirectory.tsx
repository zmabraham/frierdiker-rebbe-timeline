import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface Person {
  extracted_data?: {
    name?: string;
    title?: string;
    role?: string;
    years?: string;
  };
  canonicalName?: string;
  passage?: string;
  count?: number;
  mentionCount?: number;
  bookReferences?: Array<{
    chapter?: number;
    paragraph?: number;
    book_link?: string;
  }>;
  book_link?: string;
  chapter?: number;
  paragraph?: number;
}

interface PeopleDirectoryProps {
  people: any[];
  onSelectPerson: (person: any) => void;
}

function getCanonicalName(name: string): string {
  return name.trim().toLowerCase();
}

function isCompleteName(name: string): boolean {
  const words = name.trim().split(/\s+/);
  return words.length >= 2 || words.some(w => w.length > 8);
}

export default function PeopleDirectory({ people, onSelectPerson }: PeopleDirectoryProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 50;

  // Memoized: Merge people by canonical name with efficient reference counting
  const mergedPeople = useMemo(() => {
    const peopleMap = new Map<string, Person>();

    people.forEach((person: any) => {
      const name = person.extracted_data?.name || person.name || '';
      if (!name || !isCompleteName(name)) return;

      const canonical = getCanonicalName(name);

      if (peopleMap.has(canonical)) {
        const existing = peopleMap.get(canonical)!;
        existing.count = (existing.count || 1) + 1;
        if (person.book_link || person.chapter) {
          if (!existing.bookReferences) existing.bookReferences = [];
          existing.bookReferences.push({
            chapter: person.chapter,
            paragraph: person.paragraph,
            book_link: person.book_link
          });
        }
        if (person.extracted_data?.title && !existing.extracted_data?.title) {
          existing.extracted_data = { ...existing.extracted_data, title: person.extracted_data.title };
        }
        if (person.extracted_data?.role && !existing.extracted_data?.role) {
          existing.extracted_data = { ...existing.extracted_data, role: person.extracted_data.role };
        }
      } else {
        peopleMap.set(canonical, {
          ...person,
          canonicalName: canonical,
          count: 1,
          bookReferences: (person.book_link || person.chapter) ? [{
            chapter: person.chapter,
            paragraph: person.paragraph,
            book_link: person.book_link
          }] : []
        });
      }
    });

    return Array.from(peopleMap.values()).sort((a, b) =>
      (a.canonicalName || a.extracted_data?.name || '').localeCompare(b.canonicalName || b.extracted_data?.name || '')
    );
  }, [people]);

  // Get unique first letters
  const firstLetters = Array.from(new Set(
    mergedPeople.map((p: Person) => {
      const name = p.canonicalName || p.extracted_data?.name || '';
      return name.charAt(0).toUpperCase();
    }).filter((l: string) => l)
  )).sort();

  // Filter by letter if selected
  const filteredPeople = useMemo(() => {
    if (!selectedLetter) return mergedPeople;
    return mergedPeople.filter((p: Person) => {
      const name = p.canonicalName || p.extracted_data?.name || '';
      return name.charAt(0).toUpperCase() === selectedLetter;
    });
  }, [mergedPeople, selectedLetter]);

  // Pagination
  const totalPages = Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  const paginatedPeople = filteredPeople.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Reset page when letter changes
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
            ← Back to All People
          </button>
          <h2 className="font-display text-4xl text-gold-200 text-center mb-6">{selectedLetter}</h2>
          <p className="font-body text-parchment-400 text-center mb-8">{filteredPeople.length} names</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPeople.map((person: Person, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelectPerson(person)}
                className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-5 cursor-pointer hover:border-gold-500 hover:shadow-gold-glow transition-all"
              >
                <h3 className="font-display text-lg font-semibold text-ink-200 mb-1">
                  {person.extracted_data?.name || person.passage?.substring(0, 50)}
                </h3>
                {person.extracted_data?.title && (
                  <p className="font-subheading text-sm text-gold-700 mb-1">{person.extracted_data.title}</p>
                )}
                {person.extracted_data?.role && (
                  <p className="font-body text-sm text-ink-100 mb-2">{person.extracted_data.role}</p>
                )}
                <div className="flex items-center gap-2 text-xs font-subheading text-parchment-500">
                  <span>{person.mentionCount || person.count || 0} mentions</span>
                  {(person.count || 0) > 1 && <span>· {person.count} entries</span>}
                </div>
                {person.bookReferences && person.bookReferences.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gold-400/20">
                    <p className="text-xs font-subheading text-gold-600">{person.bookReferences.length} book reference{person.bookReferences.length > 1 ? 's' : ''}</p>
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
          <User className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl font-semibold text-gold-200 text-center mb-4">People Directory</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          {mergedPeople.length} souls who shaped Chabad history
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
          {paginatedPeople.map((person: Person, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              onClick={() => onSelectPerson(person)}
              className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-4 cursor-pointer hover:border-gold-500 hover:shadow-gold-glow transition-all"
            >
              <h3 className="font-display text-base font-semibold text-ink-200 mb-1">
                {person.extracted_data?.name || person.passage?.substring(0, 60) || 'Unknown'}
              </h3>
              {person.extracted_data?.title && (
                <p className="font-subheading text-xs text-gold-700 mb-1">{person.extracted_data.title}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs font-subheading text-parchment-500">
                <span>{person.mentionCount || person.count || 0} mentions</span>
                {(person.count || 0) > 1 && <span>· {person.count} entries</span>}
              </div>
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
