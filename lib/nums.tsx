// Atkinson Hyperlegible draws a slashed zero ("2Ø14"), which reads like a typo in years,
// citations and counts. These helpers set runs of digits in Fraunces instead, so every
// number on the site shares one figure style.

// A run of digits (with thousands separators, decimals, ranges), not part of a word or an
// HTML entity such as &#8217;.
const DIGITS = /(?<![#&\w])\d[\d,.–:]*\d|(?<![#&\w])\d/g;

/** Wraps digit runs in plain text segments of an HTML string (tags and attributes are left alone). */
export function numHtml(html: string): string {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part.replace(DIGITS, (m) => `<span class="num-i">${m}</span>`)))
    .join('');
}

/** Renders plain text with its digit runs set in Fraunces. */
export function Nums({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(DIGITS)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={at} className="num-i">
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
