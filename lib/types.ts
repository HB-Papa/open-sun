export interface FieldNote {
  question: string;
  options: string[];
  answer: number;
}

export interface LibraryItem {
  slug: string;
  title: string;
  citationTitle?: string;
  authors: string[];
  organization?: boolean;
  edited?: boolean;
  editors?: string[];
  year: number;
  type: string;
  venue: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url: string;
  license: string;
  language: string;
  topics: string[];
  dateAdded: string;
  source: 'curated' | 'agent';
  reviewed: boolean;
  summaryStatus: 'draft' | 'edited';
  summary: string; // plain text, for cards and search
  summaryHtml: string;
  why: string;
  fieldNote?: FieldNote;
}

/** The slimmer shape sent to the browser for search and cards. */
export type ItemCard = Pick<
  LibraryItem,
  'slug' | 'title' | 'authors' | 'year' | 'type' | 'topics' | 'language' | 'license' | 'dateAdded' | 'summary' | 'edited' | 'organization'
>;

export interface Pathway {
  slug: string;
  title: string;
  blurb: string;
  color: string;
  order: number;
  introHtml: string;
  steps: { slug: string; note: string }[];
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  related: string[]; // library slugs
}
