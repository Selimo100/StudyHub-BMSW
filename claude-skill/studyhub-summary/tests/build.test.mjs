import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildGuide, parseSource } from '../scripts/build-guide.mjs';
import { loadSubjects, resolveSubject, deriveTheme, themeReport, normalizeKey, contrast } from '../scripts/lib/subjects.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE = readFileSync(path.join(HERE, '../assets/example/auftrieb.content.html'), 'utf8');
const OUT = '/repo/summaries/bmsw/physik/auftrieb.html';

test('Fach-Aufloesung: Aliase, Slugs, Muster, Fallback', () => {
  const k = (s) => resolveSubject(s).key;
  assert.equal(k('Physik'), 'physik');
  assert.equal(k('physics'), 'physik');
  assert.equal(k('Mathe'), 'mathematik');
  assert.equal(k('mathe-glf'), 'mathematik');
  assert.equal(k('Wirtschaft & Recht'), 'wirtschaft');
  assert.equal(k('W&R'), 'wirtschaft');
  assert.equal(k('wirtschaft-recht'), 'wirtschaft');
  assert.equal(k('Geschichte und Politik'), 'geschichte');
  assert.equal(k('Französisch'), 'franzoesisch');
  assert.equal(k('FRANZOESISCH'), 'franzoesisch');
  assert.equal(k('french'), 'franzoesisch');
  assert.equal(k('english-books'), 'englisch');
  assert.equal(k('m347'), 'informatik');
  assert.equal(k('BMS Physik Teil 2'), 'physik');
  const unknown = resolveSubject('Philosophie');
  assert.equal(unknown.key, 'andere');
  assert.equal(unknown.label, 'Philosophie'); // Fachname bleibt sichtbar
  assert.equal(unknown.matched, false);
  assert.equal(normalizeKey('Wirtschaft & Recht'), 'wirtschaft-und-recht');
});

test('Fach-Aliase sind eindeutig (kein Alias zeigt auf zwei Faecher)', () => {
  const data = loadSubjects();
  const seen = new Map();
  for (const [key, s] of Object.entries(data.subjects)) {
    for (const a of [key, ...s.aliases]) {
      const c = normalizeKey(a).replace(/-/g, '');
      assert.ok(!seen.has(c) || seen.get(c) === key, `Alias "${a}" doppelt: ${seen.get(c)} / ${key}`);
      seen.set(c, key);
    }
    assert.match(s.accent, /^#[0-9A-F]{6}$/i);
    assert.ok(s.label && !s.label.includes('ß'));
  }
});

test('Jedes Fach erfuellt WCAG AA mit den abgeleiteten Varianten', () => {
  for (const [key, s] of Object.entries(loadSubjects().subjects)) {
    const r = themeReport(deriveTheme(s.accent));
    assert.ok(r.textOnWhite >= 4.5, `${key}: Text/Weiss ${r.textOnWhite}`);
    assert.ok(r.textOnCanvas >= 4.5, `${key}: Text/Canvas ${r.textOnCanvas}`);
    assert.ok(r.textOnSoft >= 4.5, `${key}: Text/Soft ${r.textOnSoft}`);
    assert.ok(r.buttonText >= 4.5, `${key}: Buttontext ${r.buttonText}`);
    assert.ok(r.buttonHoverText >= 4.5, `${key}: Buttontext Hover ${r.buttonHoverText}`);
    assert.ok(r.indicatorOnWhite >= 3 && r.indicatorOnCanvas >= 3, `${key}: Indikator ${r.indicatorOnCanvas}`);
  }
});

test('Neutrale Status-Tokens im CSS erfuellen AA auf Weiss', () => {
  const css = readFileSync(path.join(HERE, '../assets/studyhub-guide.css'), 'utf8');
  const tok = (n) => css.match(new RegExp(`--${n}:\\s*(#[0-9A-Fa-f]{6})`))[1];
  for (const n of ['sh-heading', 'sh-text', 'sh-muted', 'sh-success', 'sh-warning', 'sh-error']) {
    assert.ok(contrast(tok(n), '#FFFFFF') >= 4.5, n);
    assert.ok(contrast(tok(n), tok('sh-bg')) >= 4.5, n + ' auf Canvas');
  }
  assert.ok(contrast(tok('sh-warning'), tok('sh-warning-soft')) >= 4.5, 'Warnung auf Warnflaeche');
  assert.ok(contrast(tok('sh-success'), tok('sh-success-soft')) >= 4.5, 'Erfolg auf Erfolgsflaeche');
  assert.ok(contrast(tok('sh-error'), tok('sh-error-soft')) >= 4.5, 'Fehler auf Fehlerflaeche');
});

test('Beispielseite baut fehlerfrei', () => {
  const r = buildGuide(EXAMPLE, { out: OUT });
  assert.deepEqual(r.errors, []);
  assert.equal(r.subject.key, 'physik');
  assert.equal(r.nav.length, 6);
});

test('Gebaute Seite: Grundgeruest, Theme, Navigation, keine Werbelabels', () => {
  const { html, nav } = buildGuide(EXAMPLE, { out: OUT });
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="de" data-sh-guide="2" data-subject="physik">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">/);
  assert.match(html, /<title>Fluidstatik – Auftrieb – Physik · Prüfungsvorbereitung<\/title>/);
  assert.match(html, /--subject-accent:#1479B8/);
  assert.match(html, /--subject-text:#[0-9A-F]{6}/);
  for (const n of nav) assert.ok(html.includes(`href="#${n.id}"`) && html.includes(`id="${n.id}"`), n.id);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<main class="sh-main" id="main"/);
  assert.match(html, /aria-label="Kapitelnavigation"/);
  assert.match(html, /id="sh-glossary-toggle"/);
  assert.match(html, /<kbd class="sh-kbd">L<\/kbd>/);
  assert.doesNotMatch(html, /offline\s*nutzbar|lokal im browser nutzbar/i);
  assert.ok(!html.includes('ß'), 'kein scharfes S in der gebauten Seite (inkl. Runtime)');
  assert.doesNotMatch(html, /\{\{\w+\}\}/, 'keine offenen Template-Platzhalter');
  assert.doesNotMatch(html, /<!--(?! sh:)[\s\S]*?-->/, 'Autorenkommentare entfernt');
  assert.equal(html.match(/href="\.\.\/\.\.\/\.\.\/index\.html"/g).length >= 2, true, 'relativer Link zur Uebersicht');
  // Seitenskript (Simulation) nach der Runtime
  assert.ok(html.indexOf('window.StudyHubGuide') < html.indexOf("getElementById('sim-rk')"));
  // keine doppelten IDs
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), []);
});

