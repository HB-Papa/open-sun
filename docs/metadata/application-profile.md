# Open Sun metadata application profile

This document describes the record that Open Sun keeps for each item in the library. It says what each field means, whether it is required, how to enter it, and how it maps to three outside standards: Dublin Core, schema.org and MARC 21.

It describes the schema as it stands today. Problems with the schema, and proposed fixes, are listed under "Known issues" at the end. Nothing in that section is current practice until the schema changes.

## Scope and conventions

- **One record per work.** Each record is a Markdown file in `content/library/`. The fields sit in YAML front matter at the top of the file. The body holds the summary.
- **The file name is the record identifier.** It follows the pattern `familyname-year-short-title.md`, for example `barron-gafford-2019-agrivoltaics.md`. The name without `.md` becomes the page address (`/library/barron-gafford-2019-agrivoltaics`). Do not rename a file after it is published.
- **Open Sun describes works it does not hold.** Every record points to a free copy on someone else's site. The record is closer to an index entry than to a catalog record for a held copy.
- **Where the rules live in code.** `lib/content.ts` reads the files, `lib/types.ts` defines the record, `lib/topics.ts` holds the topic and type lists, `lib/rights.ts` holds the rights lists and checks, `lib/cite.ts` builds citations, `lib/metadata.ts` builds the embedded metadata, and `lib/exports.ts` and `lib/marc.ts` build the downloads described under "Data and exports".
- **Dublin Core** terms are written as `dc:` for the 15 core elements and `dcterms:` for the wider DCMI Metadata Terms.
- **MARC 21** mappings are for the bibliographic format. The crosswalk table below is the general mapping. The MARC file Open Sun actually publishes follows the narrower table under "Data and exports". Mappings marked "unverified" have not been checked against the current MARC documentation or tested in a library system.

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
| `url` | Yes | The link to a free, legal copy of the full text. | Prefer the publisher's open copy. If the publisher's copy is paywalled, link to a repository copy and say so in `version` and `access_note`. | `https://www.osti.gov/servlets/purl/1567040` (`barron-gafford-2019-agrivoltaics.md`) |
| `license` | Yes | The license on the copy at `url`. | An SPDX identifier from the list under "Rights and access", or `none` when the copy carries no open license. No default: a missing or unknown value stops the build. | `CC-BY-NC-SA-4.0` (`kothari-2019-pluriverse.md`), `none` (`bollier-2019-free-fair-alive.md`) |
| `rights_status` | Yes | Whether the copy is openly licensed, in the public domain, or in copyright and only free to read. | `open-license`, `public-domain` or `in-copyright-free-to-read`. Must agree with `license` (see "Rights and access"). | `open-license` (`kothari-2019-pluriverse.md`) |
| `version` | No | Which version of a journal article the copy at `url` is. | A NISO Journal Article Version term: `AO`, `SMUR`, `AM`, `P`, `VoR`, `CVoR` or `EVoR`. Journal articles only (records typed Article or Essay that appeared in a journal). Leave out when not known, and for books, chapters, reports, conference papers and web pages. | `AM` (`barron-gafford-2019-agrivoltaics.md`) |
| `access_note` | No | A short note on where the free copy is hosted, or what still needs checking. | Plain text, a few words, in quotes. Shown on the item page as "About this copy". | `"PubMed Central"` (`hernandez-2015-solar-land-cover-protected-areas.md`) |
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
| `license` | `dcterms:license`, as the Creative Commons deed URL. `none` has no license URL. | `license`, as the deed URL. Left out for `none`. | 540 $a (full license name), $f (short name), $2 `cc`, $0 (deed URL), following the Library of Congress example in the 540 documentation |
| `rights_status` | `dc:rights`. The deed URL when there is one, otherwise a plain statement ("Public domain", or in copyright and free to read). | `isAccessibleForFree: true` for every item. No property says "in copyright" or "public domain" without a URL, so none is used. | 540. `public-domain` follows the Library of Congress example ($a, $f public domain, $2 wikidata, $1 the Wikidata URI). `in-copyright-free-to-read` is $a text only. Every item also gets 506 0# $a Open access $f Unrestricted online access $2 star. |
| `version` | None. Dublin Core has no version term for this. | None used. `version` exists in schema.org but is meant for edition or release numbers, so the NISO term is not put there (unverified whether any property fits). | 500 note, for versions other than VoR (unverified: no MARC field is defined for article versions) |
| `access_note` | None | None | 856 $z public note on the link |
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
- **License** appears as a URL in the JSON-LD and in `DC.rights` whenever `license` is not `none`. For `none`, `DC.rights` holds a plain statement built from `rights_status` and the JSON-LD has no `license`. `version` and `access_note` are not put in the embedded metadata.
- **Editors** of an edited book appear as `editor` and `DC.contributor`. An edited book therefore has no `citation_author` tag.
- **The summary** is published as `description`, not `abstract`, because Open Sun wrote it.
- **Group names** are never reordered. Personal names written "Family, Given" are turned into natural order.

