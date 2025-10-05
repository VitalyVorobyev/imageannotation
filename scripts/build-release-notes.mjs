import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredEnv = ['RELEASE_TAG', 'IMAGE_REF', 'IMAGE_DIGEST_REF'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const tag = process.env.RELEASE_TAG;
const imageRef = process.env.IMAGE_REF;
const digestRef = process.env.IMAGE_DIGEST_REF;
const changelogPath = resolve(process.env.CHANGELOG_PATH ?? 'CHANGELOG.md');
const healthEndpoint = process.env.HEALTH_ENDPOINT ?? '/health';
const sbomName = process.env.SBOM_NAME;
const provenanceName = process.env.PROVENANCE_NAME;
const distName = process.env.DIST_ARCHIVE_NAME;
const openapiName = process.env.OPENAPI_ASSET_NAME;
const exampleEnvName = process.env.EXAMPLE_ENV_ASSET_NAME;
const composeName = process.env.COMPOSE_SNIPPET_ASSET_NAME;
const dbNotePath = process.env.DB_NOTE_PATH ? resolve(process.env.DB_NOTE_PATH) : null;

const changelogRaw = readFileSync(changelogPath, 'utf8');

function extractVersionSection(raw, versionTag) {
  const pattern = new RegExp(`^## \\[${versionTag.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\](?: .*)?$`, 'm');
  const match = raw.match(pattern);
  if (!match) {
    return null;
  }
  const startIndex = match.index ?? 0;
  const rest = raw.slice(startIndex);
  const nextHeaderIndex = rest.indexOf('\n## [', 1);
  if (nextHeaderIndex === -1) {
    return rest.split('\n').slice(1).join('\n').trim();
  }
  const section = rest.slice(0, nextHeaderIndex).split('\n').slice(1).join('\n');
  return section.trim();
}

function extractSubsection(content, headings) {
  const lines = content.split('\n');
  let start = -1;
  for (const heading of headings) {
    const idx = lines.findIndex((line) => line.trim().toLowerCase() === `### ${heading}`.toLowerCase());
    if (idx !== -1) {
      start = idx;
      break;
    }
  }
  if (start === -1) {
    return [];
  }
  const subsectionLines = [];
  let inComment = false;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      break;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('<!--')) {
      inComment = true;
    }
    if (!inComment) {
      subsectionLines.push(line);
    }
    if (trimmed.endsWith('-->')) {
      inComment = false;
    }
  }
  return subsectionLines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
}

function fallbackList(items, fallback) {
  if (items.length === 0) {
    return [fallback];
  }
  return items;
}

const versionSection = extractVersionSection(changelogRaw, tag);
if (!versionSection) {
  throw new Error(`Unable to find changelog entry for ${tag}`);
}

const highlights = fallbackList(
  extractSubsection(versionSection, ['Highlights', 'Added', 'Changed']),
  'Refer to the changelog section below.'
);

const breakingChanges = fallbackList(
  extractSubsection(versionSection, ['Breaking Changes']),
  'None.'
);

let dbNote = 'No database migrations are required for this release.';
if (dbNotePath) {
  const raw = readFileSync(dbNotePath, 'utf8');
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstContentLine = lines.find((line) => !line.startsWith('#'));
  if (firstContentLine) {
    dbNote = firstContentLine.replace(/^_*(.*?)_*$/, '$1');
  }
}

const operationalNotes = [
  `Health endpoint: GET ${healthEndpoint}`,
  sbomName ? `SBOM artifact: ${sbomName}` : null,
  provenanceName ? `Provenance attestation: ${provenanceName}` : null,
  openapiName ? `OpenAPI spec: ${openapiName}` : null,
  exampleEnvName ? `Example configuration: ${exampleEnvName}` : null,
  composeName ? `Service snippet: ${composeName}` : null,
  distName ? `Static bundle: ${distName}` : null,
  `Database migrations: ${dbNote}`,
].filter(Boolean);

const sections = [
  '## Highlights',
  ...highlights.map((item) => `- ${item}`),
  '',
  '## Breaking Changes',
  ...breakingChanges.map((item) => `- ${item}`),
  '',
  '## Image',
  `- Published image: \`${imageRef}\``,
  `- Digest: \`${digestRef}\``,
  '',
  '## Operational Notes',
  ...operationalNotes.map((item) => `- ${item}`),
  '',
  '## Full Changelog',
  versionSection,
];

process.stdout.write(`${sections.join('\n')}`.trim() + '\n');
