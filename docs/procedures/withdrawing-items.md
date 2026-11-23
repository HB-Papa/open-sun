# Withdrawing items

Withdrawing means removing an item's file from `content/library/` so it no longer appears on the site.

## Criteria

Withdraw an item when any of these is true.

1. **No longer free to read.** The work is now behind a paywall or sign-in, and no free copy can be found.
2. **Gone.** The link is dead and [Broken links](broken-links.md) found no working copy.
3. **Retracted.** The publisher has retracted the work.
4. **Out of scope.** On a second look, the work isn't about solarpunk or a closely related idea.
5. **Duplicate.** The same work is in the library twice.
6. **Not what the file says.** The title, authors or content don't match the source.

A work that has moved is not a reason to withdraw. Repair the link instead.

## Steps

1. Confirm the reason yourself. Open the link and, for a retraction, find the publisher's notice.
2. Note the item's slug. That is its file name without `.md`.
3. Search `content/pathways/`, `content/field-guide.md` and the rest of `content/` for the slug. Remove each reference, or replace it with another item that serves the same purpose.
4. Delete the file from `content/library/`.
5. Add the item's DOI to `content/rejected.txt`, or its exact title if it has no DOI. Put a comment line above it with the date and reason. This stops the weekly scan from suggesting it again. For example:

   ```
   # 2026-11-12 withdrawn: now behind a paywall, no repository copy found
   10.1234/example
   ```

6. Skip step 5 for a duplicate, because the work itself stays in the library.
7. Run `npm run audit -- --no-links`, `npm test` and `npm run build`.
8. Open a pull request titled "Withdraw: " followed by the item's title. Give the reason and what you checked.
9. The site owner merges it. The item leaves the site when the merge publishes.

## What stays on record

- The deleted file remains in the repository's Git history.
- The reason is in `content/rejected.txt` and in the pull request.

## Proposed

- A `withdrawn` status in the front matter, so a withdrawn item keeps a short public record on the site instead of disappearing. This doesn't exist today.
- A count of withdrawals in the monthly audit report.
