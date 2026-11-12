# Collection audit

The audit checks every file in `content/library/` and writes a report. It changes nothing.

## When it runs

- **Automatically:** on the 1st of each month at 14:00 UTC (`.github/workflows/collection-audit.yml`). It opens an issue titled "Collection audit: YYYY-MM" with the label `collection-audit`.
- **By hand on GitHub:** Actions, then "Monthly collection audit", then "Run workflow".
- **On your computer:** `npm run audit`. Add `-- --no-links` to skip the link checks and work offline.

## Reading the issue

1. Read the summary line. It gives the number of failures and warnings.
2. A red workflow run means there was at least one failure. The issue opens either way.
3. Work through **Failures** first, then **Warnings**.
4. The **Collection counts** need no action. They record the size and makeup of the collection that month.

## What to do for each failure

| Failure | Action |
|---|---|
| Link is broken | Follow [Broken links](broken-links.md) |
| Missing required field | Find the value on the source page and add it to the file's front matter |
| Topic not in `lib/topics.ts` | Replace it with a topic from that list |
| Type is not in the TYPES list | Use one of the types in `lib/topics.ts` |
| `date_added` is not YYYY-MM-DD | Correct the date format |
| Duplicate DOI or title | Compare the two files, keep the better one and follow [Withdrawing items](withdrawing-items.md) for the other. Skip the `rejected.txt` step, since the work stays in the library |
| Leftover "TODO" text | The entry is unfinished. Follow [Adding items](adding-items.md) |
| `field_note` problem | Give it a question, exactly three options and an `answer` of 0, 1 or 2 |
| Front matter can't be read | Fix the formatting at the top of the file. A missing quote mark is the usual cause |

## What to do for each warning

| Warning | Action |
|---|---|
| Link could not be checked automatically | The publisher blocked the check. Open the link in a browser. If it opens, do nothing. If it doesn't, follow [Broken links](broken-links.md) |
| `reviewed` is not true | The item is hidden on the live site. Finish its review or withdraw it |
| `summary_status` is not "edited" | The summary is still a draft. Finish it |
| `year` is set to null | Confirm the source really has no date. If it has one, add it |

## Finishing

1. Put all fixes in one pull request and mention the issue number in it.
2. Run `npm run audit -- --no-links` and `npm run build` before you open it.
3. Comment on the issue with what you did for each line, including links you opened and found working.
4. Close the issue once the pull request is merged.
