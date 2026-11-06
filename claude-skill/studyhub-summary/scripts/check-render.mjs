#!/usr/bin/env node
// Rendert eine StudyHub-Lernseite in einem echten Chromium (Chrome/Edge/Chromium/Brave,
// headless) in allen Pflicht-Viewports und prueft Layout und Interaktion.
// Keine npm-Abhaengigkeiten: spricht das DevTools-Protokoll ueber Node-WebSocket (Node >= 22).
//
//   node check-render.mjs <seite.html> [--screenshots <ordner>] [--browser <pfad>] [--only 390x844]
//   node check-render.mjs <seite.html> --serve [--open safari|default] [--host 0.0.0.0]
//
// Modus 1 (Standard): headless Chromium ueber das DevTools-Protokoll.
// Modus 2 (--serve):  Fallback ohne DevTools (z. B. wenn eine Firmen-Policy Remote-Debugging
//   sperrt). Startet einen lokalen Server; ein normales Browserfenster (Safari = WebKit wie iOS,
//   oder per URL auch ein echtes Handy im selben Netz) fuehrt dieselben Checks in iframes je
//   Viewport aus und schickt das Ergebnis an das Skript zurueck.
//
// Exit 0 = alle Checks bestanden, 1 = Fehler gefunden, 2 = nicht pruefbar (kein Browser / Policy).

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const VIEWPORTS = [
  [320, 720], [360, 800], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900],
];
const DRAWER_MAX = 959.98;

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

export function findBrowser(explicit) {
  if (explicit) return existsSync(explicit) ? explicit : null;
  return CANDIDATES.find((p) => existsSync(p)) || null;
}

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new Cdp(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id); c.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else c.listeners.forEach((l) => l(msg));
    };
    return c;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(fn) { this.listeners.push(fn); }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

