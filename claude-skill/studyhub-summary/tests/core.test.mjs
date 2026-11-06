// node --test claude-skill/studyhub-summary/tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../assets/sh-core.js');

test('parseNumber: Schweizer und internationale Schreibweisen', () => {
  const v = (s) => core.parseNumber(s).value;
  assert.equal(v('1,25'), 1.25);
  assert.equal(v('1.25'), 1.25);
  assert.equal(v('-3'), -3);
  assert.equal(v('−3,5'), -3.5); // typografisches Minus
  assert.equal(v('1.25e3'), 1250);
  assert.equal(v('1,25E-3'), 0.00125);
  assert.equal(v('1,25·10^3'), 1250);
  assert.equal(v('1.25 x 10^-3'), 0.00125);
  assert.equal(v('2,5×10⁻³'), 0.0025);
  assert.equal(v("1'250,5"), 1250.5);
  assert.equal(v('1 250'), 1250);
  assert.equal(v('1.250,5'), 1250.5);
  assert.equal(v('1,000,000'), 1000000);
  assert.equal(v(' 42 '), 42);
});

test('parseNumber: Einheit wird abgetrennt, Fehler sauber gemeldet', () => {
  assert.deepEqual(core.parseNumber('24,5 N'), { ok: true, value: 24.5, unit: 'N' });
  assert.equal(core.parseNumber('').error, 'empty');
  assert.equal(core.parseNumber('   ').error, 'empty');
  assert.equal(core.parseNumber('abc').error, 'invalid');
  assert.equal(core.parseNumber('1,2,3').error, 'invalid');
  assert.equal(core.parseNumber('.').error, 'invalid');
});

test('checkAnswer: Toleranz statt exaktem Stringvergleich', () => {
  const spec = { answer: 24.525, unit: 'N' };
  assert.equal(core.checkAnswer('24,525', spec).status, 'correct');
  assert.equal(core.checkAnswer('24.5', spec).status, 'correct'); // 0,1 % Abweichung
  assert.equal(core.checkAnswer('24,3', spec).status, 'correct'); // < 1 %
  assert.equal(core.checkAnswer('2.4525e1', spec).status, 'correct');
  assert.equal(core.checkAnswer('25,4', spec).status, 'rounding');
  assert.equal(core.checkAnswer('99', spec).status, 'wrong');
});

test('checkAnswer: Absolute und prozentuale Toleranz', () => {
  assert.equal(core.checkAnswer('0,03', { answer: 0, tol: '0.05' }).status, 'correct');
  assert.equal(core.checkAnswer('0,1', { answer: 0, tol: '0.05' }).status, 'wrong');
  assert.equal(core.checkAnswer('2510', { answer: 2500, tol: '0.5%' }).status, 'correct');
  assert.equal(core.checkAnswer('2520', { answer: 2500, tol: '0.5%' }).status, 'rounding');
});

test('checkAnswer: ehrliche Diagnosen (Zehnerpotenz, Vorzeichen, bekannte Fehler)', () => {
  const spec = { answer: 24.525, unit: 'N', mistakes: [{ value: 24525, msg: 'Liter nicht umgerechnet' }] };
  assert.equal(core.checkAnswer('24525', spec).status, 'mistake');
  assert.equal(core.checkAnswer('24525', spec).message, 'Liter nicht umgerechnet');
  assert.equal(core.checkAnswer('0,024525', spec).status, 'power10');
  assert.equal(core.checkAnswer('-24,525', spec).status, 'sign');
  assert.equal(core.checkAnswer('abc', spec).status, 'invalid');
  assert.equal(core.checkAnswer('', spec).status, 'empty');
});

test('checkAnswer: Einheiten (getippt oder gewählt)', () => {
  const spec = { answer: 24, unit: 'cm', altUnits: 'm:100, mm:0.1' };
  assert.equal(core.checkAnswer('0,24 m', spec).status, 'correct');
  assert.equal(core.checkAnswer('240 mm', spec).status, 'correct');
  assert.equal(core.checkAnswer('24 cm', spec).status, 'correct');
  assert.equal(core.checkAnswer('0,24', { ...spec, selectedUnit: 'm' }).status, 'correct');
  assert.equal(core.checkAnswer('24 kg', spec).status, 'unit-unknown');
  const rho = { answer: 2500, unit: 'kg/m³', altUnits: 'g/cm³:1000' };
  assert.equal(core.checkAnswer('2500 kg/m3', rho).status, 'correct');
  assert.equal(core.checkAnswer('2,5 g/cm3', rho).status, 'correct');
});

