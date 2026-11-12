# Open Sun metadata application profile

This document describes the record that Open Sun keeps for each item in the library. It says what each field means, whether it is required, how to enter it, and how it maps to three outside standards: Dublin Core, schema.org and MARC 21.

It describes the schema as it stands today. Problems with the schema, and proposed fixes, are listed under "Known issues" at the end. Nothing in that section is current practice until the schema changes.

## Scope and conventions

- **One record per work.** Each record is a Markdown file in `content/library/`. The fields sit in YAML front matter at the top of the file. The body holds the summary.
- **The file name is the record identifier.** It follows the pattern `familyname-year-short-title.md`, for example `barron-gafford-2019-agrivoltaics.md`. The name without `.md` becomes the page address (`/library/barron-gafford-2019-agrivoltaics`). Do not rename a file after it is published.
- **Open Sun describes works it does not hold.** Every record points to a free copy on someone else's site. The record is closer to an index entry than to a catalog record for a held copy.
- **Where the rules live in code.** `lib/content.ts` reads the files, `lib/types.ts` defines the record, `lib/topics.ts` holds the controlled lists, `lib/cite.ts` builds citations, and `lib/metadata.ts` builds the embedded metadata described below.
- **Dublin Core** terms are written as `dc:` for the 15 core elements and `dcterms:` for the wider DCMI Metadata Terms.
- **MARC 21** mappings are for the bibliographic format. They are a crosswalk on paper. Open Sun does not yet export MARC records. Mappings marked "unverified" have not been checked against the current MARC documentation or tested in a system.

## Fields

### Descriptive fields

| Field | Required | Definition | Entry rule | Example (file) |
|---|---|---|---|---|
| `title` | Yes | The title of the work, with its subtitle. | Copy from the work itself. Use headline capitals for English titles, as the publisher gives them. Separate title and subtitle with a colon. Keep titles in their original language. | `"Free, Fair and Alive: The Insurgent Power of the Commons"` (`bollier-2019-free-fair-alive.md`) |
| `citation_title` | No | The title in sentence case, for APA citations. | Add only when the automatic sentence-casing in `lib/cite.ts` gets a proper noun wrong. | `"The Solarpunk Conference journal: 2023 conference"` (`solarpunk-conference-2023-journal.md`) |
| `authors` | Yes | The people or groups responsible for the work, in the order the work lists them. | A list. Write personal names in natural order ("Rhys Williams"). When the family name has more than one word and no particle, write "Family, Given" ("Roscam Abbing, Roel"). Copy the form of name used on the work, including middle initials. | `["Kris De Decker", "Marie Otsuka", "Roscam Abbing, Roel"]` (`de-decker-2018-low-tech-website.md`) |
| `organization` | No | Says the names in `authors` are groups, not people. | `true` when every name in `authors` is a group. Leave out otherwise. A record cannot mix people and groups. | `organization: true` (`ala-2024-core-values.md`) |
| `edited` | No | Says the names in `authors` are editors of the whole work. | `true` for an edited book entered under its editors. Leave out otherwise. | `edited: true` (`kothari-2019-pluriverse.md`) |
| `editors` | No | Editors named in addition to the authors. | A list, same name rules as `authors`. Use when the work has both an author and editors. | `["Ayesha Vemuri", "Darin Barney"]` (`after-oil-2022-solarities-energy-justice.md`) |
| `year` | Yes | The year the work was published. | Four digits. Use `null` for an undated web page. For an article published online ahead of print, use the year of the issue it appears in. | `2019`, or `null` (`sli-sustainable-library-certification.md`) |
| `type` | Yes | The kind of work. | One value from the list in `lib/topics.ts`: Article, Book, Chapter, Essay, Fiction, Guide, Report, Journal, Thesis, Preprint. Defaults to Article if left out. | `type: Chapter` (`silva-2025-libraries-of-things-sharing-economies.md`) |
| `venue` | Yes | Where the work was published. | For an article, the journal title. For a book, the publisher. For a chapter, the book title with the publisher in parentheses. For a report, the issuing body or series. For a thesis, the degree and institution. | `"Nature Sustainability"` (`barron-gafford-2019-agrivoltaics.md`) |
| `volume` | No | The volume number of the journal. | Digits in quotes. Articles only. | `"2"` (`pereira-2020-nature-futures-framework.md`) |
| `issue` | No | The issue number of the journal. | Digits in quotes. May appear without a volume. | `"76"` (`rivero-vadillo-2022-tecnofilia-solarpunk.md`) |
| `pages` | No | The page range, or the article number for journals that do not use pages. | A range with an en dash, in quotes. A single value is treated as an article number. | `"848–855"` (`barron-gafford-2019-agrivoltaics.md`), `"7180"` (`baden-2020-libraries-of-things.md`) |
| `doi` | No | The Digital Object Identifier. | The bare DOI, with no `https://doi.org/` in front. Required whenever the work has one. | `10.1038/s41893-019-0364-5` (`barron-gafford-2019-agrivoltaics.md`) |
| `url` | Yes | The link to a free, legal copy of the full text. | Prefer the publisher's open copy. If the publisher's copy is paywalled, link to a repository copy and say so in `license`. | `https://www.osti.gov/servlets/purl/1567040` (`barron-gafford-2019-agrivoltaics.md`) |
| `license` | Yes | The terms under which the copy at `url` may be read and reused. | A Creative Commons license written as "CC BY 4.0", or "Free to read" when the work is free to read but carries no open license. Defaults to "Free to read". | `"CC BY-NC-SA 4.0"` (`kothari-2019-pluriverse.md`) |
| `language` | Yes | The language of the work. | A two-letter ISO 639-1 code. Defaults to `en`. | `es` (`rivero-vadillo-2022-tecnofilia-solarpunk.md`) |
| `topics` | Yes | What the work is about. | Two to four terms from the fixed list of 19 in `lib/topics.ts`. Put the most important first, since it is used for the breadcrumb. | `[agriculture, community-energy, ecology]` (`barron-gafford-2019-agrivoltaics.md`) |

