#!/usr/bin/env node
// Baut eine eigenstaendige StudyHub-Lernseite aus einer Inhaltsdatei und dem
// gemeinsamen Design-System (assets/). Keine Abhaengigkeiten, Node >= 18.
//
//   node build-guide.mjs <inhalt.content.html> --out summaries/bmsw/physik/thema.html
//   node build-guide.mjs summaries/bmsw/physik/thema.html            # bestehende Seite neu bauen
//   node build-guide.mjs <datei> --out x.html --subject Physik        # Fach ueberschreiben
//   node build-guide.mjs --themes                                     # Farbtabelle + Kontraste
//   node build-guide.mjs --resolve "Wirtschaft & Recht"               # Fach-Aufloesung testen

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadSubjects, resolveSubject, deriveTheme, themeCss, themeReport } from './lib/subjects.mjs';

export const VERSION = '2';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(HERE, '../assets');
const SITE = 'https://studyhub-bmsw.netlify.app/';
const START = '<!-- sh:content:start -->';
const END = '<!-- sh:content:end -->';
const PS_START = '<!-- sh:page-scripts:start -->';
const PS_END = '<!-- sh:page-scripts:end -->';
const FORBIDDEN_TEXT = [/offline\s*nutzbar/i, /lokal im browser nutzbar/i];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonForScript = (v) => JSON.stringify(v, null, 2).replace(/</g, '\\u003c');

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/** Trennt Meta, Inhalt und Seitenskripte – aus einer Inhaltsdatei oder einer bereits gebauten Seite. */
export function parseSource(src) {
  let content, meta, rebuilt = false;
  const metaRe = /<script\s+type="application\/json"\s+id="sh-meta"\s*>([\s\S]*?)<\/script>/;
  if (src.includes(START) && src.includes(END)) {
    rebuilt = true;
    content = src.slice(src.indexOf(START) + START.length, src.indexOf(END));
    const ps = src.includes(PS_START) ? src.slice(src.indexOf(PS_START) + PS_START.length, src.indexOf(PS_END)) : '';
    content += '\n' + ps.trim();
    const m = src.match(metaRe);
    meta = m ? JSON.parse(m[1]) : null;
  } else {
    const m = src.match(metaRe);
    meta = m ? JSON.parse(m[1]) : null;
    // Autoren-Kommentare gehoeren nicht auf die oeffentliche Seite.
    content = src.replace(metaRe, '').replace(/<!--[\s\S]*?-->/g, '');
  }
  // Seitenspezifische Skripte (Simulationen) ans Ende verschieben, JSON-Daten bleiben im Inhalt.
  const scripts = [];
  content = content.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (all, a) => {
    if (/type="application\/(ld\+)?json"/.test(a)) return all;
    scripts.push(all.trim());
    return '';
  });
  return { meta, content: content.trim(), scripts, rebuilt };
}

function relHref(outFile, rootFile) {
  if (!outFile) return null;
  const abs = path.resolve(outFile);
  const parts = abs.split(path.sep);
  const i = parts.lastIndexOf('summaries');
  if (i < 0) return null;
  const repoRoot = parts.slice(0, i).join(path.sep) || path.sep;
  return path.relative(path.dirname(abs), path.join(repoRoot, rootFile)).split(path.sep).join('/');
}

/**
 * @returns {{html:string, errors:string[], warnings:string[], nav:Array, subject:object}}
 */