Tags left out on purpose: `citation_abstract_html_url`, `citation_pdf_url` and `citation_public_url`. Open Sun does not host the abstract or the full text, and pointing those tags at an Open Sun page could mislead an indexer. The `<link rel="schema.DC">` element that the Dublin Core HTML convention asks for is also missing, because the site framework's metadata interface cannot add it.

## Rights and access

Four fields say how the free copy at `url` may be read and reused. They replaced the old free-text `license` field in November 2026. `lib/rights.ts` holds the lists and the checks. The site build and `npm run audit` both stop on a value outside the lists.

### Controlled values

| Field | Values | Meaning |
|---|---|---|
| `license` | `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-NC-4.0`, `CC-BY-ND-4.0`, `CC-BY-NC-SA-4.0`, `CC-BY-NC-ND-4.0`, `CC0-1.0`, `none` | SPDX license identifiers. Only version 4.0 Creative Commons licenses and CC0 1.0 are listed, because earlier versions have country ports that an identifier alone does not pin down. Add an identifier to `LICENSES` in `lib/rights.ts` before using it. |
| `rights_status` | `open-license` | The copy carries an open license. |
| | `public-domain` | The work is in the public domain, or dedicated to it with CC0. |
| | `in-copyright-free-to-read` | Free to read online, but no open license. Read, cite and link, don't repost. |
| `version` | `AO` author's original, `SMUR` submitted manuscript under review, `AM` accepted manuscript, `P` proof, `VoR` version of record, `CVoR` corrected version of record, `EVoR` enhanced version of record | NISO RP-8-2008, Journal Article Versions. Describes the copy at `url`, not the work. |
| `access_note` | Free text | Where the copy is hosted, or what needs checking. |

### Rules

- `license` and `rights_status` must agree. A CC BY family license needs `open-license`. `CC0-1.0` takes `public-domain` (or `open-license`). `none` takes `public-domain` or `in-copyright-free-to-read`, never `open-license`.
- Record the license of the copy you link to, not of another copy. A preprint server copy under CC BY does not make the publisher's copy CC BY, or the other way round.
- `version` is for journal articles only, which Open Sun types as Article or Essay. Leave it out for conference papers, books, chapters, reports, web essays and preprints that are not tied to a journal article, and whenever you can't tell. Never assume `VoR`.
- Call a work `public-domain` only after checking. A U.S. government work is in the public domain only when federal employees wrote it as part of their job. Reports written by contractor staff, including national laboratories run by contractors, usually are not.
- A Creative Commons license shown on the publisher's own page counts. A short code from an index such as OpenAlex ("cc-by") does not, because it gives no version.

### What readers see

`rightsLabel()` in `lib/rights.ts` builds the label on the item page: the license name ("CC BY-NC-ND 4.0"), or "Free to read" or "Public domain" when there is no license, followed by the version when it is not the version of record: "CC BY-NC-ND 4.0 · Author manuscript", "Free to read · Preprint". `access_note` appears under the read link as "About this copy: ...". The library's License filter groups `CC-BY-4.0` as "CC BY only", every other license as "Creative Commons", and `none` as "Free to read, other terms".

### Conversion of the 84 records (November 2026)