### Administrative fields

| Field | Required | Definition | Entry rule | Example (file) |
|---|---|---|---|---|
| `date_added` | Yes | The date the record joined the library. | `YYYY-MM-DD`. Drives New Arrivals, the RSS feed and the sitemap. | `2026-10-11` (`ala-2024-core-values.md`) |
| `source` | Yes | How the record was found. | `curated` when a person chose it. `agent` when the weekly update script proposed it. | `source: curated` (`ala-2024-core-values.md`) |
| `reviewed` | Yes | Whether a person has checked the record. | `true` or `false`. Records marked `false` do not appear on the live site. | `reviewed: true` (`ala-2024-core-values.md`) |
| `summary_status` | Yes | Whether a person has edited the summary. | `draft` or `edited`. | `summary_status: edited` (`ala-2024-core-values.md`) |

### Content fields

| Field | Required | Definition | Entry rule | Example (file) |
|---|---|---|---|---|
| Summary (the body) | Yes | A plain-language summary written for Open Sun. It is not the author's abstract. | Two or three sentences. Describe what the work says. Do not copy the abstract. | "A short collective book on what it would mean to organize societies around solar energy..." (`after-oil-2022-solarities-energy-justice.md`) |
| Why it matters (in the body) | No | One line on why the work belongs in the library. | Starts with `**Why it matters:**` after the summary. | "A free, readable book that keeps the 'justice' in solar futures front and center." (same file) |
| `field_note` | No | A reflection question shown on the item page. | A `question`, a list of `options`, and the position of the `answer`, counting from 0. | `question: "How does Solarities treat solar power?"` (same file) |

## Crosswalk

