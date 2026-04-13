import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, List, Search, X, Crown } from 'lucide-react';

interface Chapter {
  number: number;
  title: string;
  content: string;
  paragraphs: string[];
  word_count: number;
}

interface BookData {
  title: string;
  chapters: Chapter[];
}

interface Footnote {
  number: number;
  text: string;
}

interface BookReaderProps {
  initialChapter?: number;
  initialParagraph?: number;
  highlightText?: string;
  onBack?: () => void;
}

export default function BookReader({ initialChapter = 1, initialParagraph, highlightText, onBack }: BookReaderProps) {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [loading, setLoading] = useState(true);
  const [showTOC, setShowTOC] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ chapter: number; paragraph: number; text: string }>>([]);
  const [activeFootnote, setActiveFootnote] = useState<Footnote | null>(null);
  const [footnotePosition, setFootnotePosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Sync chapter state with prop changes (e.g., when navigating from entity links)
  useEffect(() => {
    setCurrentChapter(initialChapter);
  }, [initialChapter]);

  // Merge paragraphs that have split footnotes
  // Handle case where a footnote [[N: ... ]] contains \n\n and gets split across paragraphs
  const mergeSplitFootnotes = (paragraphs: string[]): string[] => {
    const merged: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const current = paragraphs[i];

      // Check if paragraph ends with an unclosed footnote [[N: but no closing ]]
      const unclosedFootnoteMatch = current.match(/\[\[(\d+):\s*([^\]]*)$/);

      if (unclosedFootnoteMatch && i + 1 < paragraphs.length) {
        // This paragraph ends with an incomplete footnote
        // Look ahead to find the closing ]] in subsequent paragraphs
        let footnoteNum = unclosedFootnoteMatch[1];
        let accumulatedText = current;
        let j = i + 1;

        // Keep accumulating paragraphs until we find the closing ]]
        while (j < paragraphs.length) {
          accumulatedText += ' ' + paragraphs[j];
          // Check if we now have a complete footnote
          const completeFootnoteRegex = new RegExp(`\\[\\[${footnoteNum}:\\s*[^\\]]*\\]\\]`);
          if (completeFootnoteRegex.test(accumulatedText)) {
            // Found the complete footnote
            i = j; // Skip the merged paragraphs
            break;
          }
          j++;
        }

        merged.push(accumulatedText);
      } else {
        merged.push(current);
      }
    }
    return merged;
  };

  // Parse footnotes from text and return array of parts
  const parseFootnotes = (text: string): Array<{ type: 'text' | 'footnote'; content: string; footnoteText?: string }> => {
    const parts: Array<{ type: 'text' | 'footnote'; content: string; footnoteText?: string }> = [];
    // Match [[number: text]] format - handle multiline footnotes
    // Updated regex to handle newlines and nested brackets better
    const footnoteRegex = /\[\[(\d+):\s*([\s\S]*?)\]\](?!\])/g;
    let lastIndex = 0;
    let match;

    while ((match = footnoteRegex.exec(text)) !== null) {
      // Add text before this footnote
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }

      // Add the footnote reference
      const footnoteNum = match[1];
      // Clean up the footnote text - remove extra formatting
      let footnoteText = match[2].trim();
      // Replace newlines with spaces for cleaner display
      footnoteText = footnoteText.replace(/\s+/g, ' ');
      parts.push({
        type: 'footnote',
        content: `[${footnoteNum}]`,
        footnoteText
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text - also handle any remaining [[...]] patterns that weren't matched
    if (lastIndex < text.length) {
      let remainingText = text.slice(lastIndex);
      // Handle any unmatched [[...]] patterns by converting them to readable text
      remainingText = remainingText.replace(/\[\[([^\]]+)\]\]/g, '<sup class="text-gold-600 text-xs">[$1]</sup>');
      parts.push({ type: 'text', content: remainingText });
    }

    return parts;
  };

  // Handle footnote hover/click - improved to prevent flickering
  const handleFootnoteEnter = (footnoteText: string, element: HTMLElement) => {
    // Clear any pending hide timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    const rect = element.getBoundingClientRect();
    setActiveFootnote({ number: 0, text: footnoteText });
    // Round to integer to prevent sub-pixel blur
    setFootnotePosition({
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.bottom + 8)
    });
  };

  const handleFootnoteLeave = () => {
    // Delay hiding to allow mouse to move to tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setActiveFootnote(null);
    }, 100);
  };

  const handleTooltipEnter = () => {
    // Keep tooltip open when hovering over it
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  const handleTooltipLeave = () => {
    setActiveFootnote(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Load book data
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/book.json`)
      .then(res => res.json())
      .then(data => {
        setBookData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load book:', err);
        setLoading(false);
      });
  }, []);

  // Scroll to highlighted text or specific paragraph
  useEffect(() => {
    if (!contentRef.current || !bookData) return;

    if (initialParagraph !== undefined && initialParagraph >= 0) {
      // Scroll to specific paragraph
      const paragraphs = contentRef.current.querySelectorAll('p');
      if (paragraphs[initialParagraph]) {
        paragraphs[initialParagraph].scrollIntoView({ behavior: 'smooth', block: 'start' });
        paragraphs[initialParagraph].classList.add('bg-gold-400/30');
        setTimeout(() => paragraphs[initialParagraph]?.classList.remove('bg-gold-400/30'), 3000);
      }
    } else if (highlightText) {
      // Scroll to highlighted text
      const content = contentRef.current.textContent || '';
      const index = content.toLowerCase().indexOf(highlightText.toLowerCase());
      if (index !== -1) {
        const walker = document.createTreeWalker(
          contentRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.toLowerCase().includes(highlightText.toLowerCase())) {
            const parent = node.parentElement;
            if (parent) {
              parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
              parent.classList.add('bg-gold-400/30');
              setTimeout(() => parent.classList.remove('bg-gold-400/30'), 3000);
              break;
            }
          }
        }
      }
    }
  }, [currentChapter, initialChapter, highlightText, bookData, initialParagraph]);

  const currentChapterData = bookData?.chapters.find(ch => ch.number === currentChapter);

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim() || !bookData) return;

    const results: Array<{ chapter: number; paragraph: number; text: string }> = [];
    const query = searchQuery.toLowerCase();

    bookData.chapters.forEach(chapter => {
      chapter.paragraphs.forEach((paragraph, pIndex) => {
        if (paragraph.toLowerCase().includes(query)) {
          results.push({
            chapter: chapter.number,
            paragraph: pIndex,
            text: paragraph.substring(0, 200) + (paragraph.length > 200 ? '...' : '')
          });
        }
      });
    });

    setSearchResults(results);
  };

  const goToResult = (chapter: number, paragraph: number) => {
    setCurrentChapter(chapter);
    setShowTOC(false);
    setSearchResults([]);

    setTimeout(() => {
      const paragraphs = contentRef.current?.querySelectorAll('p');
      if (paragraphs && paragraphs[paragraph]) {
        paragraphs[paragraph].scrollIntoView({ behavior: 'smooth', block: 'center' });
        (paragraphs[paragraph] as HTMLElement).classList.add('bg-gold-400/30');
        setTimeout(() => (paragraphs[paragraph] as HTMLElement).classList.remove('bg-gold-400/30'), 3000);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-ink-500">
        <div className="text-center">
          <Crown className="w-12 h-12 text-gold-400 mx-auto mb-4 animate-pulse" />
          <p className="font-subheading text-parchment-400">Loading the chronicles...</p>
        </div>
      </div>
    );
  }

  if (!bookData || !currentChapterData) {
    return (
      <div className="h-full flex items-center justify-center bg-ink-500">
        <p className="font-body text-parchment-400">Unable to load book content</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ink-500 relative">
      {/* Aged paper texture overlay */}
      <div className="fixed inset-0 bg-aged-paper opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 bg-ink-500/90 backdrop-blur-sm border-b border-gold-400/20 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gold-300" />
              </button>
            )}
            <div>
              <h1 className="font-display text-lg sm:text-xl text-gold-200">Undaunted</h1>
              <p className="font-subheading text-xs text-parchment-300">The Complete Chronicles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTOC(!showTOC)}
              className="p-2 border border-gold-400/30 rounded-full hover:bg-gold-400/10 transition-all"
              title="Table of Contents"
            >
              <List className="w-4 h-4 text-gold-300" />
            </button>
          </div>
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
            disabled={currentChapter === 0}
            className="flex items-center gap-2 px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full hover:bg-parchment-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-subheading text-sm text-ink-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="text-center">
            <h2 className="font-display text-base sm:text-lg text-gold-200">{currentChapterData.title}</h2>
            <p className="font-subheading text-xs text-parchment-300">
              Chapter {currentChapter + 1} of {bookData.chapters.length}
            </p>
          </div>

          <button
            onClick={() => setCurrentChapter(Math.min(bookData.chapters.length - 1, currentChapter + 1))}
            disabled={currentChapter === bookData.chapters.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-parchment-100/80 border border-gold-400/30 rounded-full hover:bg-parchment-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-subheading text-sm text-ink-200"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content */}
        <motion.div
          key={currentChapter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 relative z-10"
        >
          <div
            ref={contentRef}
            className="max-w-3xl mx-auto bg-parchment-100/95 backdrop-blur-sm border border-gold-400/30 rounded-lg p-6 sm:p-10 shadow-ornate"
          >
            {/* Chapter header */}
            <div className="text-center mb-8 pb-6 border-b border-gold-400/20">
              <BookOpen className="w-10 h-10 text-gold-500 mx-auto mb-4" />
              <h3 className="font-display text-2xl sm:text-3xl text-ink-200 mb-2">{currentChapterData.title}</h3>
              <p className="font-subheading text-sm text-parchment-400">
                {currentChapterData.word_count.toLocaleString()} words
              </p>
            </div>

            {/* Chapter content */}
            <div className="prose prose-parchment max-w-none">
              {mergeSplitFootnotes(currentChapterData.paragraphs).map((paragraph, index) => {
                const parts = parseFootnotes(paragraph);
                return (
                  <p
                    key={index}
                    className="font-body text-base sm:text-lg leading-relaxed text-ink-100 mb-6"
                  >
                    {parts.map((part, partIndex) => {
                      if (part.type === 'footnote') {
                        return (
                          <sup
                            key={partIndex}
                            className="footnote-ref cursor-pointer text-gold-600 hover:text-gold-400 font-subheading text-xs align-super mx-0.5"
                            onMouseEnter={(e) => handleFootnoteEnter(part.footnoteText || '', e.currentTarget)}
                            onMouseLeave={handleFootnoteLeave}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFootnoteEnter(part.footnoteText || '', e.currentTarget);
                            }}
                          >
                            {part.content}
                          </sup>
                        );
                      }
                      return <span key={partIndex}>{part.content}</span>;
                    })}
                  </p>
                );
              })}
            </div>

            {/* Chapter end navigation */}
            <div className="mt-12 pt-8 border-t border-gold-400/20 flex justify-center gap-4">
              {currentChapter > 0 && (
                <button
                  onClick={() => setCurrentChapter(currentChapter - 1)}
                  className="px-6 py-3 bg-parchment-200/50 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-300 transition-all"
                >
                  ← Previous Chapter
                </button>
              )}
              {currentChapter < bookData.chapters.length - 1 && (
                <button
                  onClick={() => setCurrentChapter(currentChapter + 1)}
                  className="px-6 py-3 bg-parchment-200/50 border border-gold-400/30 rounded-full font-subheading text-sm text-ink-200 hover:bg-parchment-300 transition-all"
                >
                  Next Chapter →
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Table of Contents sidebar */}
        {showTOC && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-72 bg-ink-500/95 backdrop-blur-sm border-l border-gold-400/20 p-4 overflow-y-auto relative z-20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-gold-200">Chapters</h3>
              <button
                onClick={() => setShowTOC(false)}
                className="p-1 hover:bg-gold-400/20 rounded-full"
              >
                <X className="w-4 h-4 text-gold-300" />
              </button>
            </div>

            <div className="space-y-2">
              {bookData.chapters.map((chapter) => (
                <button
                  key={chapter.number}
                  onClick={() => { setCurrentChapter(chapter.number); setShowTOC(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    currentChapter === chapter.number
                      ? 'bg-gold-500 text-ink-200 shadow-gold-glow'
                      : 'bg-parchment-100/50 text-ink-200 hover:bg-parchment-200'
                  }`}
                >
                  <div className="font-subheading text-sm mb-1">Chapter {chapter.number}</div>
                  <div className="font-display text-base">{chapter.title}</div>
                  <div className="font-body text-xs opacity-70 mt-1">
                    {chapter.word_count.toLocaleString()} words
                  </div>
                </button>
              ))}
            </div>

            {/* Search in TOC */}
            <div className="mt-6 pt-4 border-t border-gold-400/20">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gold-500" />
                <span className="font-subheading text-sm text-gold-200">Search</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search the book..."
                  className="w-full px-3 py-2 pl-9 bg-parchment-100/80 border border-gold-400/30 rounded-lg text-sm text-ink-200 placeholder-parchment-500 focus:outline-none focus:border-gold-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gold-500" />
              </div>
              <button
                onClick={handleSearch}
                className="w-full mt-2 px-4 py-2 bg-gold-400/20 border border-gold-400/30 rounded-lg font-subheading text-sm text-gold-200 hover:bg-gold-400/30 transition-all"
              >
                Search
              </button>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <p className="font-subheading text-xs text-parchment-300 mb-2">
                    Found {searchResults.length} results
                  </p>
                  <div className="space-y-2">
                    {searchResults.slice(0, 20).map((result, index) => (
                      <button
                        key={index}
                        onClick={() => goToResult(result.chapter, result.paragraph)}
                        className="block w-full text-left px-3 py-2 bg-parchment-100/50 rounded hover:bg-parchment-200 transition-all"
                      >
                        <div className="font-subheading text-xs text-gold-700">
                          Chapter {result.chapter}, Paragraph {result.paragraph + 1}
                        </div>
                        <div className="font-body text-xs text-ink-100 line-clamp-2">
                          {result.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footnote tooltip - rendered at document body level using Portal */}
      {createPortal(
        <AnimatePresence>
          {activeFootnote && (
            <div
              ref={tooltipRef}
              className="fixed pointer-events-none"
              style={{
                left: `${footnotePosition.x}px`,
                top: `${footnotePosition.y}px`,
                transform: 'translateX(-50%)',
                zIndex: 999999
              }}
            >
              <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="pointer-events-auto max-w-sm"
                style={{
                  willChange: 'transform, opacity',
                  WebkitFontSmoothing: 'antialiased'
                }}
                onMouseEnter={handleTooltipEnter}
                onMouseLeave={handleTooltipLeave}
              >
                <div className="rounded-lg p-4 shadow-2xl" style={{ backgroundColor: '#1a1a1a', border: '2px solid #d97706' }}>
                  <div className="absolute" style={{ top: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #1a1a1a' }}></div>
                  <p className="font-body text-sm leading-relaxed m-0" style={{ color: '#faf7f0' }}>
                    {activeFootnote.text}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