test('parseAltUnits / parseTolerance', () => {
  assert.deepEqual(core.parseAltUnits('kN:1000, mN:0.001'), { kN: 1000, mN: 0.001 });
  assert.deepEqual(core.parseAltUnits('{"L":0.001}'), { L: 0.001 });
  assert.deepEqual(core.parseAltUnits('g/cm³:1000'), { 'g/cm³': 1000 });
  assert.deepEqual(core.parseTolerance('2%'), { rel: 0.02, abs: 0 });
  assert.deepEqual(core.parseTolerance('0,5'), { rel: 0, abs: 0.5 });
  assert.deepEqual(core.parseTolerance(undefined), { rel: 0.01, abs: 0 });
});

test('formatNumber: Dezimalkomma', () => {
  assert.equal(core.formatNumber(24.525), '24,525');
  assert.equal(core.formatNumber(1 / 3), '0,333333');
  assert.equal(core.formatNumber(13), '13');
});

const GLOSSARY = [
  { symbol: 'F_G', name: 'Gewichtskraft', unit: 'N', meaning: 'nach unten', example: 'F_G = m · g', aliases: ['gewicht'] },
  { symbol: 'F_A', name: 'Auftriebskraft', unit: 'N', meaning: 'nach oben' },
  { symbol: 'ρ', name: 'Dichte', unit: 'kg/m³', meaning: 'Masse pro Volumen' },
  { symbol: 'ρ_Fl', name: 'Dichte der Flüssigkeit', unit: 'kg/m³' },
  { symbol: 'Δp', name: 'Druckdifferenz', unit: 'Pa' },
  { symbol: 'W', name: 'Arbeit', unit: 'J' },
  { symbol: 'W', name: 'Watt', unit: 'J/s' },
];
const top = (q) => core.searchGlossary(GLOSSARY, q).map((h) => h.entry.symbol + '|' + h.entry.name);

test('Glossar: alle verlangten Schreibweisen', () => {
  for (const q of ['FG', 'F_G', 'fg', 'F_{G}', 'F G', 'f-g']) assert.equal(top(q)[0], 'F_G|Gewichtskraft', q);
  assert.equal(top('rho')[0], 'ρ|Dichte');
  assert.equal(top('ρ')[0], 'ρ|Dichte');
  assert.equal(top('rho_fl')[0], 'ρ_Fl|Dichte der Flüssigkeit');
  assert.equal(top('Flussigkeit')[0], 'ρ_Fl|Dichte der Flüssigkeit'); // ohne Umlaut
  assert.equal(top('delta p')[0], 'Δp|Druckdifferenz');
  assert.equal(top('Gewicht')[0], 'F_G|Gewichtskraft');
  assert.ok(top('kg/m3').includes('ρ|Dichte'));
  assert.ok(top('Pa')[0].startsWith('Δp'));
  assert.deepEqual(top('zzz'), []);
  assert.equal(top('').length, GLOSSARY.length);
});

test('Glossar: Symbolkollisionen werden nicht versteckt', () => {
  const hits = core.searchGlossary(GLOSSARY, 'W');
  assert.equal(hits.length >= 2, true);
  assert.ok(hits.filter((h) => h.entry.symbol === 'W').every((h) => h.ambiguous));
  assert.ok(core.searchGlossary(GLOSSARY, 'F_G').every((h) => !h.ambiguous));
});

test('symbolTokens: Indizes/Exponenten ohne innerHTML', () => {
  assert.deepEqual(core.symbolTokens('F_A'), [{ t: 'text', v: 'F' }, { t: 'sub', v: 'A' }]);
  assert.deepEqual(core.symbolTokens('ρ_{Fl} · m^3'), [{ t: 'text', v: 'ρ' }, { t: 'sub', v: 'Fl' }, { t: 'text', v: ' · m' }, { t: 'sup', v: '3' }]);
  assert.deepEqual(core.symbolTokens('<b>x</b>'), [{ t: 'text', v: '<b>x</b>' }]);
  assert.deepEqual(core.symbolTokens('s^-2'), [{ t: 'text', v: 's' }, { t: 'sup', v: '-2' }]);
});
