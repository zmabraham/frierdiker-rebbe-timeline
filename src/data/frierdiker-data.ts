// Frierdiker Rebbe Timeline Data
export const FRIERDIKER_DATA_URL = '/data/frierdiker_entities.json';

export interface FrierdikerEntity {
  id?: string;
  type?: string;
  name?: string;
  name_en?: string;
  name_he?: string;
  title?: string;
  title_en?: string;
  year_ce?: number;
  event_type?: string;
  place?: string;
  description?: string;
  roles?: string[];
  key_relationships?: Array<{ person: string; type: string }>;
}

export interface FrierdikerData {
  persons?: Array<{
    name_en: string;
    name_he?: string;
    name_variants?: string[];
    roles?: string[];
    birth_year?: number;
    death_year?: number;
    description: string;
    key_relationships?: Array<{ person: string; type: string }>;
  }>;
  places?: Array<{
    name_en: string;
    place_type?: string;
    country?: string;
    years_relevant?: number[];
    description?: string;
  }>;
  events?: Array<{
    title_en: string;
    event_type: string;
    year_ce: number;
    month_ce?: number;
    day_ce?: number;
    place?: string;
    participants?: string[];
    description: string;
    significance?: string;
  }>;
  institutions?: Array<{
    name_en: string;
    institution_type: string;
    founded_year?: number;
    founded_place?: string;
    description?: string;
  }>;
  communities?: Array<{
    name_en: string;
    community_type: string;
    key_figures?: string[];
    description?: string;
  }>;
  concepts?: Array<{
    name_en: string;
    name_he?: string;
    category?: string;
    definition_short: string;
  }>;
  teachings?: Array<{
    text_english: string;
    teaching_type: string;
    attributed_to_name: string;
    date_said_year?: number;
    place?: string;
    occasion?: string;
  }>;
}

// Entity interface compatible with timeline components
export interface Entity {
  node_type: string;
  passage: string;
  extracted_data: Record<string, any>;
  merge_count?: number;
  chapter?: number;
  paragraph?: number;
  book_link?: string;
  name?: string;
  year: number | null;
  date?: string;
  id?: string;
}

// Raw input data interface (array of category objects)
interface RawFrierdikerData {
  persons?: any[];
  places?: any[];
  events?: any[];
  institutions?: any[];
  communities?: any[];
  concepts?: any[];
  teachings?: any[];
}