export function buildGuide(src, opts = {}) {
  const errors = [], warnings = [];
  const { meta: rawMeta, content, scripts } = parseSource(src);
  if (!rawMeta) {
    errors.push('Kein <script type="application/json" id="sh-meta"> gefunden.');
    return { html: '', errors, warnings, nav: [] };
  }
  const meta = { ...rawMeta };
  if (opts.subject) meta.subject = opts.subject;
  for (const k of ['subject', 'topic', 'title']) if (!meta[k]) errors.push(`sh-meta: Pflichtfeld "${k}" fehlt.`);

  const subjects = loadSubjects();
  const subj = resolveSubject(meta.subject, subjects);
  warnings.push(...subj.warnings);
  const subjectLabel = meta.subjectLabel || subj.label;
  const theme = deriveTheme(subj.accent);

  // ---------- Navigation aus <section data-nav> ----------
  const ids = [...content.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) errors.push('Doppelte IDs im Inhalt: ' + [...new Set(dup)].join(', '));
  const reserved = ids.filter((x) => /^sh-(?!glossary$|exam-summary$)/.test(x) || x === 'main');
  if (reserved.length) errors.push('Reservierte IDs im Inhalt (sh-*, main): ' + reserved.join(', '));

  const nav = [];
  for (const m of content.matchAll(/<section\b[^>]*>/g)) {
    const a = attrs(m[0]);
    if (!('data-nav' in a)) continue;
    if (!a.id) { errors.push(`<section data-nav="${a['data-nav']}"> ohne id.`); continue; }
    nav.push({ id: a.id, label: a['data-nav'], num: a['data-nav-num'] || '', icon: a['data-nav-icon'] || '', group: a['data-nav-group'] || 'Inhalt', objective: a['data-objective'] || '' });
  }
  if (!nav.length) errors.push('Keine <section id="…" data-nav="…"> gefunden – die Seitennavigation wäre leer.');
  const groups = [];
  for (const n of nav) {
    let g = groups.find((x) => x.name === n.group);
    if (!g) groups.push((g = { name: n.group, items: [] }));
    g.items.push(n);
  }
  const navHtml = groups.map((g) => [
    `  <p class="sh-nav-caption">${esc(g.name)}</p>`,
    '  <ul class="sh-nav-list">',
    ...g.items.map((n) => `    <li><a class="sh-nav-link" href="#${esc(n.id)}"><span class="sh-nav-num" aria-hidden="true">${esc(n.num || n.icon || '•')}</span><span>${esc(n.label)}</span></a></li>`),
    '  </ul>',
  ].join('\n')).join('\n');

  // ---------- Original-Lernziele (woertlich, in der Sidebar) ----------
  // meta.objectives: [{ id: "5.1", text: "<exakter Wortlaut>", scope?: "confirmed"|"adjacent", href?: "#abschnitt", key?: "5.1" }]
  // id = Nummerierung exakt wie im Original (Anzeige). key = Verknuepfung via data-objective
  // (Standard: id ohne Leerzeichen/Kommas, z. B. "2.3 a)" -> "2.3a)").
  // Der Text wird NUR escaped, nie veraendert. Abdeckung wird ueber data-objective im Inhalt geprueft.
  const coverage = [];
  let objectivesSidebar = '';
  const tagged = [];
  for (const m of content.matchAll(/<\w+\b[^>]*\sdata-objective="([^"]*)"[^>]*>/g)) {
    const a = attrs(m[0]);
    const cls = a.class || '';
    const kind = /\bsh-ex\b/.test(cls) ? 'ex' : /\bsh-exam-task\b/.test(cls) ? 'exam' : /\bsh-q\b/.test(cls) ? 'quiz' : m[0].startsWith('<section') ? 'section' : 'other';
    for (const id of a['data-objective'].split(/[\s,]+/).filter(Boolean)) tagged.push({ id, kind, elId: a.id || '' });
  }
  const objectives = Array.isArray(meta.objectives) ? meta.objectives : [];
  if (meta.objectives != null && !Array.isArray(meta.objectives)) errors.push('sh-meta: "objectives" muss ein Array sein.');
  const seenObj = new Set();
  const keyOf = (o) => String(o.key ?? o.id ?? '').trim().replace(/[\s,]+/g, '');
  for (const o of objectives) {
    const num = String(o.id ?? '').trim();
    const id = keyOf(o);
    const text = o.text ?? o.label;
    if (!num) errors.push('Lernziel ohne "id" (Originalnummerierung).');
    if (!text || !String(text).trim()) errors.push(`Lernziel ${id}: "text" (Originalwortlaut) fehlt.`);
    if (seenObj.has(id)) errors.push(`Lernziel ${id} doppelt.`);
    seenObj.add(id);
    const scope = o.scope === 'adjacent' ? 'adjacent' : 'confirmed';
    const sec = o.href ? String(o.href).replace(/^#/, '') : ((tagged.find((t) => t.id === id && t.kind === 'section') || {}).elId || '');
    const count = (k) => tagged.filter((t) => t.id === id && t.kind === k).length;
    const row = { id, num, scope, section: sec, exercises: count('ex'), exam: count('exam'), quiz: count('quiz') };
    coverage.push(row);
    if (sec && !ids.includes(sec)) errors.push(`Lernziel ${id}: Sprungziel #${sec} existiert nicht.`);
    if (scope === 'confirmed') {
      if (!sec) errors.push(`Abdeckungslücke: Lernziel ${id} hat keinen Abschnitt (<section data-objective="${id}"> fehlt).`);
      if (!row.exercises && !row.exam) errors.push(`Abdeckungslücke: Lernziel ${id} hat keine Übung (.sh-ex/.sh-exam-task mit data-objective="${id}").`);
      if (!row.quiz && !row.exam) warnings.push(`Lernziel ${id}: keine Konzeptfrage/Prüfungsaufgabe mit data-objective="${id}".`);
    }
  }
  const knownIds = new Set(objectives.map(keyOf));
  if (objectives.length) for (const t of new Set(tagged.map((x) => x.id))) if (!knownIds.has(t)) errors.push(`data-objective="${t}" verweist auf kein Lernziel in sh-meta.objectives (gültig: ${[...knownIds].join(', ')}).`);
  if (objectives.length) {
    const item = (o) => {
      const id = keyOf(o);
      const row = coverage.find((c) => c.id === id);
      const key = id.replace(/[^\w.-]/g, '_');
      return `      <li class="sh-lz-item${row.scope === 'adjacent' ? ' is-adjacent' : ''}" data-lz="${esc(id)}">
        <p class="sh-lz-text"><span class="sh-lz-num">${esc(row.num)}</span> <span class="sh-lz-wording">${esc(o.text ?? o.label)}</span></p>
        <div class="sh-lz-actions">
          <label class="sh-lz-check"><input type="checkbox" data-lz-check="${esc(key)}"> verstanden</label>
          ${row.section ? `<a class="sh-lz-link" href="#${esc(row.section)}">Zum Kapitel →</a>` : ''}
        </div>
      </li>`;
    };
    const confirmed = objectives.filter((o) => o.scope !== 'adjacent');
    const adjacent = objectives.filter((o) => o.scope === 'adjacent');
    objectivesSidebar = `  <details class="sh-lz" id="sh-lz">
    <summary><span>Original-Lernziele</span><span class="sh-lz-count" id="sh-lz-count">0 von ${objectives.length} verstanden</span></summary>
    <div class="sh-lz-body">
      ${meta.objectivesHeading ? `<p class="sh-lz-heading">${esc(meta.objectivesHeading)}</p>` : ''}
      ${meta.objectivesSource ? `<p class="sh-lz-source">Wortlaut aus: ${esc(meta.objectivesSource)}</p>` : ''}
      <p class="sh-lz-note">Selbsteinschätzung – wird nur auf diesem Gerät gespeichert und sagt nichts darüber, ob die Seite das Lernziel abdeckt.</p>
      <ol class="sh-lz-list">
${confirmed.map(item).join('\n')}
      </ol>${adjacent.length ? `
      <p class="sh-lz-subhead">Angrenzend – Prüfungsumfang nicht bestätigt</p>
      <ol class="sh-lz-list">
${adjacent.map(item).join('\n')}
      </ol>` : ''}
    </div>
  </details>`;
  } else {
    warnings.push('Keine Original-Lernziele (sh-meta.objectives) – nur zulässig, wenn kein offizielles Lernziel-Dokument vorliegt.');
  }

  // ---------- Glossar ----------
  let glossary = [];
  const gm = content.match(/<script\s+type="application\/json"\s+id="sh-glossary"\s*>([\s\S]*?)<\/script>/);
  if (gm) {
    try {
      glossary = JSON.parse(gm[1]);
      if (!Array.isArray(glossary)) throw new Error('kein Array');
      glossary.forEach((e, i) => { if (!e || !e.symbol || !e.name) errors.push(`Glossar-Eintrag ${i + 1}: "symbol" und "name" sind Pflicht.`); });
    } catch (e) { errors.push('sh-glossary ist kein gültiges JSON-Array: ' + e.message); }
  }
  const gTitle = meta.glossaryTitle || 'Formelzeichen-Legende';
  const gShort = meta.glossaryShort || 'Formeln';
  const sample = glossary.slice(0, 3).map((e) => String(e.symbol).replace(/[_{}]/g, '')).join(', ');
  const hasGlossary = glossary.length > 0;
  const sidebarGlossary = hasGlossary ? `  <div class="sh-glossary">
    <p class="sh-nav-caption">Nachschlagen</p>
    <button type="button" class="sh-glossary-toggle" id="sh-glossary-toggle" aria-expanded="false" aria-controls="sh-glossary-panel"><span>⌕&nbsp; ${esc(gTitle)}</span><span class="sh-kbd-hint"><kbd class="sh-kbd">L</kbd></span></button>
    <div class="sh-glossary-panel" id="sh-glossary-panel" hidden>
      <label for="sh-glossary-search">Zeichen, Einheit oder Begriff</label>
      <input id="sh-glossary-search" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(meta.glossaryPlaceholder || (sample ? 'z. B. ' + sample : 'Suchbegriff'))}" aria-describedby="sh-glossary-help">
      <p class="sh-glossary-help" id="sh-glossary-help">Schreibweisen wie F_G, FG oder rho funktionieren auch. <span class="sh-kbd-hint">Taste <kbd class="sh-kbd">L</kbd> öffnet die Legende.</span></p>
      <p class="sh-glossary-status" id="sh-glossary-status" role="status" aria-live="polite"></p>
      <ul class="sh-glossary-results" id="sh-glossary-results"></ul>
    </div>
  </div>` : '';
  const topbarGlossary = hasGlossary ? `<button type="button" class="sh-icon-btn" data-sh-open-glossary aria-label="${esc(gTitle)} öffnen"><span aria-hidden="true">⌕</span><span class="sh-btn-label">${esc(gShort)}</span></button>` : '';
  const fabGlossary = hasGlossary ? `<button type="button" class="sh-icon-btn sh-glossary-fab" id="sh-glossary-fab" data-sh-open-glossary aria-label="${esc(gTitle)} öffnen"><span aria-hidden="true">⌕</span><span>${esc(gTitle)}</span><span class="sh-kbd-hint"><kbd class="sh-kbd">L</kbd></span></button>` : '';
  if (!hasGlossary) warnings.push('Kein Glossar (sh-glossary) – für Fächer mit Formelzeichen/Fachbegriffen ergänzen.');

  // ---------- Inhaltspruefungen ----------
  const all = JSON.stringify(meta) + content + scripts.join('');
  if (all.includes('ß')) errors.push('"ß" gefunden – in Schweizer Hochdeutsch immer "ss".');
  for (const re of FORBIDDEN_TEXT) if (re.test(all)) errors.push(`Unerwünschtes Werbe-/Statuslabel gefunden (${re}).`);
  if (!/class="[^"]*\bsh-ex\b/.test(content)) warnings.push('Keine Übungen (.sh-ex) gefunden.');
  if (/<section\b[^>]*data-nav[^>]*>/.test(content) && !/<h2\b/.test(content)) warnings.push('Keine <h2> im Inhalt – jede Kapitel-Section braucht eine h2.');
  if (/\bstyle="[^"]*#[0-9a-f]{3,6}/i.test(content)) warnings.push('Inline-Hexfarben im Inhalt – Design-Tokens (var(--…)) bzw. dg-*-Klassen verwenden.');
  for (const m of content.matchAll(/<svg\b[^>]*>/g)) if (!/viewBox=/.test(m[0])) errors.push('SVG ohne viewBox (nicht responsiv): ' + m[0].slice(0, 80));
  for (const m of content.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(m[0])) errors.push('<img> ohne alt: ' + m[0].slice(0, 80));
  const mOpen = (content.match(/<math\b/g) || []).length, mClose = (content.match(/<\/math>/g) || []).length;
  if (mOpen !== mClose) errors.push(`<math> nicht ausgeglichen: ${mOpen} offen / ${mClose} geschlossen.`);

  // ---------- Zusammenbauen ----------
  const home = opts.home || meta.home || relHref(opts.out, 'index.html') || SITE;
  const favicon = opts.favicon || relHref(opts.out, 'favicon.svg') || SITE + 'favicon.svg';
  const school = meta.school || 'BMS';
  const storedMeta = { ...rawMeta };
  if (opts.subject) storedMeta.subject = opts.subject;
  const values = {
    lang: meta.lang || 'de',
    version: VERSION,
    subjectKey: subj.key,
    description: meta.description || `${meta.title} – ${subjectLabel}, ${meta.topic}: Theorie, Beispiele, Übungen mit Lösungen und Probeprüfung.`,
    pageTitle: meta.pageTitle || `${meta.topic} – ${subjectLabel} · Prüfungsvorbereitung`,
    favicon,
    css: readFileSync(path.join(ASSETS, 'studyhub-guide.css'), 'utf8').trim(),
    themeCss: `/* Fach: ${subj.key} (${subj.accent}) – berechnet aus assets/subjects.json */\n${themeCss(theme)}`,
    metaJson: jsonForScript(storedMeta),
    subjectLabel,
    shortTitle: meta.shortTitle || meta.topic,
    homeHref: home,
    brandSymbol: meta.symbol || subjectLabel.charAt(0),
    brandSub: `${school} · ${meta.topic}`,
    navHtml,
    sidebarGlossary,
    topbarGlossary,
    fabGlossary,
    eyebrow: meta.eyebrow || `${subjectLabel} · ${school}${meta.eyebrowExtra ? ' · ' + meta.eyebrowExtra : ''}`,
    title: meta.title,
    topic: meta.topic,
    leadHtml: meta.lead ? `<p class="sh-lead">${esc(meta.lead)}</p>` : '',
    tagsHtml: Array.isArray(meta.tags) && meta.tags.length ? `<ul class="sh-tags" aria-label="Umfang">${meta.tags.map((t) => `<li class="sh-tag">${esc(t)}</li>`).join('')}</ul>` : '',
    examInfoHtml: meta.examInfo ? `<p class="sh-exam-info">${esc(meta.examInfo)}</p>` : '',
    objectivesSidebar,
    content,
    coreJs: readFileSync(path.join(ASSETS, 'sh-core.js'), 'utf8').trim(),
    runtimeJs: readFileSync(path.join(ASSETS, 'studyhub-guide.js'), 'utf8').trim(),
    pageScripts: scripts.length ? `${PS_START}\n${scripts.join('\n')}\n${PS_END}` : '',
  };
  const RAW = new Set(['css', 'themeCss', 'metaJson', 'navHtml', 'sidebarGlossary', 'topbarGlossary', 'fabGlossary', 'leadHtml', 'tagsHtml', 'examInfoHtml', 'objectivesSidebar', 'content', 'coreJs', 'runtimeJs', 'pageScripts']);
  const shell = readFileSync(path.join(ASSETS, 'guide-shell.html'), 'utf8');
  const html = shell.replace(/\{\{(\w+)\}\}/g, (all, k) => {
    if (!(k in values)) { errors.push(`Template-Platzhalter ohne Wert: ${k}`); return ''; }
    return RAW.has(k) ? values[k] : esc(values[k]);
  });
  return { html, errors, warnings, nav, coverage, subject: { ...subj, label: subjectLabel, theme } };
}