| Field | Dublin Core | schema.org | MARC 21 |
|---|---|---|---|
| File name (slug) | `dc:identifier` | `url` | 001 control number |
| `title` | `dc:title` | `name` | 245 $a and $b |
| `citation_title` | None. It is a display form of the title. | None | None |
| `authors` (people) | `dc:creator` | `author` as `Person` | 100 for the first, 700 for the rest |
| `authors` with `organization: true` | `dc:creator` | `author` as `Organization` | 110 for the first, 710 for the rest |
| `authors` with `edited: true` | `dc:contributor` | `editor` | 700 with $e editor. No 1XX field, so the title is the main entry. |
| `editors` | `dc:contributor` | `editor` | 700 with $e editor |
| `year` | `dc:date`, or `dcterms:issued` | `datePublished` | 264 #1 $c and 008 positions 07-10 |
| `type` | `dc:type`. Always "Text" from the DCMI Type Vocabulary. The local value has no DCMI equivalent. | `@type`. See the table below. | Leader positions 06-07. 502 for a thesis. 655 for a genre term (unverified). |
| `venue` (journal) | `dcterms:isPartOf`, or `dcterms:bibliographicCitation` | `isPartOf` as `Periodical` | 773 $t |
| `venue` (publisher) | `dc:publisher` | `publisher` | 264 #1 $b |
| `venue` (book that holds a chapter) | `dcterms:isPartOf` | `isPartOf` as `Book` | 773 $t |
| `venue` (series or report number) | `dcterms:isPartOf` | None used | 490 (unverified for report numbers, which may belong in 088) |
| `venue` (degree and institution) | None | None used | 502 |
| `volume`, `issue`, `pages` (article) | `dcterms:bibliographicCitation` | `PublicationVolume`, `PublicationIssue`, `pageStart`, `pageEnd` | 773 $g |
| `doi` | `dc:identifier` as a URL | `identifier` and `sameAs` | 024 7# $a with $2 doi |
| `url` | `dc:identifier` when there is no DOI | `sameAs` | 856 40 $u |
| `license` | `dc:rights`, or `dcterms:license` for a license URL | `license` (URL only) and `isAccessibleForFree` | 540 $a with $u for a license URL. 506 for the open access note (unverified which subfields are best). |
| `language` | `dc:language` | `inLanguage` | 008 positions 35-37 and 041 $a. MARC uses three-letter codes, so `es` becomes `spa`. |
| `topics` | `dc:subject` | `keywords` | 653, or 650 #7 with $2 local (unverified which is better practice for a small local list) |
| Summary | `dc:description` | `description` | 520 $a |
| Why it matters | `dc:description` | None used | 520 or 500 (unverified) |
| `field_note` | None | None | None |
| `date_added` | None exact. It is administrative. | None used | 008 positions 00-05, date entered on file |
| `source` | None | None | None. A local 9XX field in practice (unverified). |
| `reviewed`, `summary_status` | None | None | None. These are workflow flags. |

### How `type` maps to schema.org

| `type` | schema.org `@type` | Note |
|---|---|---|
| Article | `ScholarlyArticle` | |
| Preprint | `ScholarlyArticle` | schema.org has no preprint type. |
| Essay | `Article` | Essays here are mostly magazine and web pieces, not peer reviewed. |
| Book | `Book` | |
| Chapter | `Chapter` | |
| Report | `Report` | |
| Thesis | `Thesis` | |
| Journal | `Periodical` | In the list but not used by any record yet. |
| Fiction, Guide, anything else | `CreativeWork` | A safe fallback. |

## Embedded metadata on item pages

Each item page carries three sets of machine-readable metadata, built by `lib/metadata.ts`.

1. **schema.org JSON-LD** in a `<script type="application/ld+json">` element.
2. **Highwire Press tags** (the `citation_*` tags that Google Scholar and Zotero read): `citation_title`, `citation_author`, `citation_publication_date`, `citation_journal_title`, `citation_volume`, `citation_issue`, `citation_firstpage`, `citation_lastpage`, `citation_doi`, `citation_language`.
3. **Dublin Core tags**: `DC.title`, `DC.creator`, `DC.contributor`, `DC.date`, `DC.type`, `DC.language`, `DC.identifier`, `DC.rights`.

A tag appears only when the record supports it. The rules that hold tags back are these.

