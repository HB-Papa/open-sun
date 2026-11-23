---
title: AI Use Statement
blurb: Where Open Sun uses AI, where it doesn’t, what a person checks, and how to report a mistake.
last_reviewed: 2026-11-12
---

## In short

Open Sun uses AI to help build the site and to draft and check the short summaries in the library. A person approves every item before it is published. The readings themselves are written by their authors and live on their publishers’ sites.

## What AI is used for

- **Building the site.** The site’s code and pages were built with an AI coding assistant, directed by the site owner.
- **Drafting summaries.** For each new item, an AI agent writes the summary, the “Why it matters” line and the optional reflection question. It works only from the item’s abstract and, when it opens, the page the item links to. It is told never to invent findings, numbers, places or methods, and to write a shorter, more general summary when the abstract is thin.
- **Checking summaries.** A second AI agent, which didn’t write the draft and can’t edit it, compares every claim with the source. It also checks that the work is on topic and free to read. It returns one of three verdicts: approve, changes needed, or reject. A draft gets one round of revision. If it still doesn’t pass, it stays hidden until a person deals with it.

Summaries for the starting collection were also first drafted with AI from each work’s abstract.

## What isn’t AI

The weekly search for new work is not AI. It queries OpenAlex, the Directory of Open Access Journals and Crossref, then scores the results with a fixed list of keywords.

## What a person does

The site owner sets the selection criteria and the instructions both agents follow. Each batch of new items arrives as a proposed change that lists what was approved, flagged and rejected, along with the checking agent’s notes. An item is published only when the site owner approves that batch by merging it.

## What AI is not used for

- There is no chatbot on the site.
- No reading in the library is AI-generated. Open Sun links to work by named authors.
- Nothing is published automatically.

## Known limits

- Summaries are written from abstracts and catalog records, and from the linked page when it opens. They are not written from a full reading of every work.
- Publishers often block automated access. When a page won’t open, the checking agent confirms the title, authors, year, license and open access status from Crossref and OpenAlex records instead. It reports that link as not verified and asks the site owner to open it.
- AI can make mistakes that read smoothly. Two agents and a person’s approval lower that risk. They don’t remove it.

## How to report an error

If a summary gets something wrong, a link is broken, or a reading isn’t free to read, please [open an issue on GitHub](https://github.com/HB-Papa/open-sun/issues/new). You’ll need a free GitHub account, and the report is public.
