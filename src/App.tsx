import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, User, BookOpen, Crown, Clock3, Building2, Users2, Lightbulb, FileText, Globe, Network, Quote as QuoteIcon, Library } from 'lucide-react';
import { ERAS, processTimelineData, type FrierdikerData } from './data/frierdiker-data';
import TimelineView from './components/TimelineView';
import EraView from './components/EraView';
import EventDetail from './components/EventDetail';
import PersonProfile from './components/PersonProfile';
import SearchPanel from './components/SearchPanel';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import QuotesView from './components/QuotesView';
import BookReader from './components/BookReader';
import PeopleDirectory from './components/PeopleDirectory';
import PlacesDirectory from './components/PlacesDirectory';

type View = 'home' | 'panorama' | 'era' | 'event' | 'person' | 'people' | 'timeline' | 'map' | 'topics' | 'teachings' | 'institutions' | 'communities' | 'concepts' | 'documents' | 'allPlaces' | 'search' | 'knowledgeGraph' | 'quotes' | 'book';

interface BookData {
  title: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
    paragraphs: string[];
    word_count: number;
  }>;
}

function App() {
  const [view, setView] = useState<View>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [bookHighlight, setBookHighlight] = useState<string | undefined>();
  const [bookStartChapter, setBookStartChapter] = useState<number>(1);
  const [bookStartParagraph, setBookStartParagraph] = useState<number | undefined>();
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [previousView, setPreviousView] = useState<View>('home');

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'home') return;
        handleBack();
      }
      if (e.key === '/' && view === 'home') {
        e.preventDefault();
        setView('search');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [view]);

  // Load book data for finding chapter locations
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/book.json`)
      .then(res => res.json())
      .then(data => setBookData(data))
      .catch(err => console.error('Failed to load book data:', err));
  }, []);

  // Function to find which chapter contains a given passage
  const findChapterForPassage = (passage: string): number => {
    if (!bookData) return 1;

    const searchTerms = passage
      .toLowerCase()
      .substring(0, 200)
      .replace(/\[\[\d+:\s*[^\]]*\]\]/g, '') // Remove footnotes
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 5); // Take first 5 significant words

    let bestMatch = { chapter: 1, score: 0 };

    for (const chapter of bookData.chapters) {
      const chapterText = chapter.content.toLowerCase();
      let matchCount = 0;

      for (const term of searchTerms) {
        if (chapterText.includes(term)) {
          matchCount++;
        }
      }

      if (matchCount > bestMatch.score) {
        bestMatch = { chapter: chapter.number, score: matchCount };
      }
    }

    return bestMatch.chapter;
  };

  const [selectedEra, setSelectedEra] = useState<typeof ERAS[number] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [data, setData] = useState<FrierdikerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paths = [
      `${import.meta.env.BASE_URL}data/frierdiker_entities.json`,
      '/frierdiker_entities.json',
      './frierdiker_entities.json'
    ];

    const tryFetch = async (index = 0) => {
      if (index >= paths.length) {
        setError('Could not load timeline data');
        setLoading(false);
        return;
      }

      const path = paths[index];
      console.log(`Trying path ${index + 1}:`, path);

      try {
        const response = await fetch(path);
        if (response.ok) {
          const json = await response.json();
          // Frierdiker data is an array of category objects
          const count = Array.isArray(json) ? json.length : (json.entities?.length || 0);
          console.log('Data loaded:', count, 'entry groups');
          setData(json);
          setLoading(false);
        } else {
          console.log(`Path ${index + 1} failed:`, response.status);
          tryFetch(index + 1);
        }
      } catch (err) {
        console.log(`Path ${index + 1} error:`, err);
        tryFetch(index + 1);
      }
    };

    tryFetch();
  }, []);

  const timelineData = useMemo(() => {
    if (!data) return { events: [], allEvents: [], people: [], places: [], allPlaces: [], topics: [], teachings: [], institutions: [], communities: [], concepts: [], documents: [], quotes: [], allEntities: [] };
    return processTimelineData(data);
  }, [data]);

  const handleReadInBook = (entity: any) => {
    // Check if entity has a meaningful book_link (not just chapter-0-paragraph-0)
    const hasMeaningfulBookLink = entity.book_link && entity.book_link !== 'chapter-0-paragraph-0';

    if (hasMeaningfulBookLink) {
      // Parse format: "chapter-X-paragraph-Y"
      const match = entity.book_link.match(/chapter-(\d+)-paragraph-(\d+)/);
      if (match) {
        const chapter = parseInt(match[1]);
        const paragraph = parseInt(match[2]);
        setBookStartChapter(chapter);
        setBookStartParagraph(paragraph);
        // Use passage for highlighting
        setBookHighlight(entity.passage?.substring(0, 100));
      }
    } else if (entity.passage) {
      // Find the chapter that contains this passage
      const targetChapter = findChapterForPassage(entity.passage);
      setBookStartChapter(targetChapter);
      setBookStartParagraph(undefined);
      setBookHighlight(entity.passage);
    }
    setView('book');
  };

  const handleBack = () => {
    setBookHighlight(undefined);
    if (view === 'event') {
      // Return to where we came from
      if (previousView === 'era' && selectedEra) {
        setView('era');
      } else if (previousView === 'timeline') {
        setView('timeline');
      } else if (previousView === 'map') {
        setView('map');
      } else if (previousView === 'topics') {
        setView('topics');
      } else {
        setView('home');
      }
      setSelectedEvent(null);
    } else if (view === 'era' || view === 'people' || view === 'timeline' || view === 'map' || view === 'topics' || view === 'teachings' || view === 'institutions' || view === 'communities' || view === 'concepts' || view === 'documents' || view === 'allPlaces' || view === 'knowledgeGraph' || view === 'quotes' || view === 'book') {
      setView('home');
      setSelectedEra(null);
    } else if (view === 'person') {
      setView('people');
      setSelectedPerson(null);
    } else if (view === 'search') {
      setView('home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-400 via-ink-500 to-ink-400 text-white overflow-hidden font-body">
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-ink-500 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto mb-8"
              >
                <Crown className="w-full h-full text-gold-400" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-display text-5xl md:text-6xl font-semibold text-gold-200 mb-4"
              >
                Undaunted
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-body text-parchment-400 text-lg italic"
              >
                The Living Timeline
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Elegant Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-500/90 backdrop-blur-md border-b border-gold-400/20">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {view !== 'home' && (
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 font-subheading text-xs sm:text-sm text-gold-300 hover:text-gold-200 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all shrink-0"
                >
                  ← <span className="hidden sm:inline">Return</span>
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-base sm:text-lg md:text-xl font-semibold text-gold-200 truncate">
                  {view === 'home' && 'Undaunted: The Living Timeline'}
                  {view === 'panorama' && 'Era Overview'}
                  {view === 'era' && selectedEra?.name}
                  {view === 'people' && 'Souls of History'}
                  {view === 'allPlaces' && 'Places Directory'}
                  {view === 'timeline' && 'Interactive Timeline'}
                  {view === 'map' && 'Geographic Map'}
                  {view === 'topics' && 'Topics & Themes'}
                  {view === 'teachings' && 'The Teachings'}
                  {view === 'institutions' && 'Institutions'}
                  {view === 'communities' && 'Communities'}
                  {view === 'concepts' && 'Concepts & Ideas'}
                  {view === 'documents' && 'Documents'}
                  {view === 'quotes' && 'Quotes from the Rebbes'}
                  {view === 'book' && 'The Complete Book'}
                  {view === 'event' && 'Event Chronicle'}
                  {view === 'person' && 'Soul Profile'}
                  {view === 'search' && 'Search the Archives'}
                  {view === 'knowledgeGraph' && 'Knowledge Graph'}
                </h1>
                {view === 'home' && (
                  <p className="font-body text-xs sm:text-sm text-parchment-300 italic mt-0.5 hidden sm:block">
                    A journey through Chabad history
                  </p>
                )}
              </div>
            </div>
            {view === 'home' && (
              <button
                onClick={() => setView('search')}
                className="p-2 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all shrink-0"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gold-300" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 h-screen">
        {loading && (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <Crown className="w-full h-full text-gold-400" />
              </motion.div>
              <p className="font-subheading text-parchment-300 text-lg mb-2">Loading the archives...</p>
              <p className="font-body text-parchment-400 text-sm">Preparing the timeline of history</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center">
                <span className="text-3xl">⚠</span>
              </div>
              <p className="font-display text-red-400 text-xl mb-2">Unable to Load Archives</p>
              <p className="font-body text-parchment-300 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gold-400/20 border border-gold-400/40 rounded-full text-gold-300 hover:bg-gold-400/30 transition-all font-subheading"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
            {/* Home/Landing View */}
            {view === 'home' && (
              <HomeView
                key="home"
                onNavigate={(v) => setView(v as View)}
                stats={{
                  events: timelineData.allEvents.length,
                  people: timelineData.people.length,
                  places: timelineData.allPlaces.length,
                  topics: timelineData.topics.length,
                  teachings: timelineData.teachings.length,
                  institutions: timelineData.institutions.length,
                  communities: timelineData.communities.length,
                  quotes: timelineData.quotes.length
                }}
              />
            )}

            {view === 'panorama' && (
              <TimelineView
                key="panorama"
                eras={ERAS}
                events={timelineData.allEvents}
                onSelectEra={(era) => { setSelectedEra(era); setView('era'); }}
              />
            )}
            {view === 'era' && selectedEra && (
              <EraView
                key="era"
                era={selectedEra}
                events={timelineData.allEvents}
                onSelectEvent={(evt: any) => { setSelectedEvent(evt); setPreviousView('era'); setView('event'); }}
                onSelectPerson={(person: any) => { setSelectedPerson(person); setView('person'); }}
              />
            )}
            {view === 'event' && selectedEvent && (
              <EventDetail
                key="event"
                event={selectedEvent}
                places={timelineData.places}
                onSelectPerson={(person: any) => { setSelectedPerson(person); setSelectedEvent(null); setView('person'); }}
                onBack={handleBack}
                onReadInBook={handleReadInBook}
              />
            )}
            {view === 'person' && selectedPerson && (
              <PersonProfile
                key="person"
                person={selectedPerson}
                events={timelineData.events}
                onBack={handleBack}
                onReadInBook={handleReadInBook}
              />
            )}
            {view === 'search' && (
              <SearchPanel
                key="search"
                entities={timelineData.allEntities}
                events={timelineData.events}
                onSelectEvent={(evt: any) => { setSelectedEvent(evt); setPreviousView('home'); setView('event'); }}
                onSelectPerson={(person: any) => { setSelectedPerson(person); setView('person'); }}
              />
            )}

            {/* New Views - Placeholder for now */}
            {view === 'people' && (
              <PeopleDirectory
                key="people"
                people={timelineData.people}
                onSelectPerson={(person: any) => { setSelectedPerson(person); setView('person'); }}
              />
            )}
            {view === 'timeline' && (
              <InteractiveTimeline
                key="timeline"
                events={timelineData.allEvents}
                onSelectEvent={(evt: any) => { setSelectedEvent(evt); setPreviousView('timeline'); setView('event'); }}
              />
            )}
            {view === 'map' && (
              <MapView
                key="map"
                places={timelineData.places}
                events={timelineData.events}
                onSelectEvent={(evt: any) => { setSelectedEvent(evt); setPreviousView('map'); setView('event'); }}
              />
            )}
            {view === 'topics' && (
              <TopicsView
                key="topics"
                topics={timelineData.topics}
                entities={timelineData.allEntities}
                onReadInBook={handleReadInBook}
              />
            )}
            {view === 'teachings' && (
              <TeachingsView
                key="teachings"
                teachings={timelineData.teachings}
                onReadInBook={handleReadInBook}
              />
            )}
            {view === 'institutions' && (
              <InstitutionsView
                key="institutions"
                institutions={timelineData.institutions}
              />
            )}
            {view === 'communities' && (
              <CommunitiesView
                key="communities"
                communities={timelineData.communities}
              />
            )}
            {view === 'concepts' && (
              <ConceptsView
                key="concepts"
                concepts={timelineData.concepts}
              />
            )}
            {view === 'documents' && (
              <DocumentsView
                key="documents"
                documents={timelineData.documents}
              />
            )}
            {view === 'allPlaces' && (
              <PlacesDirectory
                key="allPlaces"
                places={timelineData.allPlaces}
                onReadInBook={handleReadInBook}
              />
            )}
            {view === 'knowledgeGraph' && (
              <KnowledgeGraphView
                key="knowledgeGraph"
                entities={timelineData.allEntities}
                events={timelineData.events}
                people={timelineData.people}
                places={timelineData.places}
                onSelectEntity={(entity: any) => {
                  if (entity.node_type?.toLowerCase().includes('person')) {
                    setSelectedPerson(entity);
                    setView('person');
                  } else if (entity.node_type?.toLowerCase().includes('event')) {
                    setSelectedEvent(entity);
                    setView('event');
                  }
                }}
              />
            )}
            {view === 'quotes' && (
              <QuotesView
                key="quotes"
                quotes={timelineData.quotes}
              />
            )}
            {view === 'book' && (
              <BookReader
                key={`book-${bookStartChapter}-${bookStartParagraph || '0'}`}
                initialChapter={bookStartChapter}
                initialParagraph={bookStartParagraph}
                highlightText={bookHighlight}
                onBack={handleBack}
              />
            )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Elegant Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-ink-500/95 backdrop-blur-md border-t border-gold-400/20">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="text-center">
            <p className="font-subheading text-xs text-gold-400/60">
              Undaunted: The Living Timeline
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Home/Landing View Component
function HomeView({ onNavigate, stats }: { onNavigate: (view: string) => void; stats: { events: number; people: number; places: number; topics: number; teachings: number; institutions: number; communities: number; quotes: number } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative"
    >
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold-400" />
            <Crown className="w-8 h-8 text-gold-400" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold-400" />
          </div>
          <h1 className="font-display text-6xl font-semibold mb-4 text-gold-200">Undaunted</h1>
          <p className="font-body text-parchment-400 text-2xl italic mb-6">The Living Timeline of Chabad Lubavitch</p>

          {/* Stats - more compact */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-gold-300">{stats.events}</div>
              <div className="font-subheading text-parchment-300 text-xs sm:text-sm">Chronicles</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-gold-300">{stats.people}</div>
              <div className="font-subheading text-parchment-300 text-xs sm:text-sm">Souls</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-gold-300">{stats.places}</div>
              <div className="font-subheading text-parchment-300 text-xs sm:text-sm">Places</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-gold-300">{stats.teachings}</div>
              <div className="font-subheading text-parchment-300 text-xs sm:text-sm">Teachings</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-gold-300">{stats.quotes}</div>
              <div className="font-subheading text-parchment-300 text-xs sm:text-sm">Quotes</div>
            </div>
          </div>

          {/* Keyboard hint */}
          <p className="font-subheading text-xs text-parchment-400">
            Press <kbd className="px-2 py-1 bg-gold-400/20 rounded text-gold-400">/</kbd> to search • <kbd className="px-2 py-1 bg-gold-400/20 rounded text-gold-400">Esc</kbd> to go back
          </p>
        </motion.div>

        {/* Entry Points - more compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
          <EntryCard
            icon={<Library className="w-8 h-8" />}
            title="Read the Book"
            description="Complete chapter-by-chapter reader"
            onClick={() => onNavigate('book')}
            delay={0.05}
            color="#DC2626"
          />
          <EntryCard
            icon={<Clock3 className="w-8 h-8" />}
            title="Era Overview"
            description="Four defining eras of leadership"
            onClick={() => onNavigate('panorama')}
            delay={0.1}
            color="#8B5CF6"
          />
          <EntryCard
            icon={<User className="w-8 h-8" />}
            title="People Directory"
            description="Biographies and associated events"
            onClick={() => onNavigate('people')}
            delay={0.15}
            color="#3B82F6"
          />
          <EntryCard
            icon={<Globe className="w-8 h-8" />}
            title="Places Directory"
            description="All locations alphabetically"
            onClick={() => onNavigate('allPlaces')}
            delay={0.2}
            color="#10B981"
          />
          <EntryCard
            icon={<QuoteIcon className="w-8 h-8" />}
            title="Quotes"
            description="Wisdom from the Rebbes"
            onClick={() => onNavigate('quotes')}
            delay={0.25}
            color="#EC4899"
          />
          <EntryCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Topics & Themes"
            description="Alphabetical subject index"
            onClick={() => onNavigate('topics')}
            delay={0.3}
            color="#F59E0B"
          />
          <EntryCard
            icon={<Crown className="w-8 h-8" />}
            title="The Teachings"
            description="Wisdom and discourses"
            onClick={() => onNavigate('teachings')}
            delay={0.35}
            color="#EC4899"
          />
          <EntryCard
            icon={<Building2 className="w-8 h-8" />}
            title="Institutions"
            description="Yeshivas & organizations"
            onClick={() => onNavigate('institutions')}
            delay={0.4}
            color="#6366F1"
          />
          <EntryCard
            icon={<Network className="w-8 h-8" />}
            title="Knowledge Graph"
            description="Interactive visual network"
            onClick={() => onNavigate('knowledgeGraph')}
            delay={0.45}
            color="#06B6D4"
          />
          <EntryCard
            icon={<Clock3 className="w-8 h-8" />}
            title="Timeline"
            description="Visual chronology"
            onClick={() => onNavigate('timeline')}
            delay={0.5}
            color="#3B82F6"
          />
        </div>
      </div>
    </motion.div>
  );
}

function EntryCard({ icon, title, description, onClick, delay, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative bg-parchment-100/90 backdrop-blur-sm border border-gold-400/40 rounded-lg overflow-hidden shadow-ornate cursor-pointer group"
      style={{ borderWidth: '1px' }}
    >
      <div className="h-0.5 w-full" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-gold-400/20" style={{ color }}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold mb-1 text-ink-200">{title}</h3>
            <p className="font-body text-xs text-parchment-400">{description}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-gold-700 opacity-0 group-hover:opacity-100 transition-opacity font-subheading text-xs">
          <span>Explore</span>
          <span>→</span>
        </div>
      </div>
    </motion.div>
  );
}

function InteractiveTimeline({ events, onSelectEvent }: any) {
  const [expandedEvent, setExpandedEvent] = useState<any>(null);

  // Group events by decade for the timeline
  const eventsByDecade = events.reduce((acc: any, event: any) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!acc[decade]) acc[decade] = [];
    acc[decade].push(event);
    return acc;
  }, {});

  const decades = Object.keys(eventsByDecade).sort().map(Number);

  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500 relative">
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <Clock3 className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">Interactive Timeline</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Click on any event to explore the chronicle
        </p>

        {/* Timeline */}
        <div className="relative py-8">
          {/* Main timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gold-500/60 to-transparent" />

          <div className="space-y-6">
            {decades.map((decade, decadeIdx) => (
              <div key={decade} className="relative">
                {/* Decade marker */}
                <div className="flex items-center mb-3">
                  <div className="absolute left-6 w-3 h-3 rounded-full bg-gold-500 border-3 border-ink-500"></div>
                  <div className="ml-12">
                    <span className="font-display text-xl text-gold-300">{decade}s</span>
                    <span className="font-subheading text-xs text-parchment-300 ml-3">({eventsByDecade[decade].length} events)</span>
                  </div>
                </div>

                {/* Events for this decade */}
                <div className="ml-12 space-y-2">
                  {eventsByDecade[decade].map((event: any, eventIdx: number) => (
                    <motion.div
                      key={eventIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (decadeIdx * 0.05) + (eventIdx * 0.01) }}
                    >
                      <div
                        onClick={() => { setExpandedEvent(expandedEvent === event ? null : event); }}
                        className={`cursor-pointer ${expandedEvent === event ? 'bg-gold-400/20 border-gold-400' : 'bg-parchment-100/80 border-gold-400/30 hover:border-gold-400/60'} border rounded-lg p-4 transition-all`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {event.year ? (
                            <span className="font-subheading text-sm text-gold-500">{event.year}</span>
                          ) : event.date ? (
                            <span className="font-subheading text-xs text-gold-600">{event.date}</span>
                          ) : null}
                        </div>
                        <h4 className="font-display text-base text-ink-200 mb-1">
                          {(event as any).name || event.extracted_data?.title || event.extracted_data?.event || event.extracted_data?.description || 'Event'}
                        </h4>
                        {expandedEvent === event && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-3 pt-3 border-t border-gold-400/20"
                          >
                            <p className="font-body text-sm text-ink-100 leading-relaxed mb-3">
                              {event.passage?.substring(0, 200)}...
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                              className="font-subheading text-xs text-gold-600 hover:text-gold-700 px-3 py-1 border border-gold-500/40 rounded-full hover:bg-gold-500/10 transition-all"
                            >
                              View Full Details →
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapView({ places, events: _events, onSelectEvent: _onSelectEvent }: any) {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-display text-4xl text-gold-200 mb-8">Geographic Map</h2>
        <p className="font-body text-parchment-400">Found {places.length} geolocated places</p>
      </div>
    </div>
  );
}

function TopicsView({ topics, entities, onReadInBook }: any) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);

  const getEntitiesForTopic = (topic: string) => {
    return entities.filter((e: any) => {
      const passage = (e.passage || '').toLowerCase();
      const desc = (e.extracted_data?.event || e.extracted_data?.description || e.extracted_data?.topic || '').toLowerCase();
      return passage.includes(topic.toLowerCase()) || desc.includes(topic.toLowerCase());
    });
  };

  if (selectedTopic) {
    const topicEntities = getEntitiesForTopic(selectedTopic);
    return (
      <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setSelectedTopic(null)} className="font-subheading text-gold-300 hover:text-gold-200 mb-6">← Back to Topics</button>
          <h2 className="font-display text-4xl text-gold-200 text-center mb-8">{selectedTopic}</h2>
          <p className="font-body text-parchment-400 text-center mb-8">Found {topicEntities.length} references</p>
          <div className="space-y-4">
            {topicEntities.map((entity: any, i: number) => (
              <div key={i} className="bg-parchment-100/70 border border-gold-400/30 rounded-lg p-5 hover:border-gold-400 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-subheading text-xs text-gold-700 uppercase">{entity.node_type}</span>
                  {onReadInBook && entity.passage && (
                    <button
                      onClick={() => onReadInBook(entity)}
                      className="text-xs text-gold-600 hover:text-gold-400 font-subheading border border-gold-400/30 px-2 py-1 rounded-full hover:bg-gold-400/10 transition-all"
                    >
                      Read in Book →
                    </button>
                  )}
                </div>
                <h3 className="font-display text-lg text-ink-200 mt-2">{entity.extracted_data?.event || entity.extracted_data?.title || entity.extracted_data?.name || entity.extracted_data?.description || 'Entry'}</h3>
                <p className="font-body text-sm text-ink-100 line-clamp-3">{entity.passage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl text-gold-200 text-center mb-8">Topics & Themes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {alphabet.map(letter => {
            const letterTopics = topics.filter((t: string) => t.startsWith(letter));
            if (letterTopics.length === 0) return null;
            const isExpanded = expandedLetter === letter;
            const displayedTopics = isExpanded ? letterTopics : letterTopics.slice(0, 6);

            return (
              <div key={letter} className="text-center">
                <div className="font-display text-3xl text-gold-400 mb-3">{letter}</div>
                <div className="space-y-2">
                  {displayedTopics.map((topic: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTopic(topic)}
                      className="block w-full font-body text-sm text-gold-700 hover:text-gold-400 hover:bg-gold-400/10 px-2 py-1 rounded transition-all text-left"
                    >
                      {topic}
                    </button>
                  ))}
                  {letterTopics.length > 6 && (
                    <button
                      onClick={() => setExpandedLetter(isExpanded ? null : letter)}
                      className="block w-full font-subheading text-xs text-gold-600 hover:text-gold-400 hover:bg-gold-400/10 px-2 py-1 rounded transition-all text-center"
                    >
                      {isExpanded ? `Show less` : `+${letterTopics.length - 6} more`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InstitutionsView({ institutions }: any) {
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);

  if (selectedInstitution) {
    // Group all institutions by name to find all references
    const institutionName = selectedInstitution.extracted_data?.name || selectedInstitution.extracted_data?.institution || 'Unknown';
    const allReferences = institutions.filter((inst: any) => {
      const name = inst.extracted_data?.name || inst.extracted_data?.institution || '';
      return name.toLowerCase() === institutionName.toLowerCase();
    });

    return (
      <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelectedInstitution(null)} className="font-subheading text-gold-300 hover:text-gold-200 mb-6">← Back to Institutions</button>
          <div className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-8 shadow-ornate">
            <h2 className="font-display text-3xl text-ink-200 mb-4">{institutionName}</h2>
            <p className="font-subheading text-sm text-gold-700 mb-6">{allReferences.length} references found</p>
            <div className="space-y-4">
              {allReferences.map((ref: any, i: number) => (
                <div key={i} className="bg-ink-500/30 border border-gold-400/20 rounded-lg p-4">
                  <p className="font-body text-sm text-ink-200 leading-relaxed">{ref.passage || ref.extracted_data?.description || ''}</p>
                  {ref.book_link && (
                    <div className="mt-2 text-xs text-gold-600 font-subheading">
                      Location: {ref.book_link}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <Building2 className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">Institutions</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Yeshivas, organizations, and foundations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutions.map((inst: any, i: number) => (
            <div
              key={i}
              onClick={() => setSelectedInstitution(inst)}
              className="bg-parchment-100/70 border border-gold-400/30 rounded-lg p-5 cursor-pointer hover:border-gold-400 hover:bg-parchment-200 transition-all"
            >
              <h3 className="font-display text-lg text-ink-200 mb-2">{inst.extracted_data?.name || inst.extracted_data?.institution || 'Institution'}</h3>
              <p className="font-body text-sm text-ink-100 line-clamp-3">{inst.passage || inst.extracted_data?.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunitiesView({ communities }: any) {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <Users2 className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">Communities</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Jewish communities around the world
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((comm: any, i: number) => (
            <div key={i} className="bg-parchment-100/70 border border-gold-400/30 rounded-lg p-5">
              <h3 className="font-display text-lg text-ink-200 mb-2">{comm.extracted_data?.name || comm.extracted_data?.community || 'Community'}</h3>
              <p className="font-body text-sm text-ink-100 line-clamp-3">{comm.passage || comm.extracted_data?.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConceptsView({ concepts }: any) {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <Lightbulb className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">Concepts & Ideas</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Philosophical concepts and themes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {concepts.map((conc: any, i: number) => (
            <div key={i} className="bg-parchment-100/70 border border-gold-400/30 rounded-lg p-5">
              <h3 className="font-display text-lg text-ink-200 mb-2">{conc.extracted_data?.name || conc.extracted_data?.concept || 'Concept'}</h3>
              <p className="font-body text-sm text-ink-100 line-clamp-3">{conc.passage || conc.extracted_data?.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ documents }: any) {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <FileText className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">Documents</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Source documents, letters, and writings
        </p>
        <div className="space-y-4">
          {documents.map((doc: any, i: number) => (
            <div key={i} className="bg-parchment-100/70 border border-gold-400/30 rounded-lg p-5">
              <h3 className="font-display text-lg text-ink-200 mb-2">{doc.extracted_data?.title || doc.extracted_data?.name || 'Document'}</h3>
              <p className="font-body text-sm text-ink-100 line-clamp-3">{doc.passage || doc.extracted_data?.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeachingsView({ teachings, onReadInBook }: any) {
  const [selectedTeaching, setSelectedTeaching] = useState<any>(null);

  // Helper to generate descriptive title
  const generateTeachingTitle = (teaching: any): string => {
    // First check if we have a proper title in extracted_data
    if (teaching.extracted_data?.title && teaching.extracted_data.title !== teaching.extracted_data.teaching) {
      return teaching.extracted_data.title;
    }
    if (teaching.extracted_data?.topic) {
      return teaching.extracted_data.topic;
    }
    // Try to extract a meaningful title from the passage
    const passage = teaching.passage || '';
    // Look for key phrases that indicate teachings
    const teachingPatterns = [
      /(?:The Rebbe|Rabbi) said[:\s]+["']?([^"'.]+)["']?/i,
      /(?:He |They )stated[:\s]+["']?([^"'.]+)["']?/i,
      /(?:The |This )teaching[:\s]+(?:about|regarding|concerning)\s+([^,.\s]+)/i,
    ];
    for (const pattern of teachingPatterns) {
      const match = passage.match(pattern);
      if (match && match[1] && match[1].length > 5 && match[1].length < 60) {
        return match[1].trim();
      }
    }
    // Extract first meaningful sentence as title
    const sentences = passage.split(/[.!?]+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 100) {
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      }
    }
    // Final fallback: first 60 chars of passage
    return passage.length > 60 ? passage.substring(0, 60) + '...' : passage;
  };

  if (selectedTeaching) {
    const title = generateTeachingTitle(selectedTeaching);
    const bookLocation = selectedTeaching.book_link ?
      `Found in ${selectedTeaching.book_link.replace('chapter-', 'Chapter ').replace('-paragraph-', ', Paragraph ')}` :
      'From the chronicles of the Rebbes';

    return (
      <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelectedTeaching(null)} className="font-subheading text-gold-300 hover:text-gold-200 mb-6">← Back to Teachings</button>
          <div className="bg-parchment-100/90 border border-gold-400/40 rounded-lg p-8 shadow-ornate">
            <div className="h-1 w-full bg-gradient-to-r from-gold-400/50 via-gold-400 to-gold-400/50 mb-6" />

            {/* Context info */}
            <div className="mb-4">
              <p className="font-subheading text-sm text-gold-600">{bookLocation}</p>
            </div>

            <h2 className="font-display text-3xl text-ink-200 mb-4">
              {title}
            </h2>

            {selectedTeaching.extracted_data?.speaker && (
              <p className="font-subheading text-sm text-gold-700 mb-4">
                Taught by: {selectedTeaching.extracted_data.speaker}
              </p>
            )}

            <p className="font-body text-lg text-ink-100 leading-relaxed whitespace-pre-line">
              {selectedTeaching.passage || selectedTeaching.extracted_data?.description || 'No content available'}
            </p>

            {onReadInBook && selectedTeaching.passage && (
              <div className="mt-6 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onReadInBook(selectedTeaching)}
                  className="flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 rounded-full font-subheading text-sm text-gold-600 hover:bg-gold-500/30 hover:text-gold-700 transition-all"
                >
                  <Library className="w-4 h-4" />
                  <span>Read in Book (with highlighting)</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8 bg-ink-500">
      <div className="fixed inset-0 bg-aged-paper opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
          <Crown className="w-6 h-6 text-gold-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
        </div>
        <h2 className="font-display text-5xl text-gold-200 text-center mb-4">The Teachings</h2>
        <p className="font-body text-parchment-400 text-center text-lg mb-12 italic max-w-2xl mx-auto">
          Wisdom and insights from the Rebbes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teachings.map((teaching: any, i: number) => {
            const title = generateTeachingTitle(teaching);
            const preview = teaching.passage || teaching.extracted_data?.description || '';
            return (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedTeaching(teaching)}
                className="bg-parchment-100/80 border border-gold-400/30 rounded-lg p-5 shadow-card cursor-pointer hover:border-gold-400/60 transition-all"
              >
                <h3 className="font-display text-lg text-ink-200 mb-3 leading-snug">
                  {title}
                </h3>
                <p className="font-body text-sm text-ink-100 line-clamp-3 leading-relaxed">
                  {preview}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gold-700 font-subheading">
                  <span>Click to read</span>
                  <span>→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