// Helper to generate entity ID
const generateId = (prefix: string, name: string, index: number): string => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${prefix}-${slug}-${index}`;
};

// Process the Frierdiker data for timeline display
export function processTimelineData(rawData: RawFrierdikerData[] | FrierdikerData): {
  events: Entity[];
  allEvents: Entity[];
  people: Entity[];
  places: Entity[];
  allPlaces: Entity[];
  topics: string[];
  teachings: Entity[];
  institutions: Entity[];
  communities: Entity[];
  concepts: Entity[];
  documents: Entity[];
  quotes: Entity[];
  allEntities: Entity[];
} {
  // Normalize input to array format
  const dataEntries = Array.isArray(rawData) ? rawData : [rawData];

  // Aggregate all data from array entries
  const allPersons: any[] = [];
  const rawPlaces: any[] = [];
  const rawEvents: any[] = [];
  const allInstitutions: any[] = [];
  const allCommunities: any[] = [];
  const allConcepts: any[] = [];
  const allTeachings: any[] = [];

  dataEntries.forEach(entry => {
    if (entry.persons) allPersons.push(...entry.persons);
    if (entry.places) rawPlaces.push(...entry.places);
    if (entry.events) rawEvents.push(...entry.events);
    if (entry.institutions) allInstitutions.push(...entry.institutions);
    if (entry.communities) allCommunities.push(...entry.communities);
    if (entry.concepts) allConcepts.push(...entry.concepts);
    if (entry.teachings) allTeachings.push(...entry.teachings);
  });

  // Convert persons to Entity format
  const people: Entity[] = allPersons.map((p, i) => ({
    node_type: 'PEOPLE',
    passage: p.description || `${p.name_en}${p.name_he ? ' (' + p.name_he + ')' : ''}`,
    name: p.name_en,
    year: null,
    extracted_data: {
      name: p.name_en,
      name_he: p.name_he,
      name_variants: p.name_variants,
      roles: p.roles,
      birth_year: p.birth_year,
      death_year: p.death_year,
      key_relationships: p.key_relationships,
    },
    id: generateId('P', p.name_en, i),
  }));

  // Convert places to Entity format
  const places: Entity[] = rawPlaces.map((p, i) => ({
    node_type: 'PLACE',
    passage: p.description || p.name_en,
    name: p.name_en,
    year: null,
    extracted_data: {
      name: p.name_en,
      place_type: p.place_type,
      country: p.country,
      years_relevant: p.years_relevant,
      description: p.description,
    },
    id: generateId('L', p.name_en, i),
  }));

  // Convert events to Entity format
  const events: Entity[] = rawEvents.map((e, i) => ({
    node_type: 'EVENT',
    passage: e.description || e.title_en,
    name: e.title_en,
    year: e.year_ce,
    date: e.year_ce?.toString(),
    extracted_data: {
      title_en: e.title_en,
      event_type: e.event_type,
      year_ce: e.year_ce,
      month_ce: e.month_ce,
      day_ce: e.day_ce,
      place: e.place,
      participants: e.participants,
      description: e.description,
      significance: e.significance,
    },
    id: generateId('E', e.title_en, i),
  }));

  // Convert institutions to Entity format
  const institutions: Entity[] = allInstitutions.map((inst, i) => ({
    node_type: 'INSTITUTION',
    passage: inst.description || inst.name_en,
    name: inst.name_en,
    year: null,
    extracted_data: {
      name: inst.name_en,
      name_he: inst.name_he,
      institution_type: inst.institution_type,
      founded_year: inst.founded_year,
      founded_place: inst.founded_place,
      description: inst.description,
    },
    id: generateId('I', inst.name_en, i),
  }));

  // Convert communities to Entity format
  const communities: Entity[] = allCommunities.map((c, i) => ({
    node_type: 'COMMUNITY',
    passage: c.description || c.name_en,
    name: c.name_en,
    year: null,
    extracted_data: {
      name: c.name_en,
      community_type: c.community_type,
      key_figures: c.key_figures,
      description: c.description,
    },
    id: generateId('C', c.name_en, i),
  }));

  // Convert concepts to Entity format
  const concepts: Entity[] = allConcepts.map((c, i) => ({
    node_type: 'CONCEPT',
    passage: c.definition_short,
    name: c.name_en,
    year: null,
    extracted_data: {
      name_en: c.name_en,
      name_he: c.name_he,
      category: c.category,
      definition_short: c.definition_short,
    },
    id: generateId('CON', c.name_en, i),
  }));

  // Convert teachings to Entity format
  const teachings: Entity[] = allTeachings.map((t, i) => ({
    node_type: 'TEACHING',
    passage: t.text_english,
    name: t.text_english.substring(0, 80) + (t.text_english.length > 80 ? '...' : ''),
    year: t.date_said_year || null,
    extracted_data: {
      text_english: t.text_english,
      teaching_type: t.teaching_type,
      attributed_to_name: t.attributed_to_name,
      date_said_year: t.date_said_year,
      place: t.place,
      occasion: t.occasion,
    },
    id: generateId('T', t.attributed_to_name, i),
  }));

  // Timeline events (only those with valid years)
  const timelineEvents = events
    .filter(e => e.year && e.year >= 1800 && e.year <= 2000)
    .sort((a, b) => (a.year || 0) - (b.year || 0));

  // All places with names
  const allPlaces = places.map(p => ({
    ...p,
    name: p.extracted_data?.name || p.passage?.substring(0, 50) || 'Unknown'
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Extract topics from descriptions
  const topicWords = new Set<string>();
  const stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','she','her','been','than','its','were','said','each','which','their','time','will','about','would','there','could','other','more','when','into','some','them','only','over','such','your','how','then','also','first','been','even','most','made','after','under','while','where','just','being','said','because','these','those','every','through','during','before','being','again','still','against','while','where','whom','whether','both','either','neither','already','always','never','often','once','twice','three','four','five','seven','eight','nine','ten','eleven','twelve','twenty','thirty','forty','fifty','hundred','thousand']);

  [...people, ...events, ...institutions, ...concepts].forEach(e => {
    const text = `${e.passage || ''} ${e.name || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(w => {
      const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
      if (!stopWords.has(w) && !stopWords.has(capitalized)) {
        topicWords.add(capitalized);
      }
    });
  });

  const topics = Array.from(topicWords).sort();

  const allEntities: Entity[] = [
    ...people,
    ...places,
    ...events,
    ...institutions,
    ...communities,
    ...concepts,
    ...teachings,
  ];

  return {
    events: timelineEvents,
    allEvents: events,
    people,
    places: [], // No geolocation data available
    allPlaces,
    topics,
    teachings,
    institutions,
    communities,
    concepts,
    documents: [],
    quotes: [],
    allEntities,
  };
}

// Eras for Frierdiker Rebbe timeline
export const ERAS = [
  {
    id: 'early-life',
    name: 'Early Life & Education',
    years: '1880-1897',
    startYear: 1880,
    endYear: 1897,
    color: '#8B5CF6',
    description: 'Birth, childhood, and early education in Lubavitch'
  },
  {
    id: 'rashab-leadership',
    name: 'Under the Rashab',
    years: '1897-1920',
    startYear: 1897,
    endYear: 1920,
    color: '#3B82F6',
    description: 'Working alongside his father, the Fifth Rebbe'
  },
  {
    id: 'leadership-begins',
    name: 'Leadership in Russia',
    years: '1920-1927',
    startYear: 1920,
    endYear: 1927,
    color: '#10B981',
    description: 'Becomes the Sixth Rebbe amid communist oppression'
  },
  {
    id: 'arrest-exile',
    name: 'Arrest & Exile',
    years: '1927-1934',
    startYear: 1927,
    endYear: 1934,
    color: '#EF4444',
    description: 'Imprisonment, exile to Riga, and continued persecution'
  },
  {
    id: 'poland',
    name: 'Poland Years',
    years: '1934-1939',
    startYear: 1934,
    endYear: 1939,
    color: '#F59E0B',
    description: 'Rebuilding in Otwock and Warsaw'
  },
  {
    id: 'wwii-escape',
    name: 'WWII & Escape',
    years: '1939-1940',
    startYear: 1939,
    endYear: 1940,
    color: '#DC2626',
    description: 'Nazi invasion and miraculous escape to America'
  },
  {
    id: 'america-rebuild',
    name: 'Rebuilding in America',
    years: '1940-1950',
    startYear: 1940,
    endYear: 1950,
    color: '#0EA5E9',
    description: 'Establishing new headquarters in Brooklyn'
  },
  {
    id: 'final-years',
    name: 'Final Years',
    years: '1950-1968',
    startYear: 1950,
    endYear: 1968,
    color: '#6366F1',
    description: 'Legacy and transition to the Rebbe'
  },
];
