# Open Sun

A free library of open access writing on solarpunk and the ideas around it, with a three-minute daily puzzle, **Microgrid**.

Built with Next.js, React, TypeScript, Tailwind CSS, and Framer Motion. There's no database: every library item is a Markdown file, and visitor progress lives in their own browser.

---

## 1. Run it on your computer

You need **Node.js 22.18 or newer** (this PC has Node 24) and **Git**.

```bash
npm install
```

```bash
npm run dev
```

Then open **http://localhost:3000**. Pages reload as you edit files. Press `Ctrl + C` in the terminal to stop.

Useful extras while running locally:

- **http://localhost:3000/dev/drafts** is your private checklist of summaries still marked `draft` and items marked `reviewed: false`. It only exists on your computer; the live site returns "not found."
- `npm test` checks that the next 60 days of Microgrid puzzles are all solvable, and that the tutorial's example works.
- `npm run check-links` checks every library link. "warn" means the publisher blocked the automated check, so open that one in a browser.
- `npm run audit` runs the collection audit (`scripts/collection-audit.mjs`).
- `npm run typecheck` checks the TypeScript.
- `npm run build` does a full production build, the same thing Vercel runs.

## 2. Edit the library

Each item is one file in `content/library/`, for example `content/library/gillam-2023-solarpunk-manifesto.md`:

```markdown
---
title: "A Solarpunk Manifesto: Turning Imaginary into Reality"
authors: ["William Joseph Gillam"]
year: 2023
type: Article            # Article, Book, Chapter, Essay, Fiction, Guide, Report, Journal, Thesis, Preprint
venue: "Philosophies"
volume: "8"
issue: "4"
pages: "73"
doi: 10.3390/philosophies8040073
url: https://doi.org/10.3390/philosophies8040073   # the free-to-read link
license: CC-BY-4.0       # SPDX identifier (CC-BY-4.0, CC-BY-NC-ND-4.0, CC0-1.0 ...) or none
rights_status: open-license   # open-license, public-domain or in-copyright-free-to-read
version: VoR             # optional, journal articles only: VoR, AM (author manuscript), AO (preprint) ...
# access_note: "PubMed Central"   # optional: where the free copy is, or what still needs checking
language: en
topics: [solarpunk, degrowth, justice, governance] # from the list in lib/topics.ts
date_added: 2026-10-11
source: curated          # or "agent" for items found by the weekly search
reviewed: true           # false = hidden on the live site
summary_status: edited   # "draft" until the summary has been checked and approved
field_note:              # optional one-question reflection on the reading
  question: "Which three principles does Gillam name?"
  options: ["Sun, wind, and water", "Anarchism, ecology, and justice", "Growth, technology, and markets"]
  answer: 1              # counting from 0
---

The plain-language summary goes here (two to four sentences).

**Why it matters:** One sentence.
```

You can edit in GitHub's web editor (the pencil icon), VS Code, or any text editor. When you push or merge to `main`, Vercel republishes the site in about a minute.

**All 84 items are currently marked `reviewed: true` and `summary_status: edited`.** Summaries are drafted by AI from each work's abstract and source page, checked by a second AI agent, and approved by the site owner before they are published (see section 5). The About page says this publicly, and `content/policies/ai-use.md` describes it in full. The `/dev/drafts` page lists anything still marked `draft`.

Tips:

- **Names that need help.** Authors are written in natural order ("Rhys Williams"). For a family name the citation builder can't guess, write it as "Family, Given", for example `"Weik von Mossner, Alexa"`.
- **Citation titles.** APA citations put titles in sentence case automatically. If a proper noun comes out lowercase, add `citation_title: "Exactly as it should appear"`.
- **Items without a question.** `field_note` is optional. The question is for reflection only and earns nothing. Reading a page (scrolling well into it or staying a while) grows the visitor's garden either way.
- **Pathways** are in `content/pathways/`, the **Field Guide** is `content/field-guide.md`, and the **About** page is `app/about/page.tsx`. Add a line about who runs the site and how to reach you there; there's a placeholder comment under "Who runs Open Sun".
- **Policies** are in `content/policies/`: the collection development policy and the AI use statement.
- **Procedures** for routine library work are in `docs/procedures/`.

## 3. Where it lives (current setup)

- **Live site:** https://open-sun.vercel.app (Vercel project `open-sun`, team `hb-papa`, Hobby plan).
- **Code:** https://github.com/HB-Papa/open-sun (public).
- **Automatic deploys:** Vercel is connected to the repo. Every push or merge to `main` goes live in about a minute. Pull requests get a private preview link, visible only when signed in to Vercel.
- **Launch settings:** `SITE_PUBLIC=true` is set for Production, which lets search engines index the site. Deployment Protection is **Standard**: production is public, previews stay private.
- **Private files** (`solarpunk-library-design.md`, `open-sun-resources.md`, the handoff zip) are listed in `.gitignore` and `.vercelignore`, so they are never uploaded.