async function launch(browserPath) {
  const userDir = mkdtempSync(path.join(tmpdir(), 'sh-render-'));
  const proc = spawn(browserPath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${userDir}`, '--no-first-run',
    '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--allow-file-access-from-files', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => { proc.kill(); rej(new Error('Browser-Start Timeout')); }, 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); res(m[1]); }
      if (/disallowed by the system admin/i.test(buf)) { clearTimeout(t); proc.kill(); rej(Object.assign(new Error('DevTools/Headless ist per Admin-Policy gesperrt.'), { policy: true })); }
    });
    proc.on('exit', (code) => { clearTimeout(t); rej(new Error('Browser beendet, Code ' + code)); });
  });
  return { proc, wsUrl, userDir };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Laeuft IM Browser. Gibt {checks:[{name, ok, detail, severity}]} zurueck.
const PAGE_CHECKS = async function (DRAWER_MAX) {
  const out = [];
  const add = (name, ok, detail = '', severity = 'error') => out.push({ name, ok: !!ok, detail: String(detail).slice(0, 400), severity });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => { let done = false; requestAnimationFrame(() => requestAnimationFrame(() => { done = true; r(); })); setTimeout(() => { if (!done) r(); }, 120); });
  const vw = window.innerWidth;
  const isDrawer = vw <= DRAWER_MAX;
  const isPhone = vw < 600;
  const visible = (n) => { if (!n) return false; const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const inView = (n) => { const r = n.getBoundingClientRect(); return r.right > 0 && r.left < vw; };
  const key = (k, target = document) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  window.scrollTo(0, 0); await frame();

  add('Design-System-Marker', document.documentElement.getAttribute('data-sh-guide'), 'data-sh-guide fehlt – Seite nicht mit build-guide.mjs gebaut');

  // 1. Kein horizontales Scrollen der Seite
  const sw = document.documentElement.scrollWidth;
  let offenders = [];
  if (sw > vw + 1) {
    const scrollable = (n) => { for (let p = n.parentElement; p; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true; } return false; };
    offenders = [...document.querySelectorAll('body *')].filter((n) => { const r = n.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && !n.closest('.sh-sidebar') && !scrollable(n); })
      .slice(0, 6).map((n) => n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : '') + ` (rechts ${Math.round(n.getBoundingClientRect().right)}px)`);
  }
  add('Kein horizontales Scrollen', sw <= vw + 1, `scrollWidth ${sw} > ${vw}: ${offenders.join(', ')}`);

  // 2. Navigation: Sidebar vs. Drawer
  const sidebar = document.getElementById('sh-sidebar'), menu = document.getElementById('sh-menu-btn');
  if (isDrawer) {
    add('Drawer standardmässig geschlossen', !inView(sidebar) || !visible(sidebar), 'Sidebar ist auf schmalem Viewport sichtbar');
    add('Sidebar geschlossen nicht fokussierbar (inert)', sidebar.hasAttribute('inert'), 'inert fehlt');
    add('Menü-Button sichtbar', visible(menu));
    const tb = document.getElementById('sh-topbar').getBoundingClientRect();
    add('Kopfzeile schlank (≤ 72 px)', tb.height <= 72, `Höhe ${Math.round(tb.height)} px`);
    menu.click(); await wait(320);
    add('Drawer öffnet', document.body.classList.contains('sh-drawer-open') && visible(sidebar) && sidebar.getBoundingClientRect().left >= -1, 'nicht sichtbar nach Klick');
    add('Fokus im Drawer', sidebar.contains(document.activeElement), 'activeElement: ' + (document.activeElement && document.activeElement.tagName));
    add('Drawer breiter als 0 und schmaler als Viewport', sidebar.getBoundingClientRect().width < vw, 'Drawer deckt ganze Breite');
    add('Inhalt während Drawer inert', document.getElementById('sh-shell').hasAttribute('inert'));
    key('Escape'); await wait(320);
    add('Escape schliesst Drawer', !document.body.classList.contains('sh-drawer-open'));
    add('Fokus zurück auf Menü-Button', document.activeElement === menu, 'activeElement: ' + (document.activeElement && (document.activeElement.id || document.activeElement.tagName)));
    add('Seite nach Schliessen wieder scrollbar', document.documentElement.style.overflow === '', 'overflow: ' + document.documentElement.style.overflow);
    menu.click(); await wait(300);
    document.getElementById('sh-scrim').click(); await wait(300);
    add('Tippen auf Hintergrund schliesst Drawer', !document.body.classList.contains('sh-drawer-open'));
    menu.click(); await wait(300);
    document.getElementById('sh-close-btn').click(); await wait(300);
    add('Schliessen-Button schliesst Drawer', !document.body.classList.contains('sh-drawer-open'));
    const links = [...document.querySelectorAll('.sh-nav-link')];
    const target = links[Math.min(2, links.length - 1)];
    menu.click(); await wait(300);
    target.click(); await wait(700);
    const tid = target.getAttribute('href').slice(1);
    const sec = document.getElementById(tid);
    const top = sec.getBoundingClientRect().top;
    add('Kapitelwahl schliesst Drawer', !document.body.classList.contains('sh-drawer-open'));
    add('Kapitelsprung landet beim Kapitel', top > -4 && top < 140, `Kapitel-Oberkante bei ${Math.round(top)} px`);
    const tbAfter = document.getElementById('sh-topbar').getBoundingClientRect();
    const h2 = sec.querySelector('h2');
    add('Überschrift nicht von Kopfzeile verdeckt', !h2 || h2.getBoundingClientRect().top >= tbAfter.bottom - 1, `h2 bei ${h2 && Math.round(h2.getBoundingClientRect().top)}, Kopfzeile bis ${Math.round(tbAfter.bottom)}`);
    await wait(400);
    add('Aktiver Kapitel-Link markiert', document.querySelector('.sh-nav-link[aria-current="true"]'), 'kein aria-current');
  } else {
    add('Sidebar dauerhaft sichtbar', visible(sidebar) && inView(sidebar));
    add('Sidebar nicht inert', !sidebar.hasAttribute('inert'));
    add('Sidebar-Breite 240–290 px', sidebar.getBoundingClientRect().width >= 240 && sidebar.getBoundingClientRect().width <= 290, Math.round(sidebar.getBoundingClientRect().width) + ' px');
    add('Menü-Button verborgen', !visible(menu));
    const p = document.querySelector('.sh-main p');
    if (p) {
      const cs = getComputedStyle(p); const ch = parseFloat(cs.fontSize) * 0.5;
      const chars = p.getBoundingClientRect().width / ch;
      add('Zeilenlänge Fliesstext ≤ ~95 Zeichen', chars <= 100, `≈ ${Math.round(chars)} Zeichen`, 'warn');
    }
    const links = [...document.querySelectorAll('.sh-nav-link')];
    const last = links[links.length - 1];
    last.click(); await wait(800);
    add('Aktiver Kapitel-Link folgt dem Sprung', last.getAttribute('aria-current') === 'true', 'aria-current nicht gesetzt');
    window.scrollTo(0, 0); await wait(300);
  }

  // 3. Überschriften passen
  const h1 = document.querySelector('h1');
  add('h1 passt in den Viewport', h1 && h1.scrollWidth <= h1.clientWidth + 1 && h1.getBoundingClientRect().right <= vw + 1, h1 && `scrollWidth ${h1.scrollWidth} / ${h1.clientWidth}`);

  // 4. Touch-Ziele >= 44 px (Phones und Tablets)
  if (isDrawer) {
    const small = [...document.querySelectorAll('button, input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, summary, .sh-nav-link, .sh-choice')]
      .filter((n) => visible(n) && !n.closest('[inert]') && !n.matches('[data-glossary]'))
      .filter((n) => { const r = n.getBoundingClientRect(); return r.height < 43.5 || (n.tagName !== 'INPUT' && r.width < 43.5); })
      .map((n) => `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : ''} ${Math.round(n.getBoundingClientRect().width)}×${Math.round(n.getBoundingClientRect().height)}`);
    add('Touch-Ziele ≥ 44×44 px', small.length === 0, small.slice(0, 6).join(', '));
    const tiny = [...document.querySelectorAll('.sh-main input, .sh-main select')].filter(visible).filter((n) => parseFloat(getComputedStyle(n).fontSize) < 16);
    add('Eingabefelder ≥ 16 px Schrift (kein iOS-Zoom)', tiny.length === 0, tiny.length + ' Felder zu klein');
  }

  // 5. Diagramme
  const svgs = [...document.querySelectorAll('.sh-main svg')].filter(visible);
  const overflowSvg = svgs.filter((s) => { const r = s.getBoundingClientRect(); const pr = s.parentElement.getBoundingClientRect(); return r.right > pr.right + 1 || r.left < pr.left - 1; });
  add('SVG-Diagramme sprengen ihren Container nicht', overflowSvg.length === 0, overflowSvg.length + ' SVGs zu breit');
  const microscopic = [];
  svgs.forEach((s) => s.querySelectorAll('text').forEach((t) => { const h = t.getBoundingClientRect().height; if (h > 0 && h < 8.5) microscopic.push(Math.round(h * 10) / 10); }));
  const expandable = document.querySelectorAll('.sh-expand').length;
  add('Diagrammbeschriftung lesbar (≥ 8,5 px) oder vergrösserbar', microscopic.length === 0 || expandable > 0, `${microscopic.length} Labels < 8,5 px`, microscopic.length ? 'warn' : 'error');
  const noLabel = svgs.filter((s) => !s.closest('[aria-hidden="true"]') && !s.getAttribute('aria-label') && !s.getAttribute('aria-labelledby') && !s.querySelector('title'));
  add('Diagramme mit Titel/Beschreibung', noLabel.length === 0, noLabel.length + ' ohne <title>/aria-label', 'warn');

  // 5b. Original-Lernziele (Sidebar)
  const lz = document.getElementById('sh-lz');
  if (lz) {
    add('Original-Lernziele: in der Sidebar', lz.closest('#sh-sidebar'));
    add('Original-Lernziele: beim Laden eingeklappt', !lz.open);
    add('Original-Lernziele: nicht im Artikel', !document.querySelector('.sh-shell .sh-lz'));
    const countEl = document.getElementById('sh-lz-count');
    const boxes = [...lz.querySelectorAll('[data-lz-check]')];
    add('Original-Lernziele: nichts vorab angehakt', boxes.every((b) => !b.checked), boxes.filter((b) => b.checked).length + ' angehakt');
    if (isDrawer) { menu.click(); await wait(320); }
    lz.querySelector('summary').click(); await wait(80);
    add('Original-Lernziele: lässt sich aufklappen', lz.open);
    const sbw = sidebar.getBoundingClientRect();
    const wide = [...lz.querySelectorAll('.sh-lz-item, .sh-lz-text')].filter((n) => n.scrollWidth > n.clientWidth + 1 || n.getBoundingClientRect().right > sbw.right + 1);
    add('Original-Lernziele: lange Texte umbrechen (kein Überlauf)', wide.length === 0, wide.length + ' Elemente zu breit');
    const smallT = [...lz.querySelectorAll('.sh-lz-check, .sh-lz-link, summary')].filter((n) => n.getBoundingClientRect().height < 43.5);
    add('Original-Lernziele: Touch-Ziele ≥ 44 px', smallT.length === 0, smallT.length + ' zu klein');
    const dead = [...lz.querySelectorAll('.sh-lz-link')].filter((a) => !document.getElementById(a.getAttribute('href').slice(1)));
    add('Original-Lernziele: alle „Zum Kapitel“-Links gültig', dead.length === 0, dead.map((a) => a.getAttribute('href')).join(', '));
    if (boxes.length) {
      const before = countEl.textContent;
      boxes[0].click(); await frame();
      const after = countEl.textContent;
      boxes[0].click(); await frame();
      add('Original-Lernziele: Häkchen setzen/entfernen aktualisiert Zähler', before !== after && countEl.textContent === before, `${before} → ${after} → ${countEl.textContent}`);
    }
    lz.open = false;
    if (isDrawer) { key('Escape'); await wait(320); }
  }

  // 6. Glossar
  const gToggle = document.getElementById('sh-glossary-toggle');
  const gData = document.getElementById('sh-glossary');
  if (gToggle && gData) {
    const entries = JSON.parse(gData.textContent);
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    key('l'); await wait(350);
    const panel = document.getElementById('sh-glossary-panel'), input = document.getElementById('sh-glossary-search');
    add('Taste L öffnet Legende', !panel.hidden && visible(input), 'Panel nicht sichtbar');
    add('Suchfeld fokussiert', document.activeElement === input);
    const first = entries.find((e) => /_/.test(e.symbol)) || entries[0];
    const q = first.symbol.replace(/[_{}]/g, '');
    input.value = q; input.dispatchEvent(new Event('input', { bubbles: true })); await frame();
    const firstHit = document.querySelector('#sh-glossary-results .sh-gl-entry');
    add(`Glossar findet „${q}“ (geschrieben ohne _)`, firstHit && firstHit.getAttribute('data-symbol') === first.symbol, firstHit ? 'erster Treffer: ' + firstHit.getAttribute('data-symbol') : 'kein Treffer');
    if (entries.some((e) => /ρ/.test(e.symbol))) {
      input.value = 'rho'; input.dispatchEvent(new Event('input', { bubbles: true })); await frame();
      const hit = document.querySelector('#sh-glossary-results .sh-gl-entry');
      add('Glossar: Transliteration „rho“ findet ρ', hit && /ρ/.test(hit.getAttribute('data-symbol')));
    }
    input.value = 'zzzqqq'; input.dispatchEvent(new Event('input', { bubbles: true })); await frame();
    add('Glossar: leerer Treffer wird erklärt', document.querySelectorAll('#sh-glossary-results .sh-gl-entry').length === 0 && /Kein Treffer/.test(document.getElementById('sh-glossary-status').textContent));
    input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
    if (isDrawer) {
      add('Legende auf Mobile im Drawer erreichbar', document.body.classList.contains('sh-drawer-open'));
      key('Escape'); await wait(300);
      add('Escape schliesst Legende/Drawer', !document.body.classList.contains('sh-drawer-open'));
    } else {
      key('Escape', input); await wait(50);
      gToggle.click(); await wait(50);
      if (!panel.hidden) gToggle.click();
    }
    const field = document.querySelector('.sh-answer input');
    if (field) {
      field.focus(); const before = panel.hidden;
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', bubbles: true }));
      add('Taste L in Eingabefeld öffnet Legende NICHT', panel.hidden === before);
      field.blur();
    }
  }

  // 7. Numerische Übung
  const ans = document.querySelector('.sh-ex .sh-answer[data-answer]');
  if (ans) {
    const input = ans.querySelector('input'), btn = ans.querySelector('button'), fb = ans.querySelector('.sh-feedback');
    add('Antwortfeld + Prüfen-Button vorhanden', input && btn && fb);
    if (input && btn) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      add('Antwortfeld hat Label', !!label);
      const val = Number(ans.getAttribute('data-answer'));
      const sel = ans.querySelector('select'); if (sel) sel.selectedIndex = 0;
      input.value = String(val).replace('.', ','); btn.click(); await frame();
      add('Dezimalkomma wird als richtig erkannt', fb.getAttribute('data-status') === 'correct', fb.textContent);
      input.value = String(val); btn.click(); await frame();
      add('Dezimalpunkt wird als richtig erkannt', fb.getAttribute('data-status') === 'correct', fb.textContent);
      input.value = val.toExponential(); btn.click(); await frame();
      add('Wissenschaftliche Notation wird erkannt', fb.getAttribute('data-status') === 'correct', input.value + ' → ' + fb.textContent);
      input.value = 'abc'; btn.click(); await frame();
      add('Ungültige Eingabe verständlich abgefangen', fb.getAttribute('data-status') === 'invalid', fb.textContent);
      input.value = ''; btn.click(); await frame();
      add('Leere Eingabe abgefangen', fb.getAttribute('data-status') === 'empty');
      add('Feedback als Live-Region', fb.getAttribute('aria-live') === 'polite');
      input.value = ''; fb.textContent = ''; fb.removeAttribute('data-status');
    }
    const ex = ans.closest('.sh-ex');
    const hint = ex.querySelector('.sh-hint');
    const hb = [...ex.querySelectorAll('.sh-actions button')].find((b) => /Tipp/.test(b.textContent));
    if (hint && hb) {
      add('Tipps anfangs verborgen', !visible(hint));
      hb.click(); await frame();
      add('Tipp-Button zeigt Tipp 1', visible(hint));
      add('Weitere Tipps noch verborgen', [...ex.querySelectorAll('.sh-hint')].slice(1).every((h) => !visible(h)));
    }
    const sol = ex.querySelector('details.sh-solution');
    if (sol) { add('Lösung anfangs zu', !sol.open); sol.querySelector('summary').click(); await frame(); add('Lösung lässt sich öffnen', sol.open); sol.open = false; }
  }

  // 8. Quiz
  const quiz = document.querySelector('.sh-quiz');
  if (quiz) {
    const qs = [...quiz.querySelectorAll('.sh-q')];
    qs.forEach((q) => { const r = q.querySelector(`input[value="${q.getAttribute('data-correct')}"]`); if (r) r.checked = true; });
    const evalBtn = [...quiz.querySelectorAll('.sh-actions button')][0];
    evalBtn.click(); await frame();
    const res = quiz.querySelector('.sh-quiz-result').textContent;
    add('Quiz wertet richtig aus', res.startsWith(`${qs.length} von ${qs.length}`), res);
    add('Quiz zeigt Begründung', [...quiz.querySelectorAll('.sh-why.is-shown')].length >= qs.length, 'Begründungen fehlen');
    [...quiz.querySelectorAll('.sh-actions button')][1].click(); await frame();
  }

  // 9. Probeprüfung
  const task = document.querySelector('.sh-exam-task[data-points]');
  if (task) {
    const inp = task.querySelector('.sh-selfscore input');
    add('Selbstbewertung vorhanden', !!inp);
    if (inp) {
      inp.value = '1'; inp.dispatchEvent(new Event('change', { bubbles: true })); await frame();
      const sum = document.getElementById('sh-exam-summary');
      add('Prüfungsauswertung reagiert', sum && /Punkten/.test(sum.textContent), sum && sum.textContent);
      inp.value = ''; inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // 10. Verbotene Labels, Sprache, Landmarks
  const txt = document.body.innerText || document.body.textContent || "";
  add('Kein „Offline nutzbar“-Label', !/offline\s*nutzbar|lokal im browser nutzbar/i.test(txt));
  add('Kein ß im sichtbaren Text', !txt.includes('ß'));
  add('Landmarks: main, nav, h1', document.querySelector('main') && document.querySelector('nav') && document.querySelectorAll('h1').length === 1);

  // 11. Abschluss: Overflow erneut nach allen Interaktionen
  await wait(100);
  add('Nach Interaktionen kein horizontales Scrollen', document.documentElement.scrollWidth <= vw + 1, `scrollWidth ${document.documentElement.scrollWidth}`);
  try { localStorage.clear(); } catch (e) { /* ignore */ }
  return out;
};

const REDUCED_MOTION_CHECK = `(() => { const s = getComputedStyle(document.getElementById('sh-sidebar')); return { td: s.transitionDuration, sb: getComputedStyle(document.documentElement).scrollBehavior }; })()`;

export async function checkRender(file, { browser, screenshots, only } = {}) {
  const exe = findBrowser(browser);
  if (!exe) return { error: 'Kein Chromium-Browser gefunden (Chrome, Edge, Chromium, Brave). CHROME_PATH setzen.', code: 2 };
  if (typeof WebSocket === 'undefined') return { error: 'Node ohne globales WebSocket – Node 22 oder neuer verwenden.', code: 2 };
  const url = pathToFileURL(path.resolve(file)).href;
  let launched;
  try { launched = await launch(exe); } catch (e) { return { error: `${path.basename(exe)}: ${e.message}`, code: 2, policy: !!e.policy }; }
  const { proc, wsUrl, userDir } = launched;
  const results = [];
  let cdp;
  try {
    cdp = await Cdp.connect(wsUrl);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => cdp.send(m, p, sessionId);
    const consoleErrors = [];
    cdp.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && !/favicon/.test(msg.params.entry.url || '')) consoleErrors.push(msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
    });
    await s('Page.enable'); await s('Runtime.enable'); await s('Log.enable');
    const vps = only ? VIEWPORTS.filter(([w, h]) => `${w}x${h}` === only) : VIEWPORTS;
    for (const [w, h] of vps) {
      const mobile = w < 768;
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 3 : 1, mobile });
      await s('Emulation.setTouchEmulationEnabled', { enabled: w <= DRAWER_MAX, maxTouchPoints: 5 });
      await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      const errStart = consoleErrors.length;
      await s('Page.navigate', { url });
      for (let i = 0; i < 50; i++) {
        const r = await s('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        if (r.result.value === 'complete') break;
        await sleep(100);
      }
      await sleep(250);
      if (screenshots) {
        mkdirSync(screenshots, { recursive: true });
        const shot = await s('Page.captureScreenshot', { format: 'png' });
        writeFileSync(path.join(screenshots, `${w}x${h}.png`), Buffer.from(shot.data, 'base64'));
      }
      const r = await s('Runtime.evaluate', { expression: `(${PAGE_CHECKS.toString()})(${DRAWER_MAX})`, awaitPromise: true, returnByValue: true });
      let checks = r.exceptionDetails ? [{ name: 'Prüfskript', ok: false, detail: r.exceptionDetails.exception?.description || r.exceptionDetails.text, severity: 'error' }] : r.result.value;
      if (screenshots && w <= DRAWER_MAX) {
        await s('Runtime.evaluate', { expression: 'window.scrollTo(0,0);window.StudyHubGuide&&window.StudyHubGuide.openDrawer()', returnByValue: true });
        await sleep(350);
        const shot = await s('Page.captureScreenshot', { format: 'png' });
        writeFileSync(path.join(screenshots, `${w}x${h}-drawer.png`), Buffer.from(shot.data, 'base64'));
        await s('Runtime.evaluate', { expression: 'window.StudyHubGuide&&window.StudyHubGuide.closeDrawer(false)', returnByValue: true });
      }
      // Reduzierte Bewegung
      await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      const rm = await s('Runtime.evaluate', { expression: REDUCED_MOTION_CHECK, returnByValue: true });
      checks.push({ name: 'prefers-reduced-motion respektiert', ok: rm.result.value.td.split(',').every((x) => parseFloat(x) === 0) && rm.result.value.sb !== 'smooth', detail: JSON.stringify(rm.result.value), severity: 'error' });
      const errs = consoleErrors.slice(errStart);
      checks.push({ name: 'Keine JS-/Konsolenfehler', ok: errs.length === 0, detail: errs.slice(0, 3).join(' | '), severity: 'error' });
      results.push({ viewport: `${w}x${h}`, checks });
    }
  } finally {
    cdp && cdp.close();
    proc.kill();
    await sleep(200);
    try { rmSync(userDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  return { results, browser: exe };
}

// ---------- Modus 2: lokaler Server + normales Browserfenster ----------
const ERROR_PRELUDE = `<script>window.__shErrors=[];addEventListener('error',function(e){__shErrors.push(String(e.message||e))});addEventListener('unhandledrejection',function(e){__shErrors.push('Promise: '+String(e.reason))});(function(){var ce=console.error;console.error=function(){__shErrors.push([].map.call(arguments,String).join(' '));return ce.apply(console,arguments)}})();</script>`;

function harnessHtml(viewports) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>StudyHub Render-Check</title><style>body{font:14px system-ui;margin:12px;background:#F7F9FC;color:#183047}iframe{border:1px solid #BFCEDA;background:#fff;display:block;margin-top:8px}#log{white-space:pre-wrap}</style></head>
<body><h1 style="font-size:18px">StudyHub Render-Check läuft …</h1><p>Dieses Fenster bitte im Vordergrund lassen (Browser drosseln Hintergrund-Tabs). Es schliesst nichts automatisch.</p><div id="log"></div><div id="stage"></div>
<script>
const VIEWPORTS=${JSON.stringify(viewports)};
const CHECKS=${PAGE_CHECKS.toString()};
const log=(t)=>{document.getElementById('log').textContent+=t+'\\n'};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const results=[];
  for(const [w,h] of VIEWPORTS){
    const stage=document.getElementById('stage'); stage.textContent='';
    const f=document.createElement('iframe'); f.width=w; f.height=h; f.style.width=w+'px'; f.style.height=h+'px';
    const loaded=new Promise(r=>f.onload=r);
    f.src='/page.html?vp='+w+'x'+h+'&t='+Date.now(); stage.appendChild(f);
    await loaded; await sleep(500);
    let checks;
    try { checks = await f.contentWindow.eval('('+CHECKS.toString()+')(${DRAWER_MAX})'); }
    catch(e){ checks=[{name:'Prüfskript',ok:false,detail:String(e),severity:'error'}]; }
    const css=[...f.contentDocument.querySelectorAll('style')].map(s=>s.textContent).join('');
    checks.push({name:'prefers-reduced-motion (CSS-Regel vorhanden, nicht emuliert)',ok:/prefers-reduced-motion:\\s*reduce/.test(css),detail:'Regel fehlt',severity:'error'});
    const errs=(f.contentWindow.__shErrors||[]);
    checks.push({name:'Keine JS-/Konsolenfehler',ok:errs.length===0,detail:errs.slice(0,3).join(' | '),severity:'error'});
    results.push({viewport:w+'x'+h,checks}); log(w+'x'+h+': '+checks.filter(c=>!c.ok).length+' Auffälligkeiten');
  }
  await fetch('/results',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({results,ua:navigator.userAgent})});
  document.querySelector('h1').textContent='StudyHub Render-Check fertig – Ergebnis steht im Terminal. Tab kann geschlossen werden.';
})().catch(e=>{log('FEHLER '+e);fetch('/results',{method:'POST',body:JSON.stringify({error:String(e)})})});
</script></body></html>`;
}