// ---------- CLI ----------
function cli(argv) {
  const args = argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
  if (args.includes('--help') || args.includes('-h') || !args.length) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return 0;
  }
  if (args[0] === '--themes') {
    const data = loadSubjects();
    console.log('Fach'.padEnd(14), 'Akzent ', 'Text   ', 'Text/Soft', 'Button', 'Indikator');
    let bad = 0;
    for (const [key, s] of Object.entries(data.subjects)) {
      const t = deriveTheme(s.accent), r = themeReport(t);
      const ok = r.textOnSoft >= 4.5 && r.textOnCanvas >= 4.5 && r.buttonText >= 4.5 && r.indicatorOnCanvas >= 3;
      if (!ok) bad++;
      console.log(key.padEnd(14), s.accent, t['--subject-text'], r.textOnSoft.toFixed(2).padStart(9), r.buttonText.toFixed(2).padStart(6), r.indicatorOnCanvas.toFixed(2).padStart(9), ok ? 'AA ✓' : 'FEHLER');
    }
    return bad ? 1 : 0;
  }
  if (args[0] === '--resolve') {
    const r = resolveSubject(args.slice(1).join(' '));
    console.log(JSON.stringify({ key: r.key, label: r.label, accent: r.accent, via: r.via, warnings: r.warnings }, null, 2));
    return r.matched ? 0 : 1;
  }
  const subject = opt('--subject'), out = opt('--out'), home = opt('--home'), favicon = opt('--favicon');
  const input = args[0];
  const src = readFileSync(input, 'utf8');
  const target = out || (src.includes(START) ? input : null);
  if (!target) { console.error('FEHLER: --out <ziel.html> angeben (Eingabe ist eine Inhaltsdatei, keine gebaute Seite).'); return 2; }
  const res = buildGuide(src, { subject, out: target, home, favicon });
  res.warnings.forEach((w) => console.log('WARNUNG: ' + w));
  if (res.errors.length) { res.errors.forEach((e) => console.error('FEHLER: ' + e)); console.error(`Abbruch – ${res.errors.length} Fehler, nichts geschrieben.`); return 1; }
  mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  writeFileSync(target, res.html);
  console.log(`OK  ${target}`);
  if (res.coverage.length) {
    console.log('    Lernziel-Abdeckung (Abschnitt · Übungen · Prüfung · Quiz):');
    for (const c of res.coverage) console.log(`      ${c.num.padEnd(6)} ${c.scope === 'adjacent' ? '(angrenzend) ' : ''}#${c.section || '—'} · ${c.exercises} · ${c.exam} · ${c.quiz}`);
  }
  console.log(`    Fach: ${res.subject.label} (${res.subject.key}, ${res.subject.accent}) · ${res.nav.length} Kapitel · ${Math.round(res.html.length / 1024)} KB`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exit(cli(process.argv));
