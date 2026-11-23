import type { License, RightsStatus, Version } from './rights.ts';

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
  year: number | null; // null when the work is undated
  type: string;
  venue: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url: string;
  license: License; // SPDX identifier, or "none"
  rightsStatus: RightsStatus;
  version?: Version; // NISO Journal Article Version, journal articles only
  accessNote?: string;
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

/** "2023", or "n.d." (no date) for undated works. */
export const yearText = (y: number | null) => (y ? String(y) : 'n.d.');

export interface Pathway {
  slug: string;
  title: string;
  blurb: string;
  color: string;
  order: number;
  introHtml: string;
  steps: { slug: string; note: string }[];
}

/** A research guide: how to search for and judge sources on a subject, with links into the library. */
export interface Guide {
  slug: string;
  title: string;
  blurb: string;
  family: string;
  order: number;
  lastReviewed: string;
  html: string;
  relatedPathways: string[];
  relatedItems: string[];
}

/** An information-literacy lesson plan, mapped to frames of the ACRL Framework. */
export interface Lesson {
  slug: string;
  title: string;
  blurb: string;
  order: number;
  level: string;
  duration: string;
  format: string;
  frames: string[];
  outcomes: string[];
  lastReviewed: string;
  html: string;
  relatedGuides: string[];
  relatedItems: string[];
}

/** A published policy or statement about how the library is run. */
export interface Policy {
  slug: string;
  title: string;
  blurb: string;
  lastReviewed: string;
  html: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  related: string[]; // library slugs
  family: 'sun' | 'energy' | 'land' | 'commons' | 'futures'; // idea family (see FAMILIES in lib/topics.ts)
}
