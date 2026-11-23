// Rights and access: the four fields that say how an item may be read and reused.
// `license` (SPDX identifier or "none"), `rights_status`, `version` (NISO Journal Article Version) and
// `access_note`. Pure functions with no Node or Next imports, so the browser, the scripts and the tests
// can all load this file. The rules are written up in docs/metadata/application-profile.md.

/** SPDX identifiers for the licenses Open Sun records, plus "none" for works with no open license. */
export const LICENSES = [
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'CC-BY-NC-4.0',
  'CC-BY-ND-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-NC-ND-4.0',
  'CC0-1.0',
  'none',
] as const;
export type License = (typeof LICENSES)[number];

export const RIGHTS_STATUSES = ['open-license', 'public-domain', 'in-copyright-free-to-read'] as const;
export type RightsStatus = (typeof RIGHTS_STATUSES)[number];

/** NISO RP-8-2008 Journal Article Versions. Used for journal articles only. */
export const VERSIONS = ['AO', 'SMUR', 'AM', 'P', 'VoR', 'CVoR', 'EVoR'] as const;
export type Version = (typeof VERSIONS)[number];

/** The fields as they sit on a LibraryItem. */
export interface Rights {
  license: License;
  rightsStatus: RightsStatus;
  version?: Version;
  accessNote?: string;
}

const VERSION_LABEL: Record<Version, string | undefined> = {
  AO: 'Preprint',
  SMUR: 'Submitted manuscript',
  AM: 'Author manuscript',
  P: 'Proof',
  // The published version is what readers expect, so it needs no label.
  VoR: undefined,
  CVoR: undefined,
  EVoR: undefined,
};

/** "CC-BY-NC-ND-4.0" -> "CC BY-NC-ND 4.0", "CC0-1.0" -> "CC0 1.0". Undefined for "none". */
export function licenseName(license: License): string | undefined {
  if (license === 'none') return undefined;
  if (license === 'CC0-1.0') return 'CC0 1.0';
  return license.replace(/^CC-(.+)-4\.0$/, 'CC $1 4.0');
}

/** The Creative Commons deed for a license, or undefined for "none". */
export function licenseUrl(license: License): string | undefined {
  if (license === 'none') return undefined;
  if (license === 'CC0-1.0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  const m = license.match(/^CC-(BY(?:-NC)?(?:-SA|-ND)?)-4\.0$/);
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/4.0/` : undefined;
}

/** The short terms on their own: "CC BY 4.0", "Public domain" or "Free to read". */
export function termsLabel(r: Pick<Rights, 'license' | 'rightsStatus'>): string {
  const name = licenseName(r.license);
  if (name) return name;
  return r.rightsStatus === 'public-domain' ? 'Public domain' : 'Free to read';
}

/** A reader-facing name for a version that is not the published one ("Author manuscript"), or undefined. */
export const versionLabel = (version?: Version): string | undefined => (version ? VERSION_LABEL[version] : undefined);

/** What readers see: "CC BY 4.0", "CC BY-NC-ND 4.0 · Author manuscript", "Free to read · Preprint". */
export function rightsLabel(r: Pick<Rights, 'license' | 'rightsStatus' | 'version'>): string {
  const v = versionLabel(r.version);
  return v ? `${termsLabel(r)} · ${v}` : termsLabel(r);
}

/** A plain rights statement for DC.rights and exports when there is no license URL. */
export function rightsStatement(r: Pick<Rights, 'license' | 'rightsStatus'>): string {
  if (r.license !== 'none') return `${licenseName(r.license)} (${licenseUrl(r.license)})`;
  return r.rightsStatus === 'public-domain' ? 'Public domain' : 'In copyright. Free to read online, no open license.';
}

/** Which filter group a license falls in, for the library browser. */
export function licenseGroup(license: License): 'cc-by' | 'cc' | 'other' {
  if (license === 'CC-BY-4.0') return 'cc-by';
  return license === 'none' ? 'other' : 'cc';
}

const has = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/**
 * Reads the four fields from front matter, or throws an error naming the record and the problem.
 * A license must be one of LICENSES, and the license and rights status must agree: a CC BY family license is
 * an open license, CC0 is public domain or an open license, and "none" is public domain or free to read.
 */
export function parseRights(data: Record<string, unknown>, where: string): Rights {
  const problems: string[] = [];
  const license = data.license;
  const status = data.rights_status;
  const version = data.version;
  const note = data.access_note;

  if (!has(LICENSES, license)) {
    const hint = typeof license === 'string' && /^(CC|Free)/i.test(license) ? ' This looks like the old free-text form.' : '';
    problems.push(`license ${JSON.stringify(license ?? null)} is not one of ${LICENSES.join(', ')}.${hint}`);
  }
  if (!has(RIGHTS_STATUSES, status)) problems.push(`rights_status ${JSON.stringify(status ?? null)} is not one of ${RIGHTS_STATUSES.join(', ')}.`);
  if (version !== undefined && version !== null && !has(VERSIONS, version)) problems.push(`version ${JSON.stringify(version)} is not one of ${VERSIONS.join(', ')}.`);
  if (note !== undefined && note !== null && (typeof note !== 'string' || !note.trim())) problems.push('access_note must be short text.');
  if (has(LICENSES, license) && has(RIGHTS_STATUSES, status)) {
    if (license === 'none' && status === 'open-license') problems.push('rights_status is open-license but license is none.');
    if (license === 'CC0-1.0' && status === 'in-copyright-free-to-read') problems.push('CC0-1.0 cannot be in-copyright-free-to-read.');
    if (license !== 'none' && license !== 'CC0-1.0' && status !== 'open-license') problems.push(`${license} needs rights_status open-license.`);
  }
  if (problems.length) throw new Error(`${where}: ${problems.join(' ')} See docs/metadata/application-profile.md.`);

  const out: Rights = { license: license as License, rightsStatus: status as RightsStatus };
  if (has(VERSIONS, version)) out.version = version;
  if (typeof note === 'string' && note.trim()) out.accessNote = note.trim();
  return out;
}
