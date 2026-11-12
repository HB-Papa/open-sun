# Suggestions

## How a suggestion arrives

1. Someone fills in the form at `/suggest`: a link, and optionally a title, a reason and a name.
2. `app/api/suggest/route.ts` checks that the link is a web address, screens out spam and limits each sender to five suggestions an hour.
3. It files a public GitHub issue titled "Suggestion: " followed by the title or link, with the label `suggestion`.
4. The form collects no email address, so there is no way to reply privately. The public issue is the only record.

## Triage

1. Open the list of issues with the label `suggestion`, oldest first.
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

## Closing every issue

Close each issue with a one-line comment that gives the outcome and the reason. For example:

- "Added in pull request #31. Thank you."
- "Declined: the full text needs a subscription."
- "Duplicate: already in the library as Gillam (2023)."

Keep the comment kind and plain. Don't publish anything about the sender beyond what the issue already shows.

## Proposed status labels

**Proposed.** Only the `suggestion` label exists today. These labels would show each suggestion's state at a glance.

| Label | Meaning |
|---|---|
| `received` | Seen, not yet decided |
| `added` | Now in the library |
| `declined: not open access` | Not free to read |
| `declined: out of scope` | Off topic or not trustworthy enough |
| `duplicate` | Already in the library or already suggested |

## Reply-time target

**Proposed.** Target time from arrival to a closing comment: to be set by the site owner.

## Proposed record keeping

**Proposed.** When a suggestion is declined as out of scope, add its DOI or exact title to `content/rejected.txt` with a reason, so the weekly scan doesn't offer it again.
