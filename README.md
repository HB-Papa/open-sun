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

**All 35 starting summaries are marked `summary_status: draft`.** They are accurate first drafts written from each work's abstract. Rewrite each one in your own words and flip it to `edited`; the `/dev/drafts` page tracks what's left. The site never shows an "AI-generated" label.

Tips:

- **Names that need help.** Authors are written in natural order ("Rhys Williams"). For a family name the citation builder can't guess, write it as "Family, Given", for example `"Weik von Mossner, Alexa"`.
- **Citation titles.** APA citations put titles in sentence case automatically. If a proper noun comes out lowercase, add `citation_title: "Exactly as it should appear"`.
- **Items without a question.** If you leave out `field_note`, readers earn the note by scrolling to the end of the page.
- **Pathways** are in `content/pathways/`, the **Field Guide** is `content/field-guide.md`, and the **About** page is `content/pages/about.md`. Add a line about who runs the site there; there's a placeholder comment.

## 3. Put it on GitHub

1. Create a free account at https://github.com, then a **new repository** called `open-sun`. Make it **Public** (GitHub Actions is free for public repos) and leave "Add a README" unchecked.
2. In this folder, run these (GitHub shows the same commands on the new repo's page). Replace `YOUR-NAME`:

```bash
git remote add origin https://github.com/YOUR-NAME/open-sun.git
```

```bash
git push -u origin main
```

The first push opens a browser window to sign in to GitHub.

## 4. Deploy on Vercel (free)

1. Go to https://vercel.com and choose **Sign Up → Continue with GitHub**. Pick the **Hobby** (free) plan.
2. Click **Add New… → Project**, find `open-sun`, and click **Import**.
3. Leave every setting as detected (Framework: Next.js) and click **Deploy**.
4. After about a minute you'll get an address like `https://open-sun.vercel.app`. To change the name, go to **Settings → Domains**.
5. Optional: under **Settings → Environment Variables**, add `NEXT_PUBLIC_SITE_URL` = your address (so the RSS feed uses it), then redeploy.
6. Optional: turn on **Analytics** in the project for privacy-friendly page counts.

From now on, every change merged into `main` deploys automatically.

> Vercel's Hobby plan is for personal, non-commercial projects. A free library fits; check their terms if the site ever takes donations or sells anything.

### Turn on "Suggest a resource"

The form creates a GitHub issue labeled `suggestion` in your repo, so suggestions land in a review list and visitors don't need an account.

1. On GitHub, create a label called `suggestion` (**Issues → Labels → New label**).
2. Create a token: **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token**. Limit it to the `open-sun` repository, with **Repository permissions → Issues: Read and write**.
3. In Vercel, add the environment variables `GITHUB_REPO` = `YOUR-NAME/open-sun` and `GITHUB_TOKEN` = the token, then redeploy.

Until these are set, the form politely says suggestions aren't switched on yet.

## 5. Turn on the weekly update agent

Every Monday, `.github/workflows/update-library.yml` searches OpenAlex, DOAJ, and Crossref for newly published open access work, drafts summaries with Claude, and opens a **pull request** with one Markdown file per candidate. New files are marked `reviewed: false`, so **nothing appears on the live site until you approve it.**

1. Get a free OpenAlex API key at https://openalex.org (sign up, then copy the key from your account settings).
2. Get an Anthropic API key at https://console.anthropic.com (**API Keys → Create Key**). Each weekly run drafts up to 12 summaries and costs a small amount. Without this key the agent still runs, but the drafts contain only the abstract.
3. In your GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `OPENALEX_API_KEY`
   - `ANTHROPIC_API_KEY`
4. Optional: on the **Variables** tab, add `CONTACT_EMAIL` (sent to OpenAlex and Crossref as a courtesy, which gets you faster responses).
5. Go to **Settings → Actions → General**, scroll to **Workflow permissions**, select **Read and write permissions**, tick **Allow GitHub Actions to create and approve pull requests**, and save.
6. To try it now: **Actions → Weekly library update → Run workflow**.

**Reviewing a weekly pull request:**

1. Open each new file (GitHub's **Files changed** tab, then the pencil to edit). The original abstract is in a hidden comment at the top for reference.
2. Delete anything off-topic or not actually free to read, and add its DOI to `content/rejected.txt` so it isn't suggested again.
3. Rewrite the summary, set `summary_status: edited`, check the field note, and set `reviewed: true`.
4. **Merge** the pull request. Vercel publishes it.

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
