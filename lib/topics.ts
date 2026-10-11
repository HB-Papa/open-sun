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

export const TYPES = ['Article', 'Book', 'Chapter', 'Essay', 'Fiction', 'Guide', 'Report', 'Journal', 'Thesis'] as const;

export const TYPE_COLORS: Record<string, string> = {
  Article: 'var(--color-chip-leaf)',
  Essay: 'var(--color-pale-sun)',
  Book: 'var(--color-chip-sky)',
  Fiction: 'var(--color-chip-rose)',
  Guide: 'var(--color-chip-clay)',
  Report: 'var(--color-chip-clay)',
  Chapter: 'var(--color-chip-sky)',
  Journal: 'var(--color-chip-leaf)',
  Thesis: 'var(--color-chip-leaf)',
};

export const LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
};
