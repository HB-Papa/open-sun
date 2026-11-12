# Broken links

Use this when the audit, `npm run check-links` or a reader reports that an item's link doesn't open.

## 1. Confirm

1. Open the `url` from the item's file in a browser.
2. If it opens and shows the right work, the link is fine. Automated checks are often blocked by publishers. Note this on the audit issue and stop.
3. If it fails, try again later the same day and once more the next day. Servers have outages, and a timeout or a 500-range error is often temporary.
4. If the item has a `doi`, open `https://doi.org/` followed by the DOI. A DOI usually follows a work to its new address.

## 2. Look for a working copy

Look in this order and stop at the first copy that is free to read.

1. The publisher's site. Search it for the exact title. The page may only have moved.
2. The DOI link, if step 1.4 worked.
3. A repository copy: the author's university repository, or a subject repository such as PubMed Central. Searching the exact title in quotes usually finds these.
4. The organization's own site, for guides and reports.

Check that the copy is the same work: same title, authors and year. Check that it is free to read without signing in.

## 3. Replace the link

1. Change `url` in the item's file to the working address.
2. Check `license`. A repository copy may carry different terms than the publisher's version. For an author's accepted manuscript, existing items use wording such as "Free to read (author manuscript)".
3. Leave `date_added` and the summary alone.
4. Run `npm run audit` to confirm the new link passes, then `npm run build`.

## 4. If there's no working copy

1. Wait one week and repeat sections 1 and 2.
2. If the work is still unavailable, or is now behind a paywall, follow [Withdrawing items](withdrawing-items.md).

## 5. Record what was done

1. Open a pull request with the change. In its description, give the old link, the new link and where you found it.
2. Comment on the monthly audit issue with one line per item: "replaced with repository copy", "opens in a browser, no change" or "withdrawn".
3. **Proposed:** an archived snapshot, such as one from the Internet Archive's Wayback Machine, is not used as a replacement link today. Whether to allow it is for the site owner to decide.