- **Journal title, volume and issue** appear only for a record with `type: Article` that has a volume or an issue, and whose `venue` has no note in parentheses. This keeps conference names and publishers out of the journal tag.
- **Publisher** appears in the JSON-LD only for a Book whose `venue` is a single plain name, or for a group that published its own work (where `venue` matches the one name in `authors`).
- **First and last page** appear only when `pages` is a range. An article number is left out.
- **License** appears as a URL in the JSON-LD only for Creative Commons 4.0 licenses and CC0. "Free to read" values are not licenses, so they appear only as text in `DC.rights`.
- **Editors** of an edited book appear as `editor` and `DC.contributor`. An edited book therefore has no `citation_author` tag.
- **The summary** is published as `description`, not `abstract`, because Open Sun wrote it.
- **Group names** are never reordered. Personal names written "Family, Given" are turned into natural order.

Tags left out on purpose: `citation_abstract_html_url`, `citation_pdf_url` and `citation_public_url`. Open Sun does not host the abstract or the full text, and pointing those tags at an Open Sun page could mislead an indexer. The `<link rel="schema.DC">` element that the Dublin Core HTML convention asks for is also missing, because the site framework's metadata interface cannot add it.

## Known issues and proposed fixes

Everything in this section is a proposal. None of it is current practice.

### 1. `venue` holds too many kinds of information

**Problem.** One field holds journal titles, publishers, the book a chapter sits in, series and report numbers, degrees, and notes. Examples: "Understanding the Urban Sharing Economy (Edward Elgar)" (`silva-2025-libraries-of-things-sharing-economies.md`), "IMF Working Paper 2023/169" (`black-2023-imf-fossil-fuel-subsidies.md`), "Master's thesis, Stockholm Resilience Centre, Stockholm University" (`rossi-2023-pathways-multispecies-cities.md`), "SocArXiv (preprint, not peer reviewed)". Software cannot tell these apart, so the embedded metadata has to leave most of them out.

**Proposed fix.** Replace `venue` with separate optional fields: `container_title` (journal, or the book for a chapter), `publisher`, `series` and `series_number`, `institution` and `degree` (theses), and `note`. Add `issn` and `isbn`. Build the display line from those fields.

### 2. Editors are recorded two ways

**Problem.** `kothari-2019-pluriverse.md` lists its editors in `authors` and sets `edited: true`. `after-oil-2022-solarities-energy-justice.md` keeps a group author in `authors` and lists editors in `editors`. A record cannot say that some names are people and some are groups.

**Proposed fix.** Use one list of contributors, each with a name, a role (`author`, `editor`, `translator`) and a kind (`person` or `organization`). Retire `edited` and `organization`.

### 3. `license` is free text that mixes three things

**Problem.** The field has 14 different values. They mix the license ("CC BY 4.0"), the version of the work ("author manuscript", "preprint") and where the copy is hosted ("PubMed Central", "Elsevier open archive"). "Free to read" is not a license.

**Proposed fix.** Split it into four fields.

