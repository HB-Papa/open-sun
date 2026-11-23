# Adding items

New items pass through three stages: an automated scan, drafting and proofreading by AI agents, and approval by the site owner. Nothing is published until the site owner merges a pull request.

## Stage 1: the weekly scan (automatic)

1. Every Monday at 14:00 UTC, `.github/workflows/update-library.yml` runs `scripts/update-agent.mjs`.
2. The script searches OpenAlex, the Directory of Open Access Journals and Crossref for open access work published in the last 14 days.
3. It drops items already in the library, items listed in `content/rejected.txt`, self-deposited uploads, items with no real abstract and results that score too low on its keyword relevance check.
4. It writes one file per item, up to 12, into `content/library/`. Each file holds the abstract in a hidden comment and TODO placeholders. Each is marked `reviewed: false`, `summary_status: draft` and `source: agent`.
5. The workflow opens a pull request titled "Library update: new items to review" on the branch `library-update`.
6. **Don't merge that pull request.** The branch is rewritten every Monday, so an item left there can drop out.

## Stage 2: draft and proofread

1. In Claude Code, in a clean copy of the repository, run `/library-update`.
2. The command creates a branch named `library-batch-YYYY-MM-DD` and copies in the new files from the scan.
3. The `library-drafter` agent writes each summary, the "Why it matters" line and the field-note question. It uses only the abstract and the source page.
4. The `library-proofreader` agent, in a fresh session that didn't write the draft, checks each entry against the source. It returns one verdict:
   - **APPROVE:** the file is marked `reviewed: true` and `summary_status: edited`, and the abstract comment is deleted.
   - **CHANGES:** the drafter revises once and a fresh proofreader checks again. If it still isn't approved, the item is flagged and stays hidden.
   - **REJECT:** the file is removed and its DOI, or exact title, is added to `content/rejected.txt` with a comment giving the reason.
5. The command runs `npm test` and `npm run build`, then opens a pull request titled "Library batch YYYY-MM-DD: N items to approve".

## Stage 3: approval

1. The site owner reads the pull request. It lists approved items with their summaries, flagged items with their open problems and rejected items with reasons.
2. The site owner opens any link the proofreader marked "not verified".
3. Merging publishes the approved items. They appear in the library, on New arrivals and in the RSS feed.

## Adding one item by hand

1. Copy the example file in section 2 of the main `README.md` into `content/library/`.
2. Fill in every field. Use topics and a type from `lib/topics.ts`.
3. Run `npm run audit -- --no-links` and `npm run build`.
4. Open a pull request for the site owner.