export function serveCheck(file, { open, only, timeoutMs = 180000, host = '127.0.0.1' } = {}) {
  const page = readFileSync(file, 'utf8').replace(/<head>/i, (m) => m + ERROR_PRELUDE);
  const vps = only ? VIEWPORTS.filter(([w, h]) => `${w}x${h}` === only) : VIEWPORTS;
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (req.method === 'POST' && u.pathname === '/results') {
        let body = '';
        req.on('data', (d) => (body += d));
        req.on('end', () => { res.end('ok'); clearTimeout(timer); server.close(); try { resolve(JSON.parse(body)); } catch (e) { resolve({ error: 'Ungültige Antwort: ' + e.message }); } });
        return;
      }
      if (u.pathname === '/') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.end(harnessHtml(vps)); }
      if (u.pathname === '/page.html') { res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.end(page); }
      res.statusCode = 404; res.end();
    });
    const timer = setTimeout(() => { server.close(); resolve({ error: `Keine Antwort vom Browser innert ${timeoutMs / 1000} s (Tab im Hintergrund oder nicht geöffnet?).` }); }, timeoutMs);
    server.listen(0, host, () => {
      const url = `http://${host}:${server.address().port}/`;
      console.log(`Render-Check-Server: ${url}`);
      if (open) {
        const args = process.platform === 'darwin' ? (open === 'safari' ? ['-a', 'Safari', url] : [url]) : [url];
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
        spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
        console.log(`Geöffnet mit ${open === 'safari' ? 'Safari' : 'Standardbrowser'} – warte auf Ergebnis …`);
      } else console.log('Diese URL in einem Browser öffnen – warte auf Ergebnis …');
    });
  });
}

