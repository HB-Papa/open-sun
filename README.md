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

- **http://localhost:3000/dev/drafts** is your private checklist of summaries still marked `draft`. It only exists on your computer; the live site returns "not found."
- `npm test` checks that the next 60 days of Microgrid puzzles are all solvable.
- `npm run check-links` checks every library link. "warn" means the publisher blocked the automated check, so open that one in a browser.
- `npm run build` does a full production build, the same thing Vercel runs.

## 2. Edit the library

Each item is one file in `content/library/`, for example `content/library/gillam-2023-solarpunk-manifesto.md`:

```markdown
---
title: "A Solarpunk Manifesto: Turning Imaginary into Reality"
authors: ["William Joseph Gillam"]
year: 2023
type: Article            # Article, Book, Chapter, Essay, Fiction, Guide, Report, Journal, Thesis
venue: "Philosophies"
volume: "8"
issue: "4"
pages: "73"
doi: 10.3390/philosophies8040073
url: https://doi.org/10.3390/philosophies8040073   # the free-to-read link
license: "CC BY 4.0"
language: en
topics: [solarpunk, degrowth, justice, governance] # from the list in lib/topics.ts
date_added: 2026-10-11
source: curated          # or "agent"
reviewed: true           # false = hidden on the live site
summary_status: draft    # change to "edited" once you've rewritten it
field_note:              # optional one-question check that earns a field note
  question: "Which three principles does Gillam name?"
  options: ["Sun, wind, and water", "Anarchism, ecology, and justice", "Growth, technology, and markets"]
  answer: 1              # counting from 0
---

The plain-language summary goes here (two or three sentences).

**Why it matters:** One sentence.
```

You can edit in GitHub's web editor (the pencil icon), VS Code, or any text editor. When you push or merge to `main`, Vercel republishes the site in about a minute.

**All 84 starting summaries are marked `summary_status: draft`.** They are accurate first drafts written from each work's abstract. Rewrite each one in your own words and flip it to `edited`; the `/dev/drafts` page tracks what's left. The site never shows an "AI-generated" label.

Tips:

- **Names that need help.** Authors are written in natural order ("Rhys Williams"). For a family name the citation builder can't guess, write it as "Family, Given", for example `"Weik von Mossner, Alexa"`.
- **Citation titles.** APA citations put titles in sentence case automatically. If a proper noun comes out lowercase, add `citation_title: "Exactly as it should appear"`.
- **Items without a question.** If you leave out `field_note`, readers earn the note by scrolling to the end of the page.
- **Pathways** are in `content/pathways/`, the **Field Guide** is `content/field-guide.md`, and the **About** page is `content/pages/about.md`. Add a line about who runs the site there; there's a placeholder comment.

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

The form creates a GitHub issue labeled `suggestion` in your repo, so suggestions land in a review list and visitors don't need an account.

1. On GitHub, create a label called `suggestion` (**Issues → Labels → New label**).
2. Create a token: **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token**. Limit it to the `open-sun` repository, with **Repository permissions → Issues: Read and write**.
3. In Vercel, add the environment variables `GITHUB_REPO` = `YOUR-NAME/open-sun` and `GITHUB_TOKEN` = the token, then redeploy.

Until these are set, the form politely says suggestions aren't switched on yet.

## 5. The weekly update agent (set up, free)

Every Monday, `.github/workflows/update-library.yml` searches OpenAlex, DOAJ, and Crossref for newly published open access work, screens it with a keyword filter, and opens a **pull request** with one Markdown file per candidate. Each file holds the work's details and its abstract (in a hidden comment); the summary is left for you. New files are marked `reviewed: false`, so **nothing appears on the live site until you approve it.**

It uses only free services. The repo secret `OPENALEX_API_KEY` is set and Actions may open pull requests. It does not use the paid Anthropic API: Claude plans (like Pro) don't include API usage, so summaries are drafted in the Claude app instead.

To run it now instead of waiting for Monday: **Actions → Weekly library update → Run workflow**.

**Reviewing a weekly pull request:**

1. Ask Claude in the Claude app (Code tab, in this folder) to "draft the items in the latest library-update pull request". It reads each abstract, drops anything off-topic (adding its DOI to `content/rejected.txt`), and writes draft summaries and field notes on that branch.
2. Read each file on GitHub (**Files changed** tab, then the pencil to edit). Rewrite the summary in your own words, set `summary_status: edited`, and set `reviewed: true`.
3. **Merge** the pull request. Vercel publishes it automatically.

Too many weak matches? Raise `RELEVANCE_MIN` near the top of `scripts/update-agent.mjs`. Missing good ones? Lower it or add keywords to `SIGNALS`.
## How Microgrid works

- Each day's map, weather, and demand come from a seed built from the visitor's local date (`lib/microgrid.ts`), so everyone gets the same puzzle with no server.
- Placement matters: parts must connect to a home, trees shade solar panels, gardens cool them (agrivoltaics), ridges boost wind, and neighboring turbines slow each other down.
- A built-in solver (simulated annealing) finds a strong layout for every puzzle, and the day's demand is set a little below what that layout can carry. Every puzzle is therefore solvable, and that layout is revealed if a player runs out of tries. `npm test` checks 60 days ahead plus all bonus variants, and confirms random layouts almost never win.
- Streaks count days played in a row. Rest days (one per three field notes, hold up to two) quietly cover missed days. Bonus grids (up to three a day) come from field notes and never affect streaks, stats, or the share result.

## Project map

| Path | What's there |
| --- | --- |
| `app/` | Pages: `/`, `/library`, `/library/[slug]`, `/pathways`, `/play`, `/field-guide`, `/new`, `/rss.xml`, `/about`, `/suggest`, `/dev/drafts` |
| `components/` | Header, footer, cards, the time-of-day hero, the Microgrid board and charts |
| `content/` | Library items, pathways, Field Guide, About page, rejected list |
| `lib/microgrid.ts` | Puzzle generator, simulation, and solver |
| `lib/progress.ts` | Streaks, field notes, bonus rounds, and the garden (browser storage) |
| `lib/cite.ts` | APA and Chicago citations |
| `scripts/` | Update agent and link checker |
| `.github/workflows/` | Weekly update agent; build and test checks on pull requests |
