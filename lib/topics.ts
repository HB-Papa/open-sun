// The fixed topic list. The update agent may only suggest topics from here.
export const TOPICS = {
  solarpunk: 'Solarpunk',
  fiction: 'Fiction and storytelling',
  'climate-futures': 'Climate futures',
  'community-energy': 'Community and solar energy',
  'energy-justice': 'Energy justice',
  degrowth: 'Degrowth',
  ecology: 'Living land',
  multispecies: 'Multispecies',
  agriculture: 'Food and farming',
  urban: 'Cities',
  design: 'Design and architecture',
  technology: 'Low-tech and computing',
  'indigenous-futures': 'Indigenous and decolonial futures',
  commons: 'Commons and sharing',
  libraries: 'Libraries',
  resilience: 'Resilience',
  education: 'Education',
  justice: 'Justice',
  governance: 'Governance',
} as const;

export type Topic = keyof typeof TOPICS;
export const topicLabel = (t: string) => (TOPICS as Record<string, string>)[t] ?? t;

/**
 * Idea families: the one meaning colour carries for ideas across the site (topic chips, Field Guide terms,
 * library filters, pathways). Each family is a tint from the palette plus a stronger dot, and always has a
 * written name, so colour is never the only cue.
 */
export const FAMILIES = {
  sun: { label: 'Solarpunk', tint: 'var(--color-pale-sun)', dot: 'var(--dot-sun)' },
  energy: { label: 'Energy', tint: 'var(--color-chip-sky)', dot: 'var(--dot-energy)' },
  land: { label: 'Living land', tint: 'var(--color-chip-leaf)', dot: 'var(--dot-land)' },
  commons: { label: 'Commons and justice', tint: 'var(--color-chip-clay)', dot: 'var(--dot-commons)' },
  futures: { label: 'Futures and stories', tint: 'var(--color-chip-rose)', dot: 'var(--dot-futures)' },
} as const;
export type Family = keyof typeof FAMILIES;

const TOPIC_FAMILY: Record<string, Family> = {
  solarpunk: 'sun',
  'community-energy': 'energy',
  'energy-justice': 'energy',
  technology: 'energy',
  ecology: 'land',
  multispecies: 'land',
  agriculture: 'land',
  degrowth: 'commons',
  commons: 'commons',
  libraries: 'commons',
  education: 'commons',
  justice: 'commons',
  governance: 'commons',
  urban: 'commons',
  design: 'commons',
  resilience: 'commons',
  fiction: 'futures',
  'climate-futures': 'futures',
  'indigenous-futures': 'futures',
};
export const familyOf = (topic: string): Family => TOPIC_FAMILY[topic] ?? 'sun';

export const TYPES = ['Article', 'Book', 'Chapter', 'Essay', 'Fiction', 'Guide', 'Report', 'Journal', 'Thesis', 'Preprint'] as const;


export const LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  pl: 'Polish',
};

/** A language's English name from its code; codes not listed above fall back to the browser's own name for them. */
export function languageName(code: string): string {
  if (LANGUAGES[code]) return LANGUAGES[code];
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