test('Fachwechsel aendert nur Akzentfarben und Fachlabel', () => {
  const a = buildGuide(EXAMPLE, { out: OUT }).html;
  const b = buildGuide(EXAMPLE, { out: OUT, subject: 'Geschichte' }).html;
  assert.match(b, /data-subject="geschichte"/);
  assert.match(b, /--subject-accent:#866018/);
  const strip = (h) => h.replace(/:root\{--subject[^}]*\}/, '').replace(/\/\* Fach:[^*]*\*\//, '').replace(/data-subject="\w+"/, '')
    .replace(/Physik|Geschichte/g, 'FACH').replace(/"subject": "\w+"/, '');
  assert.equal(strip(a), strip(b));
});

test('Neubau einer gebauten Seite ist idempotent', () => {
  const first = buildGuide(EXAMPLE, { out: OUT }).html;
  const parsed = parseSource(first);
  assert.equal(parsed.rebuilt, true);
  assert.equal(parsed.scripts.length, 1);
  const second = buildGuide(first, { out: OUT }).html;
  assert.equal(second, first);
});

test('Builder weist fehlerhafte Inhalte ab', () => {
  const meta = '<script type="application/json" id="sh-meta">{"subject":"Physik","topic":"T","title":"T"}</script>';
  const sec = '<section id="a" data-nav="A"><h2>A</h2></section>';
  const errs = (c) => buildGuide(meta + c, { out: OUT }).errors.join(' ');
  assert.match(buildGuide('<section></section>').errors.join(), /sh-meta/);
  assert.match(errs(sec + '<p>Strasse ist richtig, Straße nicht</p>'), /ß/);
  assert.match(errs(sec + '<footer>Offline nutzbar · mit Lösungen</footer>'), /Werbe/);
  assert.match(errs(sec + '<section id="a" data-nav="B"></section>'), /Doppelte IDs/);
  assert.match(errs('<section data-nav="X"><h2>x</h2></section>'), /ohne id/);
  assert.match(errs(sec + '<svg width="10"><rect/></svg>'), /viewBox/);
  assert.match(errs(sec + '<img src="x.png">'), /alt/);
  assert.match(errs(sec + '<math><mi>x</mi>'), /math/);
  assert.match(errs(sec + '<div id="sh-topbar"></div>'), /Reservierte/);
  assert.match(errs(sec + '<script type="application/json" id="sh-glossary">[{"symbol":"x"}]</script>'), /name/);
  assert.match(buildGuide(meta.replace('"title":"T"', '"title":""') + sec).errors.join(), /title/);
  assert.match(buildGuide(meta.replace('"T","title"', '"T","objectives":[{"id":"1","label":"x","href":"#fehlt"}],"title"') + sec, { out: OUT }).errors.join(), /fehlt/);
});

test('Fallback-Links ausserhalb des Repos zeigen auf die Website', () => {
  const { html } = buildGuide(EXAMPLE, { out: '/tmp/x/test.html' });
  assert.match(html, /href="https:\/\/studyhub-bmsw\.netlify\.app\/"/);
});

// ---------- Original-Lernziele ----------
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const lzMeta = (objectives, extra = {}) => `<script type="application/json" id="sh-meta">${JSON.stringify({ subject: 'Mathematik', topic: 'T', title: 'T', objectives, ...extra })}</script>`;
const lzBody = (ids) => ids.map((id, i) => `<section id="k${i}" data-nav="K${i}" data-objective="${id}"><h2>K</h2><article class="sh-ex" data-objective="${id}"><h3>A</h3></article></section>`).join('');

test('Original-Lernziele: Wortlaut und Nummerierung bleiben exakt erhalten', () => {
  const tricky = 'Sie können  f(x) = x² − 3·x < 0 lösen & „Lösungsmenge“ angeben;\nauch für a ≠ 0 (vgl. 2.3a).';
  const { html, errors } = buildGuide(lzMeta([{ id: '2.3 a)', text: tricky }]) + lzBody(['2.3a)']), { out: OUT });
  assert.deepEqual(errors, []);
  const m = html.match(/<span class="sh-lz-wording">([\s\S]*?)<\/span>/);
  assert.equal(unesc(m[1]), tricky);
  assert.match(html, /<span class="sh-lz-num">2\.3 a\)<\/span>/);
});