| Proposed field | Controlled values | What it replaces |
|---|---|---|
| `license` | SPDX identifiers: `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-NC-4.0`, `CC-BY-ND-4.0`, `CC-BY-NC-SA-4.0`, `CC-BY-NC-ND-4.0`, `CC0-1.0`, or `none` | The "CC ..." values. The license URL is worked out from the identifier. |
| `rights_status` | `open-license`, `public-domain`, `in-copyright-free-to-read` | "Free to read" becomes `license: none` with `in-copyright-free-to-read`. |
| `version` | The NISO Journal Article Version terms: `VoR` (version of record, the default), `AM` (accepted manuscript), `SMUR` (submitted manuscript under review) or `AO` (author's original) | "(author manuscript)" becomes `AM`. "(preprint)" becomes `SMUR` or `AO` after checking the item. |
| `access_note` | Free text | "PubMed Central", "Elsevier open archive", "read online only" |

Mapping of today's values:

| Today | `license` | `rights_status` | `version` | `access_note` |
|---|---|---|---|---|
| CC BY 4.0 (25), CC BY-SA 4.0 (1), CC BY-NC 4.0 (4), CC BY-ND 4.0 (2), CC BY-NC-SA 4.0 (7), CC BY-NC-ND 4.0 (12) | The matching SPDX identifier | `open-license` | `VoR` | |
| CC BY-NC-ND 4.0 (author manuscript) (1) | `CC-BY-NC-ND-4.0` | `open-license` | `AM` | |
| Free to read (21) | `none` | `in-copyright-free-to-read` | `VoR` | |
| Free to read online (1) | `none` | `in-copyright-free-to-read` | `VoR` | "Read online only" |
| Free to read (author manuscript) (6) | `none` | `in-copyright-free-to-read` | `AM` | |
| Free to read (preprint) (1) | `none` | `in-copyright-free-to-read` | `SMUR` or `AO` | |
| Free to read (U.S. government work) (1) | `none` | `public-domain`, after checking the item | `VoR` | |
| Free to read (PubMed Central) (1) | `none` | `in-copyright-free-to-read` | Check the item | "PubMed Central" |
| Free to read (Elsevier open archive) (1) | `none` | `in-copyright-free-to-read` | `VoR` | "Elsevier open archive" |

Two cautions. Each "VoR" above is a default to confirm against the item, not a fact. And a U.S. government work is in the public domain only when federal employees wrote it. Reports written by a contractor-run national laboratory may not be, so check before using `public-domain`.

### 4. No name authority

**Problem.** Names are copied from each work, so one person can appear in two forms. "Laura Pereira" (`pereira-2019-imagination-scenario-processes.md`) and "Laura M. Pereira" (`pereira-2020-nature-futures-framework.md`) are the same person. So are "Garry D. Peterson" (`cheok-2025-indigenous-futures-thinking.md`) and "Garry Peterson" (`pereira-2020-nature-futures-framework.md`). Name order is mixed inside one record in `de-decker-2018-low-tech-website.md`. No record carries an ORCID iD.

**Proposed fix.** Keep a small authority file, for example `content/names.yml`, with one entry per person or group: the preferred form, variant forms, and identifiers where they exist (ORCID iD, the Library of Congress Name Authority File or VIAF number, and ROR for organizations). Records keep the name as it appears on the work and point to the authority entry. Add an author index to the site once the file exists.

### 5. `date_added` is the same on every record

**Problem.** All 84 records have `date_added: 2026-10-11`, the date of the first bulk load. `source` is always `curated` and `reviewed` is always `true`. The fields are sound, but so far they record nothing, and New Arrivals cannot tell old from new.

**Proposed fix.** Leave the existing dates alone, since they are true for the first load. From now on, set `date_added` to the day the record is merged. Add an optional `date_modified` for later corrections, and use it for the sitemap.

### 6. No type for conference papers

**Problem.** `alipio-2024-indigenous-data-sovereignty-solarpunk.md` is a conference paper, entered as an Article with the conference name in `venue`. `solarpunk-conference-2023-journal.md` is entered as a Book. "Journal" is in the type list but no record uses it. Fact sheets and news releases are marked only by a note in `venue`.

**Proposed fix.** Add "Conference paper" and "Web page" to the list. Decide whether "Journal" is for whole journals or should be removed. Write a one-line scope note for each type, so that Essay, Guide and Report are told apart the same way every time. Map each type to the COAR Resource Types vocabulary in this document.

### 7. Topics have no scope notes and no outside mapping

**Problem.** The 19 topics are labels only. Nothing says when to use "justice" and when to use "energy-justice". The key `ecology` is shown to readers as "Living land". Topics are not linked to any standard subject vocabulary, and the site does not check a record's topics against the list when it builds.

**Proposed fix.** Write a scope note for each topic: what it covers, what it leaves out, and which topic to use instead. Map each topic to the closest FAST or Library of Congress Subject Heading, and say whether the match is exact, close or broader. Record honestly where no heading fits. Publish the list as a SKOS file. Add a build-time check that fails when a record uses a topic that is not in the list.

### Smaller issues

- **Language codes.** The two-letter codes suit the web. A MARC export needs a lookup table to the three-letter MARC codes.
- **Translated titles.** Records for works in Spanish, Portuguese and Polish have no English translation of the title. Add an optional `title_translated`.
- **Dates.** `year` holds a year only. An optional full `date_published` would help for preprints and web pages. Undated web pages need a `date_accessed`.
