# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: **daily puzzle players**. People who come for Microgrid, a short daily game played mostly on phones, and who can be drawn deeper into the reading. When audiences conflict, their needs win.

Also served:
- curious newcomers who have seen the word "solarpunk" and want to understand it;
- students, teachers and librarians looking for trustworthy, free sources;
- writers, artists, designers and organizers looking for inspiration and evidence.

## Product Purpose

Open Sun is a free, public digital library of open access solarpunk resources: scholarship, books, journals, fiction and practical guides. It is easy to browse and stays current through a weekly, human-reviewed update agent.

A 2–5 minute daily game gives people a reason to come back, and reading the library unlocks a little more play.

Success:
- People can find a resource in seconds.
- New items appear regularly.
- Players return daily because they want to, not out of anxiety.

## Positioning

Open Sun is a curated, open-access-only solarpunk library whose daily game is built from its own subject matter. Microgrid is about powering a neighborhood with sun, wind, storage and gardens. Reading the library (field notes) unlocks themed bonus rounds and rest days. No other library or puzzle site pairs the two.

## Operating Context

- Mobile first: daily games are mostly played on phones.
- One ranked puzzle a day, the same for everyone, seeded by date. It has a spoiler-free share grid with a plain-text version.
- Progress lives in the visitor's own browser.
- Reading pathways are guided routes through the collection. The Field Guide is a glossary linked to items.
- New items arrive through a weekly GitHub pull request, which the site owner reviews and edits before merging.
- Hosted on Vercel; each merge to main publishes.

## Capabilities and Constraints

- Open access only.
- No payments or ads.
- No accounts in version 1.
- Next.js App Router, static-first. Content is Markdown files with front matter.
- Built today:
  - Library search and filters.
  - Item pages with APA/Chicago citations.
  - Pathways and the Field Guide.
  - New Arrivals.
  - Suggest a Resource, which creates a GitHub issue.
  - Microgrid with streaks, rest days, field notes, bonus rounds and a personal garden.
- **Planned / being explored (not built):**
  - Email subscription with a weekly update of new articles.
  - Richer article tagging.
  - Recording what each person reads and spends time on.
  - A newsletter personalized to each subscriber.
- **Open decision:** the planned features conflict with today's "no accounts, progress only in your browser" stance. Before building them, decide on:
  - consent and opt-in;
  - what is stored and where;
  - an email provider;
  - Vercel Hobby's non-commercial terms.

## Brand Commitments

- Name: **Open Sun**.
- Voice: warm, hopeful, plain-language and kind. Never guilt-driven; for example, broken streaks get gentle messages.
- The site stands on its own and does not reference any book project.
- "Sticky, not addictive":
  - no dark patterns;
  - no selling or over-rewarding extra plays;
  - reading should not feel like paying for plays.

## Evidence on Hand

- 84 curated library items in `content/library/`.
- 8 pathways in `content/pathways/`.
- Field Guide terms.
- The product design doc: `solarpunk-library-design.md`, which is private and not published.
- Absences: no named team or contact yet; the About page's "who runs it" line is pending. No testimonials, usage numbers or press. Do not invent any of these.

## Product Principles

1. The daily puzzle is the front door; the library is the house it opens onto.
2. Play should lead to reading, and reading should feel like its own reward.
3. Kind by default: forgiving streaks, no anxiety mechanics, no guilt.
4. Trustworthy: every item is open access and approved by a person.
5. Findable in seconds on a phone.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast.
- Full keyboard use and screen-reader labels.
- "Reduce motion" respected.
- Colour is never the only signal, including in game results and share text.
