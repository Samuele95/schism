// Builds the reading room (public/read/) from the skill files in this repository and the content brief.
// Pages rendered from package files carry data-source and are never retyped; pages written
// from the brief carry data-claim on every factual element (site-work/reading-room.md).
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = path.resolve(import.meta.dirname, '..');
const PKG = path.resolve(ROOT, '..'); // the repository root: schism/, USAGE.md
const BRIEF = path.join(ROOT, 'content/brief.md');
const REPO = 'https://github.com/Samuele95/schism';
const OUT = path.join(ROOT, 'public/read');

const CARDS = [
  ['stream-and-capture', 'The residual stream, its writers, and capture'],
  ['response-prefix', 'Response prefix'],
  ['contrast-design', 'Contrast design, presets and splits'],
  ['directions', 'Directions'],
  ['directional-ablation', 'Directional ablation and MPOA'],
  ['ara', 'ARA: Arbitrary-Rank Ablation'],
  ['lora-lifecycle', 'LoRA lifecycle'],
  ['meters', 'Standard meters'],
  ['llm-judges', 'LLM judges and strict testers'],
  ['tpe', 'Multi-objective TPE'],
  ['floor-and-front', 'Floor, tiers, front, vault, head-to-head'],
  ['reproducibility', 'Workbench, pins, manifest, calibration'],
  ['feasibility-and-locate', 'Locating a behaviour, and the feasibility gate'],
  ['wsp-edit', 'WSP-style weight edits'],
  ['semantic-branch', 'The semantic branch'],
];
const ROLES = [
  ['cartographer', 'Cartographer'],
  ['smith', 'Smith'],
  ['operator-compiler', 'Operator compiler'],
  ['tester-behaviour', 'Behaviour tester (T1)'],
  ['tester-preservation', 'Preservation tester (T2)'],
  ['tester-capability', 'Capability tester (T3)'],
  ['tester-goodhart', 'Goodhart tester (T4)'],
  ['arbiter', 'Arbiter'],
];
// the first scene that points to each page (reading-room.md, Film to page)
const BACK = {
  'index.html': 's1', 'branches.html': 's5', 'run.html': 's6', 'cards/contrast-design.html': 's6',
  'cards/feasibility-and-locate.html': 's7', 'cards/floor-and-front.html': 's8', 'coordination.html': 's9',
  'cards/directional-ablation.html': 's10', 'cards/lora-lifecycle.html': 's11',
};

// ------------------------------------------------------------------ pages, in reading order
const pages = [
  { out: 'index.html', title: 'Schism', crumb: 'Overview', kind: 'brief', sections: [1, 2, 3, 4, 6] },
  { out: 'skill.html', title: 'The skill', crumb: 'The skill', kind: 'pkg', src: 'schism/SKILL.md' },
  { out: 'run.html', title: 'The run, phase by phase', crumb: 'The run', kind: 'pkg', src: 'schism/references/run-protocol.md' },
  { out: 'branches.html', title: 'Two branches', crumb: 'Two branches', kind: 'brief', sections: [5] },
  { out: 'coordination.html', title: 'Coordination', crumb: 'The tournament', kind: 'pkg', src: 'schism/references/coordination.md' },
  ...CARDS.map(([f, t]) => ({ out: `cards/${f}.html`, title: t, crumb: 'Technique card', kind: 'pkg', src: `schism/cards/${f}.md` })),
  ...ROLES.map(([f, t]) => ({ out: `roles/${f}.html`, title: t, crumb: 'Role prompt', kind: 'pkg', src: `schism/roles/${f}.md` })),
  { out: 'install.html', title: 'Install and run', crumb: 'Install and run', kind: 'pkg', src: 'USAGE.md' },
  { out: 'glossary.html', title: 'Glossary', crumb: 'Glossary', kind: 'brief', sections: [12] },
];