| Old value | Count | `license` | `rights_status` | `version` | `access_note` |
|---|---|---|---|---|---|
| CC BY 4.0 | 25 | `CC-BY-4.0` | `open-license` | `VoR` for 24 journal articles. None for 1 conference paper. | |
| CC BY-SA 4.0 | 1 | `CC-BY-SA-4.0` | `open-license` | None (web essay) | |
| CC BY-NC 4.0 | 4 | `CC-BY-NC-4.0` | `open-license` | `VoR` for 2. None for 2 conference papers. | |
| CC BY-ND 4.0 | 2 | `CC-BY-ND-4.0` | `open-license` | None (The Conversation) | |
| CC BY-NC-SA 4.0 | 7 | `CC-BY-NC-SA-4.0` | `open-license` | `VoR` for 3. None for 3 books and 1 preprint. | |
| CC BY-NC-ND 4.0 | 12 | `CC-BY-NC-ND-4.0` | `open-license` | `VoR` for 8. None for 2 conference papers, 1 book, 1 chapter. | 1 (repository copy of the publisher's PDF) |
| CC BY-NC-ND 4.0 (author manuscript) | 1 | `CC-BY-NC-ND-4.0` | `open-license` | `AM` | Repository name |
| Free to read | 21 | `none` for 19. `CC-BY-4.0` for 2 (see below). | `in-copyright-free-to-read` for 19. `open-license` for 2. | `VoR` for 7 journal articles. None for 14 others. | |
| Free to read online | 1 | `none` | `in-copyright-free-to-read` | None (book) | "Read online only" |
| Free to read (author manuscript) | 6 | `none` | `in-copyright-free-to-read` | `AM` | Repository name |
| Free to read (preprint) | 1 | `none` | `in-copyright-free-to-read` | `AO` | Berkeley Lab copy |
| Free to read (U.S. government work) | 1 | `none` | `in-copyright-free-to-read` | None (report) | Public-domain status not confirmed |
| Free to read (PubMed Central) | 1 | `none` | `in-copyright-free-to-read` | `VoR` | "PubMed Central" |
| Free to read (Elsevier open archive) | 1 | `none` | `in-copyright-free-to-read` | `VoR` | "Elsevier open archive" |

Result: `none` 30, `CC-BY-4.0` 27, `CC-BY-NC-ND-4.0` 13, `CC-BY-NC-SA-4.0` 7, `CC-BY-NC-4.0` 4, `CC-BY-ND-4.0` 2, `CC-BY-SA-4.0` 1. `open-license` 54, `in-copyright-free-to-read` 30. Versions: `VoR` 46, `AM` 7, `AO` 1, none 30.

Decisions that needed a check:

- **Two corrections.** `keenan-2022-solarpunk-contra-capitalist-realism.md` and `ettarh-2018-vocational-awe.md` were "Free to read", but the publishers' own pages state CC BY 4.0 (the article page of Godišnjak za sociologiju, and the site-wide license of In the Library with the Lead Pipe). Both are now `CC-BY-4.0`.
- **The U.S. government work** (`doe-nrel-2021-solar-futures-study.md`). The report was sponsored by the Department of Energy, but its acknowledgements name NREL staff (a laboratory run by a contractor), a private firm and an independent contractor as the primary authors. Public domain could not be confirmed, so it is `in-copyright-free-to-read` with a note.
- **The preprint** (`oshaughnessy-2024-community-solar-equitable-access.md`) is `AO`. The linked Berkeley Lab PDF has the same abstract, word for word, as the version posted on Research Square on 14 November 2023 before peer review. The Nature Energy abstract was later revised (it adds "11 states", "6.1 times" and "23%"). NISO defines `SMUR` as a version that is under formal review. Review ended when the article was accepted, and the lab released this copy in June 2024, after publication. The copy is the authors' own pre-review text, which is `AO`.
- **Author manuscripts** are `AM`. The repository pages confirm "Accepted Manuscript" or "Accepted author manuscript" for `barron-gafford-2019-agrivoltaics.md` (OSTI), `celermajer-2021-multispecies-justice.md` (Edinburgh) and `mathiasson-2024-sustainable-library-sharing.md` (Copenhagen). OpenAlex records the TSpace copy of `stefanelli-2019-indigenous-energy-autonomy.md` as accepted. For `mckuin-2021-solar-canals.md`, `szulecki-2018-energy-democracy.md` and `jenkins-2016-energy-justice-review.md`, `AM` follows the old value; the repository pages need a browser to open and were not checked.
- **`forni-2023-solarpunk-nausicaa.md`** links to a repository copy. The L'Aquila repository describes it as the publisher's version under CC BY-NC-ND 4.0, so it is `VoR`.

### New items from the weekly search

`scripts/update-agent.mjs` writes the four fields. It sets a license only from a creativecommons.org URL that names version 4.0 or CC0 1.0 (Crossref license URLs for the published version, or DOAJ journal license URLs). Anything else becomes `license: none`, `rights_status: in-copyright-free-to-read` and an `access_note` starting "Needs checking:", which the audit lists as a warning. It sets `version: VoR` for Crossref journal articles and DOAJ articles, and takes `VoR` or `AM` from OpenAlex only when OpenAlex describes the same copy the file links to.

## Data and exports

Open Sun publishes its records as static files, built with the site. These are downloadable files, not a harvesting service such as OAI-PMH. They hold only reviewed items, the same ones the live site shows.

| URL | Format | Content-Type |
|---|---|---|
| `/library/<slug>/cite.ris` | RIS, one record, CRLF line endings | `application/x-research-info-systems` |
| `/library/<slug>/cite.bib` | BibTeX, one entry, key = slug | `application/x-bibtex` |
| `/data/open-sun.csv` | CSV of every item: UTF-8 without a byte order mark, CRLF, header row, quoting as in RFC 4180 | `text/csv; header=present` |
| `/data/open-sun-marc.xml` | MARC 21 bibliographic records in MARCXML (MARC21slim schema), one `<collection>` | `application/marcxml+xml` |

All are sent with `Content-Disposition: attachment` and a file name. The item page links to the RIS and BibTeX files from the "Cite this" box. The route handlers are in `app/library/[slug]/cite.ris/`, `app/library/[slug]/cite.bib/` and `app/data/`. The builders are pure functions in `lib/exports.ts` and `lib/marc.ts`, tested in `tests/exports.test.ts`.

### How `venue` is used

`venue` can be a journal, publisher, series, website or note (Known issue 1), so each export names it only when the record shows what it is.

- **Journal**: an Article or Essay with a volume or issue and no bracketed note in `venue`. Other Articles, such as conference papers, are not called journal articles.
- **Book publisher**: the `venue` of a Book, or of an edited Fiction anthology, with any bracketed note dropped ("University of Minnesota Press (Forerunners)" becomes "University of Minnesota Press").
- **Chapter**: `venue` is "Book title (Publisher)", split into the two.
- **Thesis**: a `venue` that starts "Master's thesis," or "PhD thesis," gives the degree and the institution.
- **Anything else** is passed on whole: RIS `T2`, BibTeX `howpublished`, MARC 500 "Source: ...".

### RIS

| Open Sun | RIS |
|---|---|
| Type | `JOUR` (journal evidence as above), `BOOK` (Book, edited Fiction), `CHAP`, `RPRT`, `THES`, `UNPB` (Preprint), `ELEC` (Essay or Guide with no journal), `JFULL` (Journal), `GEN` (anything else, including Articles with no volume or issue) |
| `authors` | `AU`, "Family, Given". Group names whole. With `edited: true` they are `ED` instead. |
| `editors` | `ED` |
| `title` | `TI` |
| `venue` | `T2`, or `PB` for a book, or `T2` and `PB` for a chapter, or `PB` and `M3` for a thesis |
| `year` | `PY` |
| `volume`, `issue` | `VL`, `IS` |
| `pages` | `SP` and `EP` for a range. `SP` alone for an article number. |
| `doi`, `url` | `DO`, `UR` (the free copy) |
| `language` | `LA`, two-letter code |
| `topics` | `KW`, the reader-facing labels |
| Rights | `N1`: "Rights: CC BY 4.0. Version: Author manuscript. Copy: ..." |

Not exported: the summary, which is Open Sun's text, not the author's abstract (`AB`/`N2`).

### BibTeX

| Open Sun | BibTeX |
|---|---|
| Type | `@article` (journal evidence), `@book` (Book, edited Fiction), `@incollection` (Chapter), `@mastersthesis` or `@phdthesis` (Thesis with a parsable venue), `@misc` (everything else, including Reports, so that a fact sheet is not printed as a "Technical report") |
| `authors`, `editors` | `author`, `editor`, "Family, Given" joined with "and". Group names in braces so they are not split. |
| `title` | `title` in double braces, keeping the capitals as given |
| `venue` | `journal`, `publisher`, `booktitle` and `publisher`, `school`, or `howpublished` |
| `pages` | `pages` with `--` for a range. An article number goes in `eid` (a biblatex field that classic BibTeX styles ignore). |
| `doi`, `url` | `doi`, `url`, not escaped |
| `version` | `note`, only when not VoR: "Author manuscript", "Preprint" |
| `topics` | `keywords` |

LaTeX special characters are escaped in every other field. Text stays in UTF-8.

### CSV columns

`id`, `open_sun_url`, `title`, `authors`, `authors_are` (`people` or `organizations`), `authors_are_editors` (`yes`/`no`), `editors`, `year`, `type`, `venue`, `volume`, `issue`, `pages`, `doi`, `url`, `license`, `license_url`, `rights_status`, `version`, `access_note`, `language`, `topics`, `date_added`, `summary`. Lists are joined with "; ". `topics` holds the keys from `lib/topics.ts`.

### MARC crosswalk used in `/data/open-sun-marc.xml`

These are brief records made from Open Sun's own data. Names are copied from the works and not checked against an authority file.

| MARC | Value | From |
|---|---|---|
| Leader | `00000na` + level + ` a22000003n 4500`. 05 `n` new, 06 `a` language material, 07 `a` component part (Article, Essay, Chapter), `m` monograph (everything else), `s` serial (Journal). 09 `a` Unicode. 17 `3` abbreviated level. 18 `n` non-ISBD, no punctuation at the end of subfields. | `type` |
| 001 | The slug | File name |
| 007 | `cr |||||||||||` (online electronic resource) | Every item |
| 008 | 00-05 date entered (from `date_added`). 06-14 `s` + year, or `nuuuu` when undated (serials: `u` + year + `uuuu`). 15-17 `xx ` (place unknown). 23 `o` online. 24 `m` for a thesis. 33 `1` for Fiction, `0` otherwise. 35-37 language. 39 `d`. Other coded positions `|` (no attempt to code). | `date_added`, `year`, `type`, `language` |
| 024 7# | $a DOI $2 doi | `doi` |
| 041 ## | $a three-letter MARC language code. First indicator blank, because records don't say whether a work is a translation. Left out for an unknown language. | `language` |
| 100 1# or 0# | $a "Family, Given" $e author. First indicator 1 for a surname, 0 for a single name. | First name in `authors` (people) |
| 110 2# | $a group name, with an initial "The" dropped $e author | First name in `authors` with `organization: true` |
| 245 | First indicator 1 when there is a 1XX, 0 when not (edited works). Second indicator: nonfiling characters for an initial article in English, Spanish, Portuguese, French, Italian, German or Dutch, counting any quotation mark before it. $a title before the first colon, $b the rest. | `title`, `language` |
| 264 #1 | $b publisher (Book, edited Fiction, or a group that published its own work) $c year | `venue`, `year` |
| 300 | $a 1 online resource | Every item |
| 336, 337, 338 | text/txt rdacontent, computer/c rdamedia, online resource/cr rdacarrier | Every item |
| 500 | "Source: " + `venue` for monographs whose venue is not a plain publisher. "Version: ..." for versions other than VoR. | `venue`, `version` |
| 502 | $a `venue` | Thesis |
| 506 0# | $a Open access $f Unrestricted online access $2 star | Every item |
| 520 | $a summary $c Open Sun | Summary |
| 540 | Creative Commons: $a full name $f short name $2 cc $0 deed URL. Public domain: $a, $f public domain, $2 wikidata, $1 Wikidata URI. Otherwise $a "In copyright. Free to read online, with no open license". | `license`, `rights_status` |
| 653 #0 | $a topic label, one field each | `topics` |
| 700 1#, 710 2# | Other authors ($e author), editors ($e editor) | `authors`, `editors`, `edited` |
| 773 0# | $t journal, host website or conference. For a chapter, $t book title and $d "Publisher, year". $g "Vol. 2, no. 9 (2019), p. 848-855", or "article 7180". | `venue`, `volume`, `issue`, `pages`, `year` |
| 856 40 | $u the free copy $z `access_note` | `url`, `access_note` |
| 856 42 | $u the Open Sun item page $z Summary and record on Open Sun | Slug |

Left out on purpose: 003 and 040 (Open Sun has no MARC organization code), 005 (no modification date is kept), 020 and 022 (no ISBN or ISSN in the records), 245 $c (no transcribed statement of responsibility), 490 (series can't be told apart from other notes in `venue`), and 650 or 655 (no controlled subject or genre vocabulary yet).

**Validation.** On 12 November 2026 the full file (84 records) was checked against the Library of Congress schema `MARC21slim.xsd` (fetched from loc.gov that day) with the .NET XML schema validator: no errors. A deliberately broken copy was rejected, which shows the check was working. The file has not been loaded into a library system.

**Unverified.** These choices follow the MARC documentation but have not been tried in a library system:

- Leader/17 `3` and Leader/18 `n` for records like these.
- 773 for web essays and conference papers, whose hosts are websites and proceedings rather than journals.
- 500 for the venue note and for the article version. No MARC field is defined for NISO article versions.
- Name forms. Particles are kept with the family name ("de Valk, Marloes"), which national rules for some languages would order differently. Group names are entered as written ("U.S. Department of Energy Solar Energy Technologies Office"), not as authorized headings with subordinate units.
- RIS `ED` for editors and `GEN`, `ELEC` and `UNPB` for the less certain types, which reference managers import in different ways.
- The 008 date and 264 $c for a component part give the year of the part, which is usually the year of the issue.

## Known issues and proposed fixes

Everything in this section is a proposal. None of it is current practice.

### 1. `venue` holds too many kinds of information

**Problem.** One field holds journal titles, publishers, the book a chapter sits in, series and report numbers, degrees, and notes. Examples: "Understanding the Urban Sharing Economy (Edward Elgar)" (`silva-2025-libraries-of-things-sharing-economies.md`), "IMF Working Paper 2023/169" (`black-2023-imf-fossil-fuel-subsidies.md`), "Master's thesis, Stockholm Resilience Centre, Stockholm University" (`rossi-2023-pathways-multispecies-cities.md`), "SocArXiv (preprint, not peer reviewed)". Software cannot tell these apart, so the embedded metadata has to leave most of them out.

**Proposed fix.** Replace `venue` with separate optional fields: `container_title` (journal, or the book for a chapter), `publisher`, `series` and `series_number`, `institution` and `degree` (theses), and `note`. Add `issn` and `isbn`. Build the display line from those fields.

### 2. Editors are recorded two ways

**Problem.** `kothari-2019-pluriverse.md` lists its editors in `authors` and sets `edited: true`. `after-oil-2022-solarities-energy-justice.md` keeps a group author in `authors` and lists editors in `editors`. A record cannot say that some names are people and some are groups.

**Proposed fix.** Use one list of contributors, each with a name, a role (`author`, `editor`, `translator`) and a kind (`person` or `organization`). Retire `edited` and `organization`.

### 3. No name authority

**Problem.** Names are copied from each work, so one person can appear in two forms. "Laura Pereira" (`pereira-2019-imagination-scenario-processes.md`) and "Laura M. Pereira" (`pereira-2020-nature-futures-framework.md`) are the same person. So are "Garry D. Peterson" (`cheok-2025-indigenous-futures-thinking.md`) and "Garry Peterson" (`pereira-2020-nature-futures-framework.md`). Name order is mixed inside one record in `de-decker-2018-low-tech-website.md`. No record carries an ORCID iD.

**Proposed fix.** Keep a small authority file, for example `content/names.yml`, with one entry per person or group: the preferred form, variant forms, and identifiers where they exist (ORCID iD, the Library of Congress Name Authority File or VIAF number, and ROR for organizations). Records keep the name as it appears on the work and point to the authority entry. Add an author index to the site once the file exists.

### 4. `date_added` is the same on every record

**Problem.** All 84 records have `date_added: 2026-10-11`, the date of the first bulk load. `source` is always `curated` and `reviewed` is always `true`. The fields are sound, but so far they record nothing, and New Arrivals cannot tell old from new.

**Proposed fix.** Leave the existing dates alone, since they are true for the first load. From now on, set `date_added` to the day the record is merged. Add an optional `date_modified` for later corrections, and use it for the sitemap.

### 5. No type for conference papers

**Problem.** `alipio-2024-indigenous-data-sovereignty-solarpunk.md` is a conference paper, entered as an Article with the conference name in `venue`. `solarpunk-conference-2023-journal.md` is entered as a Book. "Journal" is in the type list but no record uses it. Fact sheets and news releases are marked only by a note in `venue`.

**Proposed fix.** Add "Conference paper" and "Web page" to the list. Decide whether "Journal" is for whole journals or should be removed. Write a one-line scope note for each type, so that Essay, Guide and Report are told apart the same way every time. Map each type to the COAR Resource Types vocabulary in this document.

### 6. Topics have no scope notes and no outside mapping

**Problem.** The 19 topics are labels only. Nothing says when to use "justice" and when to use "energy-justice". The key `ecology` is shown to readers as "Living land". Topics are not linked to any standard subject vocabulary, and the site does not check a record's topics against the list when it builds.

**Proposed fix.** Write a scope note for each topic: what it covers, what it leaves out, and which topic to use instead. Map each topic to the closest FAST or Library of Congress Subject Heading, and say whether the match is exact, close or broader. Record honestly where no heading fits. Publish the list as a SKOS file. Add a build-time check that fails when a record uses a topic that is not in the list.

### Smaller issues

- **Translated titles.** Records for works in Spanish, Portuguese and Polish have no English translation of the title. Add an optional `title_translated`.
- **Dates.** `year` holds a year only. An optional full `date_published` would help for preprints and web pages. Undated web pages need a `date_accessed`.