To publish an edit: save the file, then commit and push (or edit directly on GitHub). To take the site private again, set Deployment Protection back to **All Deployments** in Vercel.

> Vercel's Hobby plan is for personal, non-commercial projects. A free library fits; check their terms if the site ever takes donations or sells anything.

## 4. Optional features (already set up)
### Turn on "Suggest a resource"

The form creates a GitHub issue labeled `suggestion` in your repo, so suggestions land in a review list and visitors don't need an account. Those issues are public.

1. On GitHub, create a label called `suggestion` (**Issues → Labels → New label**).
2. Create a token: **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token**. Limit it to the `open-sun` repository, with **Repository permissions → Issues: Read and write**.
3. In Vercel, add the environment variables `GITHUB_REPO` = `YOUR-NAME/open-sun` and `GITHUB_TOKEN` = the token, then redeploy.

Until these are set, the form politely says suggestions aren't switched on yet.

## 5. The weekly update agent (set up, free)

Every Monday, `.github/workflows/update-library.yml` searches OpenAlex, DOAJ, and Crossref for newly published open access work, screens it with a keyword score (not AI), and opens a **pull request** from the `library-update` branch with one Markdown file per candidate. Each file holds the work's details and its abstract (in a hidden comment), with the summary left as TODO. New files are marked `source: agent`, `reviewed: false` and `summary_status: draft`, so **nothing appears on the live site until you approve it.**

It uses only free services. The repo secret `OPENALEX_API_KEY` is set and Actions may open pull requests. It does not use the paid Anthropic API: Claude plans (like Pro) don't include API usage, so summaries are drafted and checked in Claude Code instead.

To run it now instead of waiting for Monday: **Actions → Weekly library update → Run workflow**.

**Turning a weekly scan into published items:**

1. In Claude Code, in this folder, run `/library-update` (defined in `.claude/skills/library-update/SKILL.md`). It copies the waiting items to a new `library-batch-YYYY-MM-DD` branch. The `library-drafter` agent writes each summary, "Why it matters" line and field-note question from the abstract and source page. The `library-proofreader` agent, in a fresh session that didn't write the draft, checks each one against the source and returns approve, changes or reject. Both agents are defined in `.claude/agents/`.
2. It then opens a pull request titled `Library batch YYYY-MM-DD: N items to approve`. Approved items are marked `reviewed: true` and `summary_status: edited`. Items still not approved after one revision stay hidden (`reviewed: false`, `draft`) and are listed as flagged. Rejected items are removed and added to `content/rejected.txt`, so the scan doesn't offer them again.
3. Read the pull request: each approved summary, its link, and the proofreader's notes. Open any link the proofreader couldn't verify. Edit anything you want to change on GitHub (**Files changed** tab, then the pencil).
4. **Merge** the pull request. That is your approval, and Vercel publishes it automatically. The command never merges for you.

Too many weak matches? Raise `RELEVANCE_MIN` near the top of `scripts/update-agent.mjs`. Missing good ones? Lower it or add keywords to `SIGNALS`.

## How Microgrid works

- The game is at `/microgrid`. The old `/play` address redirects there. A tutorial opens by itself on a first visit and again at `/microgrid#tutorial`.
- Each day's map, weather, and demand come from a seed built from the visitor's local date (`lib/microgrid.ts`), so everyone gets the same puzzle with no server.
- Placement matters: parts must connect to a home, trees shade solar panels, gardens cool them (agrivoltaics), ridges boost wind, and neighboring turbines slow each other down.
- A built-in solver (simulated annealing) finds a strong layout for every puzzle, and the day's demand is set a little below what that layout can carry. Every puzzle is therefore solvable, and that layout is revealed if a player runs out of their three tries. `npm test` checks 60 days ahead and confirms random layouts almost never win. It also still covers the generator's variant puzzles, which the site no longer offers.
- There is one puzzle a day. Streaks count days played in a row, and missing a day ends the streak. There are no rest days, bonus grids or other rewards: reading earns nothing in the game, and playing earns nothing beyond its own result.

## Project map

| Path | What's there |
| --- | --- |
| `app/` | Pages: `/`, `/library`, `/library/[slug]`, `/pathways`, `/pathways/[slug]`, `/microgrid`, `/field-guide`, `/new`, `/rss.xml`, `/about`, `/suggest`, `/dev/drafts` |
| `components/` | Header, footer, cards, the time-of-day hero, the Microgrid board, tutorial and charts |
| `content/` | Library items, pathways, Field Guide, policies, rejected list |
| `docs/procedures/` | Written procedures for routine library work |
| `lib/microgrid.ts` | Puzzle generator, simulation, and solver |
| `lib/progress.ts` | Streaks, stats, readings visited, field notes answered, and the garden (browser storage) |
| `lib/cite.ts` | APA and Chicago citations |
| `scripts/` | Update agent, link checker and collection audit |
| `.claude/` | The `/library-update` command and the drafter and proofreader agents |
| `.github/workflows/` | Weekly update agent; build and test checks on pull requests |
