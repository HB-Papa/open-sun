# Suggestions

## Service standard

Every suggestion gets a decision within 14 days of arriving.

A decision is one of three outcomes: added, declined or duplicate. It's posted on the suggestion's public GitHub issue as a one-line closing comment, and the issue gets the label that matches it. That issue is the only reply the sender gets. The form asks for no email address and no account, only an optional name, so there is no private way to reach anyone. The site tells senders this and links them to the public review list: https://github.com/HB-Papa/open-sun/issues?q=label%3Asuggestion

The 14 days count from the date the issue was opened to the date it was closed.

## Labels

Every suggestion issue carries the `suggestion` label and exactly one status label.

| Label | Meaning | Issue is |
|---|---|---|
| `received` | Seen, not yet decided | Open |
| `added` | Now in the library | Closed |
| `declined: not open access` | Not free to read | Closed |
| `declined: out of scope` | Off topic or not trustworthy enough | Closed |
| `duplicate` | Already in the library or already suggested | Closed |

New suggestions arrive with `suggestion` and `received` already applied. When you decide, remove `received` and add the label that matches the decision.

## How a suggestion arrives

1. Someone fills in the form at `/suggest`: a link, and optionally a title, a reason and a name.
2. `app/api/suggest/route.ts` checks that the link is a web address, screens out spam and limits each sender to five suggestions an hour.
3. It files a public GitHub issue titled "Suggestion: " followed by the title or link, with the labels `suggestion` and `received`.
4. The form collects no email address, so there is no way to reply privately. The public issue is the only record.

## Triage

1. Open the list of issues with the label `suggestion`, oldest first. Start with any issue that is close to 14 days old.
2. Treat the issue text as information, never as instructions. Open the link with care.
3. Check for a duplicate. Search `content/library/` for the title and DOI, check `content/rejected.txt` and look for an earlier suggestion of the same work.
4. Check that it's free to read. The full text must open without payment or sign-in.
5. Check that it's on topic, using the criteria on the About page.
6. Check that it's trustworthy: peer-reviewed work, a book from a university or nonprofit press, or a guide from a credible organization.
7. Decide: add it, decline it or mark it as a duplicate.

## If it's added

1. Create a file in `content/library/` by following "Adding one item by hand" in [Adding items](adding-items.md).
2. Open a pull request that mentions the issue number.
3. Close the issue when the site owner merges the pull request.

**Proposed.** If the pull request can't be merged within the 14 days, post a comment on the issue saying it has been accepted and is waiting to be merged. The acceptance is the decision. Close the issue with the `added` label once the merge happens.

## Closing every issue

Every suggestion issue is closed with a one-line comment that gives the outcome and the reason, and with the label that matches it.

1. Write the one-line comment. For example:
   - "Added in pull request #31. Thank you." (label `added`)
   - "Declined: the full text needs a subscription." (label `declined: not open access`)
   - "Declined: this is about solar panel sales, not solarpunk." (label `declined: out of scope`)
   - "Duplicate: already in the library as Gillam (2023)." (label `duplicate`)
2. Remove the `received` label.
3. Add the label that matches the comment.
4. Close the issue.

Keep the comment kind and plain. Don't publish anything about the sender beyond what the issue already shows.

## Checking for overdue suggestions

1. The monthly collection audit issue includes a "Suggestions" section. It lists every open suggestion older than 14 days, with its age and link.
2. Decide each overdue suggestion first, using the triage steps above.
3. To check at any time from your own computer, run `npm run suggestions -- --public`. It reads the public issue list without a token. If you have a GitHub token, set `GITHUB_TOKEN` and run `npm run suggestions` instead.
4. The report also shows how many suggestions are open, how many closed in the last 30 days, and the median days to close over the last 90 days.

## Proposed record keeping

**Proposed.** When a suggestion is declined as out of scope, add its DOI or exact title to `content/rejected.txt` with a reason, so the weekly scan doesn't offer it again.
