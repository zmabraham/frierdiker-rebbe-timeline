export interface Entity {
  node_type: string;
  passage: string;
  extracted_data: Record<string, any>;
  merge_count?: number;
  chapter?: number;
  paragraph?: number;
  book_link?: string;
}

export interface UndauntedData {
  source_book: string;
  title: string;
  total_unique_entities: number;
  entities: Entity[];
}

// Process the merged KG data for the timeline
export function processTimelineData(data: UndauntedData) {
  // Helper function to clean footnotes from passage
  const cleanPassage = (passage: string): string => {
    if (!passage) return '';
    // Remove footnotes in format [[number: text]]
    return passage.replace(/\[\[\d+:\s*[^\]]*\]\]/g, '').trim();
  };

  // Intelligent event name generator
  const generateEventName = (entity: Entity): string => {
    const passage = cleanPassage(entity.passage || '');

    // Key patterns to extract meaningful event names
    const patterns = [
      // Arrest/interrogation events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:was\s+)?(?:arrested|interrogated|detained|imprisoned|jailed|confined|released|freed|liberated)/i,
      // Travel/movement events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:traveled|moved|fled|escaped|departed|left|arrived|returned|journeyed|traveled)(?:\s+(?:to|from|towards)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?))?/i,
      // Speech/teaching events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:said|stated|declared|proclaimed|taught|instructed|delivered|spoke)(?:\s+(?:that|about)?)/i,
      // Meeting/gathering events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:met\s+(?:with)?|gathered|assembled|convened|visited|received)/i,
      // Establishment/founding events
      /(?:The\s+)?(?:\w+(?:\s+\w+)?)?\s*(?:established|founded|created|started|began|commenced|inaugurated|organized)/i,
      // Death/burial events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:passed\s+away|died|deceased|was\s+burred|funeral|obituary)/i,
      // Birth events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:was\s+born|birth|born\s+in)/i,
      // Appointment/leadership events
      /(?:The\s+)?(?:Rabbi|Rebbe)?\s*(\w+(?:\s+\w+)?)?\s*(?:was\s+(?:appointed|named|designated)|became|assumed\s+the\s+leadership|assumed\s+the\s+position)/i,
      // Publication/writing events
      /(?:The\s+)?(?:\w+(?:\s+\w+)?)?\s*(?:published|wrote|authored|composed|penned|writings)/i,
    ];

    // Try to match a pattern
    for (const pattern of patterns) {
      const match = passage.match(pattern);
      if (match) {
        // Clean up and return the matched phrase
        let result = match[0];
        // Remove leading/trailing whitespace and quotes
        result = result.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '');
        // Capitalize first letter
        result = result.charAt(0).toUpperCase() + result.slice(1);
        // Add period if missing
        if (!result.endsWith('.')) result += '.';
        // Truncate if too long
        if (result.length > 100) result = result.substring(0, 97) + '...';
        return result;
      }
    }

    // Fallback: extract first meaningful sentence
    const sentences = passage.split(/[.!?]+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 100) {
        // Check if sentence contains key event words
        const eventWords = /\b(arrested|traveled|met|said|established|founded|died|born|appointed|published|escaped|fled|arrived|departed|returned|taught|instructed|delivered|visited|received)\b/i;
        if (eventWords.test(trimmed)) {
          let result = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          if (!result.endsWith('.')) result += '.';
          return result;
        }
      }
    }

    // Final fallback: first 80 chars of passage, cleaned
    let result = passage.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '');
    result = result.charAt(0).toUpperCase() + result.slice(1);
    if (result.length > 80) {
      // Try to cut at word boundary
      const cutAt = result.substring(0, 80).lastIndexOf(' ');
      if (cutAt > 40) {
        result = result.substring(0, cutAt) + '...';
      } else {
        result = result.substring(0, 77) + '...';
      }
    }
    return result;
  };

  // Helper function to add descriptive name to entities
  const addName = (entity: Entity) => {
    const type = entity.node_type;
    const cleanedPassage = cleanPassage(entity.passage || '');
    let name = '';

    switch (type) {
      case 'PEOPLE':
        name = entity.extracted_data?.name || cleanedPassage.substring(0, 50) || 'Unknown Person';
        break;
      case 'EVENT':
        // Use intelligent event name generator
        name = generateEventName(entity);
        break;
      case 'PLACE':
        name = entity.extracted_data?.name || entity.extracted_data?.location || cleanedPassage.substring(0, 50) || 'Unknown Place';
        break;
      case 'QUOTE':
        const quote = cleanedPassage;
        name = quote.length > 80 ? quote.substring(0, 77) + '...' : quote;
        break;
      case 'CONCEPT':
      case 'TEACHING':
        name = entity.extracted_data?.teaching || entity.extracted_data?.concept || entity.extracted_data?.topic || cleanedPassage.substring(0, 50) || 'Unknown Teaching';
        break;
      case 'INSTITUTION':
        name = entity.extracted_data?.name || entity.extracted_data?.institution || cleanedPassage.substring(0, 50) || 'Unknown Institution';
        break;
      case 'DATE':
        name = entity.extracted_data?.date || entity.extracted_data?.year_ce?.toString() || cleanedPassage.substring(0, 30) || 'Unknown Date';
        break;
      default:
        name = entity.extracted_data?.name || entity.extracted_data?.description || cleanedPassage.substring(0, 50) || 'Unknown';
    }

    return {
      ...entity,
      passage: cleanedPassage,
      name: name || 'Unknown'
    };
  };

  // Helper function to check if an entity is actually an event (not a quote/reference)
  const isActualEvent = (entity: Entity): boolean => {
    const passage = cleanPassage(entity.passage || '').toLowerCase();

    // Patterns that indicate this is NOT an event
    const nonEventPatterns = [
      /reads?:\s*["']/i,           // "reads:" followed by quote
      /stated?:\s*["']/i,          // "stated:" followed by quote
      /wrote?:\s*["']/i,           // "wrote:" followed by quote
      /said:\s*/i,                 // "said:"
      /see:\s*/i,                  // "see:" (reference)
      /cf\.\s*/i,                  // "cf." (reference)
      /referenced?\s+in\s*/i,      // "referenced in"
      /quoted\s+in\s*/i,           // "quoted in"
      /accord(ing|s?)\s+to\s*/i,   // "according to"
      /chapter\s+\d+:\s*\d+/i,     // Bible verse reference
      /verse\s+\d+/i,              // verse reference
      /psalm\s+\d+/i,              // Psalm reference
    ];

    // Check if any non-event pattern matches
    for (const pattern of nonEventPatterns) {
      if (pattern.test(passage)) {
        return false;
      }
    }

    // Check if passage starts with a quote (likely a quote, not an event)
    const trimmed = passage.trim();
    if (trimmed.match(/^["'\u201C\u201D]/) && trimmed.length < 200) {
      // Short quoted passage is likely a quote, not an event
      return false;
    }

    return true;
  };

  const events = data.entities.filter(e =>
    (e.node_type.toLowerCase().includes('event') || e.node_type === 'EVENT') && isActualEvent(e)
  ).map(addName);

  const people = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('person') ||
    e.node_type === 'PEOPLE'
  ).map(addName);

  const places = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('place') ||
    e.node_type === 'PLACE'
  ).map(addName);

  const teachings = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('teaching') ||
    e.node_type === 'TEACHING' ||
    e.node_type === 'CONCEPT'  // Map CONCEPT to TEACHINGS
  ).map(addName);

  const institutions = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('institution') ||
    e.node_type === 'INSTITUTION' ||
    e.node_type === 'ORGANIZATION'
  ).map(addName);

  const communities = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('community') ||
    e.node_type === 'COMMUNITY'
  ).map(addName);

  const concepts = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('concept') ||
    e.node_type === 'CONCEPT'
  ).map(addName);

  const documents = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('document') ||
    e.node_type === 'DOCUMENT'
  ).map(addName);

  const quotes = data.entities.filter(e =>
    e.node_type.toLowerCase().includes('quote') ||
    e.node_type === 'QUOTE'
  ).map(addName);

  // Extract years from events for timeline (only events with valid years)
  const timelineEvents = events
    .map(e => {
      // Try multiple fields for year/date
      const yearCe = e.extracted_data?.year_ce;
      const dateStr = e.extracted_data?.date || e.extracted_data?.year || '';
      const yearMatch = dateStr.match(/(\d{4})/);

      let year = null;
      if (yearCe && typeof yearCe === 'number') {
        year = yearCe;
      } else if (yearCe && typeof yearCe === 'string') {
        const match = yearCe.match(/(\d{4})/);
        year = match ? parseInt(match[1]) : null;
      } else if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }

      return {
        ...e,
        passage: cleanPassage(e.passage || ''),
        year,
        date: dateStr || yearCe?.toString() || ''
      };
    })
    .filter((e): e is typeof e & { year: number } => e.year !== null && e.year >= 1700 && e.year <= 2020)
    .sort((a, b) => a.year - b.year);

  // All events with year data for display (events don't need years to be shown)
  const allEvents = events
    .map(e => {
      // Try multiple fields for year/date
      const yearCe = e.extracted_data?.year_ce;
      const dateStr = e.extracted_data?.date || e.extracted_data?.year || '';
      const yearMatch = dateStr.match(/(\d{4})/);

      let year = null;
      if (yearCe && typeof yearCe === 'number') {
        year = yearCe;
      } else if (yearCe && typeof yearCe === 'string') {
        const match = yearCe.match(/(\d{4})/);
        year = match ? parseInt(match[1]) : null;
      } else if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }

      // Clean passage and create name
      let passage = cleanPassage(e.passage || '');
      // Remove leading/trailing whitespace and quotes
      passage = passage.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '');
      // Capitalize first letter
      passage = passage.charAt(0).toUpperCase() + passage.slice(1);
      // Truncate to reasonable length
      const name = passage.length > 120 ? passage.substring(0, 117) + '...' : passage;

      return {
        ...e,
        passage,
        year,
        name: name || 'Unknown Event'
      };
    });

  // Extract unique topics/keywords for alphabetical navigation
  const topicWords = new Set<string>();

  // Common words to exclude
  const stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','she','her','been','than','its','were','said','each','which','their','time','will','about','would','there','could','other','more','when','into','some','them','only','over','such','your','how','then','also','first','been','even','most','made','after','under','while','where','just','being','said','because','these','those','every','through','during','before','being','again','still','against','while','where','whom','whether','both','either','neither','already','always','never','often','once','twice','three','four','five','seven','eight','nine','ten','eleven','twelve','twenty','thirty','forty','fifty','hundred','thousand']);

  data.entities.forEach(e => {
    // Extract from passage text and name (since entities only have name/aliases after deduplication)
    const text = ((e as any).name ? `${e.passage || ''} ${(e as any).name || ''}` : e.passage || '').toLowerCase();

    // Extract meaningful words (4+ letters)
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    words.forEach((w: string) => {
      // Capitalize first letter
      const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
      if (!stopWords.has(w) && !stopWords.has(capitalized)) {
        topicWords.add(capitalized);
      }
    });
  });

  const topics = Array.from(topicWords).sort();

  // Extract geolocated places
  const geolocatedPlaces = places
    .filter(p => p.extracted_data?.latitude && p.extracted_data?.longitude)
    .map(p => ({
      ...p,
      lat: parseFloat(p.extracted_data.latitude),
      lng: parseFloat(p.extracted_data.longitude),
      name: p.extracted_data?.name || p.extracted_data?.location || 'Unknown'
    }));

  // All places (not just geolocated)
  const allPlaces = places.map(p => ({
    ...p,
    name: p.extracted_data?.name || p.extracted_data?.location || p.passage?.substring(0, 50) || 'Unknown'
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Add name property to all entities for consistent display
  const allEntities = data.entities.map(addName);

  return {
    events: timelineEvents,
    allEvents,  // All events for counting/browsing, regardless of year data
    people,
    places: geolocatedPlaces,
    allPlaces,
    topics,
    teachings,
    institutions,
    communities,
    concepts,
    documents,
    quotes,
    allEntities
  };
}

export const ERAS = [
  {
    id: 'rashab',
    name: 'The Rashab Era',
    years: '1882-1920',
    startYear: 1882,
    endYear: 1920,
    color: '#8B5CF6',
    description: 'Leadership of Rabbi Shalom Dovber (the Rashab)'
  },
  {
    id: 'rayatz-early',
    name: 'Rebbe Rayatz: Early Years',
    years: '1920-1927',
    startYear: 1920,
    endYear: 1927,
    color: '#3B82F6',
    description: 'Leadership begins in communist Russia'
  },
  {
    id: 'exile',
    name: 'Exile & Escape',
    years: '1927-1940',
    startYear: 1927,
    endYear: 1940,
    color: '#EF4444',
    description: 'Arrest, exile to Riga, escape from Warsaw'
  },
  {
    id: 'america',
    name: 'Rebuilding in America',
    years: '1940-1950',
    startYear: 1940,
    endYear: 1950,
    color: '#F59E0B',
    description: 'Arrival in America and rebuilding'
  }
];