// ------------------------------------------------------------------ helpers
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function briefSections() {
  const text = fs.readFileSync(BRIEF, 'utf8');
  const out = {};
  for (const part of text.split(/^## /m).slice(1)) {
    const m = part.match(/^(\d+)\.\s+(.*)\n([\s\S]*)$/);
    if (m) out[Number(m[1])] = { title: m[2].trim(), body: m[3].trim() };
  }
  return out;
}

// [C-01, C-05] markers → data-claim on the enclosing paragraph, list item or cell; the markers are removed
function claimify(html) {
  return html.replace(/<(p|li|td)([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    const groups = [...inner.matchAll(/\[(C-\d+(?:,\s*C-\d+)*)\]/g)];
    if (!groups.length) return m;
    const ids = [...new Set(groups.flatMap((g) => g[1].split(/,\s*/)))];
    const clean = inner.replace(/\s*\[C-\d+(?:,\s*C-\d+)*\]/g, '');
    return `<${tag}${attrs} data-claim="${ids.join(' ')}">${clean}</${tag}>`;
  });
}

function anchorHeadings(html) {
  return html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (m, n, inner) => `<h${n} id="${slug(inner)}">${inner}</h${n}>`);
}

// in package pages, file mentions in code become links to their reading-room page
function linkify(html, prefix) {
  const map = (p) => {
    let m;
    if ((m = p.match(/^(?:schism\/)?cards\/([a-z-]+)\.md$/))) return CARDS.some(([f]) => f === m[1]) && `${prefix}cards/${m[1]}.html`;
    if ((m = p.match(/^(?:schism\/)?roles\/([a-z-]+)\.md$/))) return ROLES.some(([f]) => f === m[1]) && `${prefix}roles/${m[1]}.html`;
    if (/^(?:schism\/)?references\/run-protocol\.md$/.test(p)) return `${prefix}run.html`;
    if (/^(?:schism\/)?references\/coordination\.md$/.test(p)) return `${prefix}coordination.html`;
    if (/^(?:schism\/)?SKILL\.md$/.test(p)) return `${prefix}skill.html`;
    if (p === 'USAGE.md') return `${prefix}install.html`;
    return null;
  };
  return html.replace(/<code>([^<]+?)<\/code>/g, (m, inner) => {
    const target = map(inner.split(/[,\s]/)[0]);
    return target ? `<a href="${target}">${m}</a>` : m;
  });
}

function nav(current, prefix) {
  const item = (p) => `<li><a href="${prefix}${p.out}"${p.out === current ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`;
  const main = pages.filter((p) => !p.out.includes('/') && p.out !== 'install.html' && p.out !== 'glossary.html');
  const cards = pages.filter((p) => p.out.startsWith('cards/'));
  const roles = pages.filter((p) => p.out.startsWith('roles/'));
  const tail = pages.filter((p) => p.out === 'install.html' || p.out === 'glossary.html');
  return `<nav class="toc" aria-label="Reading room"><details open><summary>Contents</summary>
<ul>${main.map(item).join('')}</ul>
<p class="group">Technique cards</p><ul>${cards.map(item).join('')}</ul>
<p class="group">Roles</p><ul>${roles.map(item).join('')}</ul>
<p class="group">Using it</p><ul>${tail.map(item).join('')}</ul>
<a class="film" href="${prefix}../index.html">← the film</a>
</details></nav>
<script>if (matchMedia('(max-width: 800px)').matches) document.querySelector('.toc details').removeAttribute('open');</script>`;
}

const FAVICON = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%23050506%22/%3E%3Cpath d=%22M16 3v11M16 18v11%22 stroke=%22%23e0402f%22 stroke-width=%222%22/%3E%3Cpath d=%22M5 16h22%22 stroke=%22%23e8e2d4%22 stroke-width=%221%22/%3E%3C/svg%3E';

function page(p, i, body, sourceAttr) {
  const prefix = p.out.includes('/') ? '../' : '';
  const prev = pages[i - 1], next = pages[i + 1];
  const back = BACK[p.out];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)} — Schism reading room</title>
<meta name="description" content="Schism reading room: ${esc(p.title)}." />
<meta name="theme-color" content="#050506" />
<link rel="icon" href="${FAVICON}" />
<link rel="stylesheet" href="${prefix}read.css" />
</head>
<body>
<a class="skip" href="#main">Skip to the text</a>
<header class="banner" style="background-image:url(${prefix}../stills/S9.webp)">
<a class="home" href="${prefix}index.html">SCHISM</a><span class="kicker">reading room</span>
</header>
<div class="layout">
${nav(p.out, prefix)}
<main id="main"${sourceAttr}>
<p class="crumb">${esc(p.crumb)}</p>
${body}
<nav class="pn" aria-label="Previous and next">${prev ? `<a href="${prefix}${prev.out}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${prefix}${next.out}">${esc(next.title)} →</a>` : '<span></span>'}</nav>
<a class="back" href="${prefix}../index.html${back ? '#' + back : ''}">← back to the film${back ? '' : ''}</a>
</main>
</div>
</body>
</html>
`;
}

// ------------------------------------------------------------------ build
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'roles'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'scripts/read.css'), path.join(OUT, 'read.css'));

const brief = briefSections();
let count = 0;
pages.forEach((p, i) => {
  const prefix = p.out.includes('/') ? '../' : '';
  let body, sourceAttr = '';
  if (p.kind === 'pkg') {
    let md = fs.readFileSync(path.join(PKG, p.src), 'utf8');
    md = md.replace(/^---\n[\s\S]*?\n---\n/, ''); // front matter is metadata, not reading
    body = linkify(anchorHeadings(marked.parse(md)), prefix);
    body = `<p class="source">Rendered from <a href="${REPO}/blob/main/${esc(p.src)}"><code>${esc(p.src)}</code></a>, as written.</p>\n` + body;
    sourceAttr = ` data-source="${esc(p.src)}"`;
  } else {
    const parts = p.sections.map((n) => {
      const s = brief[n];
      if (!s) throw new Error(`brief section ${n} missing`);
      const id = n === 3 ? 'what-comes-back' : slug(s.title);
      const heading = p.sections.length > 1 ? `<h2 id="${id}">${esc(s.title)}</h2>\n` : '';
      return heading + marked.parse(s.body);
    });
    body = `<h1>${esc(p.title)}</h1>\n` + claimify(parts.join('\n'));
    if (p.out === 'index.html') {
      body += `\n<h2 id="get-it">Get it</h2>\n<p data-claim="C-73">Schism lives at <a href="${REPO}">github.com/Samuele95/schism</a>, under the MIT licence, by Samuele Stronati. Install the <code>schism/</code> folder next to Alchemist and choose a prompt compiler: <a href="https://samuele95.github.io/prometheus/">Prometheus</a>, or a plain LLM call; <a href="install.html">install and run</a> has the details.</p>`;
      body += `\n<h2 id="contents">In the reading room</h2>\n<ul class="contents">${pages.slice(1).map((q) => `<li><a href="${q.out}">${esc(q.title)}</a></li>`).join('')}</ul>`;
    }
    if (p.out === 'branches.html') {
      body += `\n<p>The full recipe for closed models is in <a href="cards/semantic-branch.html">the semantic-branch card</a>; the residual stream and its writers are in <a href="cards/stream-and-capture.html">the stream card</a>.</p>`;
    }
  }
  fs.writeFileSync(path.join(OUT, p.out), page(p, i, body, sourceAttr));
  count++;
});
console.log(`reading room: ${count} pages → ${path.relative(ROOT, OUT)}`);
