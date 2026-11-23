# Open Sun procedures manual

Last reviewed: 2026-11-12

## What this covers

This manual describes how the Open Sun collection is kept in good order: how items are added, checked, repaired and removed, and how suggestions are handled. It covers the library files in `content/library/` and the tools around them. It doesn't cover the site's design, the Microgrid puzzle or hosting.

## Who it's for

A new volunteer who has never worked on the project. Each procedure is a list of numbered steps. You need a GitHub account with access to the repository. Some steps also need Node.js and a copy of the repository on your computer. The main `README.md` explains that setup.

## Procedures

| Procedure | Use it when |
|---|---|
| [Collection audit](collection-audit.md) | The monthly audit issue opens, or you want to check the collection yourself |
| [Broken links](broken-links.md) | An item's link no longer opens |
| [Adding items](adding-items.md) | The weekly scan has found new items |
| [Withdrawing items](withdrawing-items.md) | An item should leave the library |
| [Suggestions](suggestions.md) | Someone sends a suggestion through the site's form, or a suggestion is close to its 14-day decision time |

## How to read these pages

- Steps describe what the repository does today.
- A step marked **Proposed** is a recommendation that isn't yet practice. The site owner decides whether to adopt it.
- Nothing reaches the live site until the site owner merges a pull request into `main`. A volunteer prepares changes. The site owner approves them.

## Related documents

- `README.md` in the repository root: running the site locally and editing library files.
- `.claude/skills/library-update/SKILL.md`: the exact instructions the drafting and proofreading agents follow.
- `lib/topics.ts`: the fixed lists of topics and item types.

## Keeping this manual current

1. Review every page when a script, workflow or agent it describes changes.
2. Update the "Last reviewed" date on this page after each review.
3. Move a step out of "Proposed" only once it's actually in use.