test('Original-Lernziele: in der Sidebar, eingeklappt, nicht im Artikel', () => {
  const { html } = buildGuide(EXAMPLE, { out: OUT });
  const sidebar = html.slice(html.indexOf('<nav class="sh-sidebar"'), html.indexOf('</nav>', html.indexOf('<nav class="sh-sidebar"')));
  assert.match(sidebar, /<details class="sh-lz" id="sh-lz">/);
  assert.doesNotMatch(sidebar, /<details class="sh-lz"[^>]*\bopen\b/);
  assert.match(sidebar, /<summary><span>Original-Lernziele<\/span>/);
  assert.match(sidebar, /0 von 3 verstanden/);
  assert.equal((sidebar.match(/data-lz-check=/g) || []).length, 3);
  assert.ok(sidebar.indexOf('sh-lz') > sidebar.indexOf('sh-nav-list'), 'nach der Kapitelnavigation');
  assert.ok(sidebar.indexOf('sh-lz') < sidebar.indexOf('sh-glossary'), 'vor der Legende');
  assert.match(sidebar, /Angrenzend – Prüfungsumfang nicht bestätigt/);
  assert.match(sidebar, /Selbsteinschätzung/);
  const main = html.slice(html.indexOf('<div class="sh-shell"')).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
  assert.doesNotMatch(main, /sh-lz|Original-Lernziele/);
  for (const m of sidebar.matchAll(/class="sh-lz-link" href="#([^"]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), m[1]);
});

test('Original-Lernziele: Abdeckungslücken brechen den Build ab', () => {
  const e = (objs, body) => buildGuide(lzMeta(objs) + body, { out: OUT }).errors.join(' | ');
  assert.match(e([{ id: '1', text: 'a' }, { id: '2', text: 'b' }], lzBody(['1'])), /Lernziel 2 hat keinen Abschnitt/);
  assert.match(e([{ id: '1', text: 'a' }], '<section id="s" data-nav="S" data-objective="1"><h2>S</h2></section>'), /Lernziel 1 hat keine Übung/);
  assert.equal(e([{ id: '1', text: 'a' }, { id: '9', text: 'x', scope: 'adjacent' }], lzBody(['1'])), '');
  assert.match(e([{ id: '1', text: 'a' }], lzBody(['1', '7'])), /data-objective="7" verweist auf kein Lernziel/);
  assert.match(e([{ id: '1', text: 'a' }, { id: '1', text: 'b' }], lzBody(['1'])), /doppelt/);
  assert.match(e([{ id: '1', text: '' }], lzBody(['1'])), /Originalwortlaut/);
  assert.match(e([{ id: '1', text: 'a', href: '#gibtsnicht' }], lzBody(['1'])), /existiert nicht/);
});

test('Ohne offizielle Lernziele kein Lernziel-Block, aber Warnung', () => {
  const r = buildGuide('<script type="application/json" id="sh-meta">{"subject":"Physik","topic":"T","title":"T"}</script><section id="a" data-nav="A"><h2>A</h2></section>', { out: OUT });
  assert.doesNotMatch(r.html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ''), /sh-lz/);
  assert.ok(r.warnings.some((w) => /Original-Lernziele/.test(w)));
});