function printReport(results, label) {
  console.log(label + '\n');
  let errors = 0, warns = 0;
  const byName = new Map();
  for (const { viewport, checks } of results) for (const c of checks) {
    if (!byName.has(c.name)) byName.set(c.name, []);
    byName.get(c.name).push({ viewport, ...c });
  }
  for (const [name, list] of byName) {
    const failed = list.filter((x) => !x.ok);
    if (!failed.length) { console.log(`  ✓ ${name}  (${list.length} Viewports)`); continue; }
    const sev = failed.some((x) => x.severity === 'error') ? 'error' : 'warn';
    sev === 'error' ? errors++ : warns++;
    console.log(`  ${sev === 'error' ? '✗' : '!'} ${name}`);
    failed.forEach((x) => console.log(`      ${x.viewport}: ${x.detail}`));
  }
  console.log(`\nViewports: ${results.map((r) => r.viewport).join(', ')}`);
  console.log(`Ergebnis: ${errors} Fehler, ${warns} Warnungen`);
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
  const flag = (n) => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
  const screenshots = opt('--screenshots'), browser = opt('--browser'), only = opt('--only'), open = opt('--open');
  const host = opt('--host');
  const serve = flag('--serve');
  const file = args[0];
  if (!file) { console.log('Aufruf: node check-render.mjs <seite.html> [--screenshots <ordner>] [--browser <pfad>] [--only 390x844] | --serve [--open safari|default] [--host 0.0.0.0]'); return 2; }
  if (serve) {
    const res = await serveCheck(file, { open, only, host: host || undefined });
    if (res.error) { console.error('NICHT GEPRÜFT: ' + res.error); return 2; }
    const errors = printReport(res.results, `Browser: ${res.ua}\nModus: iframes je Viewport (kein DevTools) · Datei: ${file}`);
    console.log('Nicht automatisiert: echte Touch-Gesten, virtuelle Tastatur, Screenreader, Emulation von prefers-reduced-motion.');
    return errors ? 1 : 0;
  }
  const res = await checkRender(file, { browser, screenshots, only });
  if (res.error) {
    console.error('NICHT GEPRÜFT: ' + res.error);
    console.error('→ Fallback ohne DevTools: node check-render.mjs ' + file + ' --serve --open safari');
    return res.code;
  }
  const errors = printReport(res.results, `Browser: ${path.basename(res.browser)} (headless, DevTools) · Datei: ${file}`);
  if (screenshots) console.log(`Screenshots: ${screenshots}`);
  console.log('Nicht automatisiert: echte Touch-Gesten, iOS-Safari-/WebKit-Rendering, virtuelle Tastatur, Screenreader-Ausgabe.');
  return errors ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((c) => process.exit(c), (e) => { console.error('FEHLER: ' + e.message); process.exit(2); });
}
