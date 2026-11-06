// Fach-Aufloesung und Farbableitung fuer StudyHub-Lernseiten.
// Quelle der Wahrheit fuer Fachfarben: ../../assets/subjects.json
// Keine Abhaengigkeiten. Node >= 18.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SUBJECTS_FILE = path.resolve(HERE, '../../assets/subjects.json');

export function loadSubjects(file = SUBJECTS_FILE) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** "Wirtschaft & Recht" -> "wirtschaft-und-recht"; "Französisch" -> "franzosisch" */
export function normalizeKey(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\u00df/g, 'ss')
    .replace(/&/g, ' und ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const compact = (s) => s.replace(/-/g, '');

/**
 * Loest einen freien Fachnamen / Ordner-Slug auf.
 * @returns {{key:string, label:string, accent:string, matched:boolean, via:string, warnings:string[]}}
 */
export function resolveSubject(input, data = loadSubjects()) {
  const warnings = [];
  const norm = normalizeKey(input);
  const c = compact(norm);
  const entries = Object.entries(data.subjects);
  const fallback = data.subjects[data.fallback];
  const result = (key, via) => ({
    key,
    label: data.subjects[key].label,
    accent: data.subjects[key].accent,
    matched: true,
    via,
    warnings,
  });

  if (!norm) {
    warnings.push('Kein Fach angegeben — neutrale Fallback-Farbe.');
    return { key: data.fallback, label: fallback.label, accent: fallback.accent, matched: false, via: 'fallback', warnings };
  }
  // 1) exakter Schluessel oder Alias (Trennzeichen egal)
  for (const [key, s] of entries) {
    if (compact(key) === c) return result(key, 'key');
    if ((s.aliases || []).some((a) => compact(normalizeKey(a)) === c)) return result(key, 'alias');
  }
  // 2) Muster (z. B. BBW-Module m165)
  for (const p of data.patterns || []) {
    if (new RegExp(p.regex).test(norm) && data.subjects[p.subject]) return result(p.subject, 'pattern');
  }
  // 3) Token-Suche: "BMS Physik Teil 2" -> physik. Nur Aliase mit >= 3 Zeichen, damit
  //    Kuerzel wie "d" oder "e" nicht zufaellig treffen.
  const tokens = norm.split('-').filter(Boolean);
  const hits = new Set();
  for (const [key, s] of entries) {
    if (key === data.fallback) continue;
    const names = [key, ...(s.aliases || [])].map((a) => compact(normalizeKey(a))).filter((a) => a.length >= 3);
    if (tokens.some((t) => names.includes(t)) || names.some((n) => n.length >= 5 && c.includes(n))) hits.add(key);
  }
  if (hits.size === 1) return result([...hits][0], 'token');
  if (hits.size > 1) {
    const first = [...hits][0];
    warnings.push(`Mehrdeutiges Fach "${input}" (${[...hits].join(', ')}) — verwende "${first}". Mit --subject eindeutig setzen.`);
    return result(first, 'token-ambiguous');
  }
  warnings.push(`Unbekanntes Fach "${input}" — neutrale Farbe "${data.fallback}". Neues Fach in assets/subjects.json ergaenzen.`);
  return { key: data.fallback, label: String(input).trim(), accent: fallback.accent, matched: false, via: 'fallback', warnings };
}

// ---------- Farbe & Kontrast ----------

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Ungueltige Farbe: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
export function rgbToHex(rgb) {
  return '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function mix(a, b, t) {
  // t = Anteil von b
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v * (1 - t) + y[i] * t));
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const WHITE = '#FFFFFF';
const INK = '#0B1622';
export const CANVAS = '#F7F9FC';

/** Dunkelt `hex` in kleinen Schritten ab, bis alle Hintergruende `min` erreichen. */
function darkenUntil(hex, backgrounds, min) {
  let c = hex;
  for (let i = 0; i < 60 && backgrounds.some((bg) => contrast(c, bg) < min); i++) c = mix(c, INK, 0.05);
  return c;
}

/**
 * Leitet aus einer Primaerfarbe alle Theme-Variablen ab.
 * Garantien (werden in tests/ geprueft):
 *  - --subject-text:   >= 4.5:1 auf Weiss, Canvas und --subject-accent-soft (Fliesstext, aktive Navigation)
 *  - --subject-solid + --subject-accent-contrast: >= 4.5:1 (Buttons mit Text)
 *  - --subject-ring / Indikatoren: >= 3:1 auf Weiss und Canvas (Fokusring, Fortschritt, Formelrand)
 */
export function deriveTheme(accent) {
  const soft = mix(accent, WHITE, 0.9);
  const softer = mix(accent, WHITE, 0.95);
  const text = darkenUntil(accent, [WHITE, CANVAS, soft, softer], 4.5);
  const indicator = darkenUntil(accent, [WHITE, CANVAS, softer], 3);
  const onWhiteOk = contrast(WHITE, accent) >= 4.5;
  const solid = onWhiteOk ? accent : darkenUntil(accent, [WHITE], 4.5);
  const solidHover = mix(solid, INK, 0.18);
  const line = mix(accent, WHITE, 0.72);
  return {
    '--subject-accent': indicator,
    '--subject-accent-hover': solidHover,
    '--subject-accent-soft': soft,
    '--subject-accent-softer': softer,
    '--subject-accent-line': line,
    '--subject-accent-contrast': WHITE,
    '--subject-solid': solid,
    '--subject-text': text,
    '--subject-ring': indicator,
  };
}

export function themeReport(theme) {
  return {
    textOnWhite: contrast(theme['--subject-text'], WHITE),
    textOnCanvas: contrast(theme['--subject-text'], CANVAS),
    textOnSoft: contrast(theme['--subject-text'], theme['--subject-accent-soft']),
    buttonText: contrast(theme['--subject-accent-contrast'], theme['--subject-solid']),
    buttonHoverText: contrast(theme['--subject-accent-contrast'], theme['--subject-accent-hover']),
    indicatorOnWhite: contrast(theme['--subject-accent'], WHITE),
    indicatorOnCanvas: contrast(theme['--subject-accent'], CANVAS),
  };
}

export function themeCss(theme) {
  return ':root{' + Object.entries(theme).map(([k, v]) => `${k}:${v}`).join(';') + '}';
}
