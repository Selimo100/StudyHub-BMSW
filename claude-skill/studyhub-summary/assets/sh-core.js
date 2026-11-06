/* StudyHub Guide – reine Hilfsfunktionen (ohne DOM). Wird von build-guide.mjs
   inline eingebettet und in tests/core.test.mjs direkt geprueft. */
(function (root, factory) {
  var core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.SHCore = core;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- Zahlen ----------

  var SPACES = /[\s   '’]/g;

  /** Normalisiert die Mantisse "1'250,5" -> "1250.5". Gibt null zurueck, wenn mehrdeutig/ungueltig. */
  function normalizeMantissa(m) {
    var s = m.replace(SPACES, '');
    if (!/^[+-]?[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
    var hasComma = s.indexOf(',') >= 0, hasDot = s.indexOf('.') >= 0;
    if (hasComma && hasDot) {
      // Das zuletzt stehende Zeichen ist das Dezimaltrennzeichen.
      var dec = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
      var thou = dec === ',' ? '.' : ',';
      s = s.split(thou).join('');
      if (s.split(dec).length > 2) return null;
      s = s.replace(dec, '.');
    } else if (hasComma) {
      var parts = s.split(',');
      if (parts.length > 2) {
        if (!parts.slice(1).every(function (p) { return p.length === 3; })) return null;
        s = parts.join('');
      } else s = s.replace(',', '.');
    } else if (hasDot && s.split('.').length > 2) {
      var dp = s.split('.');
      if (!dp.slice(1).every(function (p) { return p.length === 3; })) return null;
      s = dp.join('');
    }
    return s;
  }

  /**
   * Liest eine Schuelereingabe.
   * Akzeptiert: 1,25 | 1.25 | -3 | −3 | 1.25e3 | 1,25E-3 | 1,25·10^3 | 1.25 x 10^-3 | 1'250 | "24,5 N"
   * @returns {{ok:boolean, value?:number, unit?:string, error?:'empty'|'invalid'}}
   */
  function parseNumber(input) {
    var s = String(input == null ? '' : input).trim()
      .replace(/[−–—]/g, '-')
      .replace(/×|⋅|·|\*/g, '×')
      .replace(/(\d)\s*[xX]\s*10/g, '$1×10')
      .replace(/10\s*\^\s*\(?\s*([+-]?\d+)\s*\)?/g, '10^$1')
      .replace(/10([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (_, e) { return '10^' + supToNum(e); });
    if (!s) return { ok: false, error: 'empty' };
    var m = s.match(/^([+-]?[\d\s   '’.,]*\d[\d.,]*)\s*(?:×\s*10\^([+-]?\d+)|[eE]([+-]?\d+))?\s*(.*)$/);
    if (!m) return { ok: false, error: 'invalid' };
    var mant = normalizeMantissa(m[1]);
    if (mant === null) return { ok: false, error: 'invalid' };
    var exp = m[2] || m[3];
    var value = Number(mant) * (exp ? Math.pow(10, Number(exp)) : 1);
    if (!isFinite(value)) return { ok: false, error: 'invalid' };
    var unit = (m[4] || '').trim();
    return { ok: true, value: value, unit: unit || undefined };
  }

  function supToNum(e) {
    var map = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
    return e.split('').map(function (c) { return map[c] || c; }).join('');
  }

  /** Einheiten vergleichbar machen: "kg/m³" == "kg/m3" == "kg / m^3"; "m/s²" == "m/s2". */
  function normalizeUnit(u) {
    return String(u || '').normalize('NFKC').replace(/µ/g, 'μ').replace(/[\s^·*×⋅]/g, '').replace(/²/g, '2').replace(/³/g, '3');
  }

  /** "kN:1000, mN:0.001" oder {"kN":1000} -> {kN:1000, mN:0.001}. Faktor = Wert in der erwarteten Einheit. */
  function parseAltUnits(spec) {
    if (!spec) return {};
    if (typeof spec === 'object') return spec;
    var s = String(spec).trim();
    if (s.charAt(0) === '{') { try { return JSON.parse(s); } catch (e) { return {}; } }
    var out = {};
    s.split(/[;,]\s*(?=[^\d\s])/).forEach(function (pair) {
      var i = pair.lastIndexOf(':');
      if (i > 0) out[pair.slice(0, i).trim()] = Number(pair.slice(i + 1).trim());
    });
    return out;
  }

  /** "1%" -> {rel:0.01}; "0.02" -> {abs:0.02}; undefined -> Standard 1 % relativ */
  function parseTolerance(spec) {
    if (spec == null || spec === '') return { rel: 0.01, abs: 0 };
    var s = String(spec).trim().replace(',', '.');
    if (/%$/.test(s)) return { rel: Number(s.slice(0, -1)) / 100, abs: 0 };
    return { rel: 0, abs: Math.abs(Number(s)) };
  }

  function within(v, target, tol) {
    var lim = Math.max(tol.abs || 0, (tol.rel || 0) * Math.abs(target), 1e-12);
    return Math.abs(v - target) <= lim;
  }

  /**
   * Prueft eine numerische Antwort ehrlich: nur Diagnosen, die sich aus einer Zahl
   * wirklich ableiten lassen (Rundung, Vorzeichen, Zehnerpotenz) oder die die
   * Lehrperson/der Autor als bekannte Fehlresultate hinterlegt hat (mistakes).
   * spec: {answer:number, unit?:string, tol?:string|{rel,abs}, altUnits?:object|string,
   *        mistakes?:[{value:number, msg:string, tol?:string}]}
   * @returns {{status:string, message:string, value?:number}}
   */
  function checkAnswer(raw, spec) {
    var parsed = parseNumber(raw);
    var unit = spec.unit || '';
    if (!parsed.ok) {
      return parsed.error === 'empty'
        ? { status: 'empty', message: 'Gib zuerst ein Ergebnis ein.' }
        : { status: 'invalid', message: 'Das ist keine gültige Zahl. Beispiele: 1,25 · 1.25 · 1,25e3' + (unit ? ' — Einheit: ' + unit : '') + '.' };
    }
    var tol = typeof spec.tol === 'object' && spec.tol ? spec.tol : parseTolerance(spec.tol);
    var factor = 1;
    var chosenUnit = parsed.unit || spec.selectedUnit;
    if (chosenUnit) {
      var alts = parseAltUnits(spec.altUnits);
      var nu = normalizeUnit(chosenUnit);
      if (unit && nu === normalizeUnit(unit)) factor = 1;
      else {
        var hit = Object.keys(alts).filter(function (k) { return normalizeUnit(k) === nu; })[0];
        if (hit) factor = alts[hit];
        else if (parsed.unit) {
          return { status: 'unit-unknown', message: 'Die Einheit „' + parsed.unit + '“ kann hier nicht ausgewertet werden. Gib das Ergebnis in ' + (unit || 'der verlangten Einheit') + ' an.' };
        }
      }
    }
    var v = parsed.value * factor;
    var a = Number(spec.answer);
    if (within(v, a, tol)) return { status: 'correct', message: 'Richtig.', value: v };

    var mistakes = spec.mistakes || [];
    for (var i = 0; i < mistakes.length; i++) {
      var mt = mistakes[i].tol ? parseTolerance(mistakes[i].tol) : tol;
      if (within(v, Number(mistakes[i].value), mt)) return { status: 'mistake', message: mistakes[i].msg, value: v };
    }
    if (a !== 0 && within(v, a, { rel: Math.max(0.05, (tol.rel || 0) * 4), abs: (tol.abs || 0) * 4 })) {
      return { status: 'rounding', message: 'Fast: Der Ansatz stimmt vermutlich. Prüfe die Rundung – runde erst am Schluss.', value: v };
    }
    if (a !== 0 && within(-v, a, tol)) {
      return { status: 'sign', message: 'Der Betrag stimmt, das Vorzeichen nicht. Prüfe Richtung bzw. Vorzeichenkonvention.', value: v };
    }
    if (a !== 0 && v !== 0) {
      var k = Math.round(Math.log10(Math.abs(v / a)));
      if (k !== 0 && Math.abs(k) <= 9 && within(v / Math.pow(10, k), a, tol)) {
        return { status: 'power10', message: 'Die Ziffern stimmen, aber um den Faktor 10' + toSup(k) + ' daneben. Prüfe die Einheiten-Umrechnung (z. B. L → m³, cm → m, g → kg).', value: v };
      }
    }
    return { status: 'wrong', message: 'Noch nicht richtig. Prüfe Ansatz und Einheiten oder hol dir einen Tipp.', value: v };
  }

  function toSup(n) {
    var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(function (c) { return map[c] || c; }).join('');
  }

  /** Schweizer Darstellung mit Dezimalkomma, standardmaessig 6 signifikante Stellen: 24.525 -> "24,525" */
  function formatNumber(v, sig) {
    if (!isFinite(v)) return String(v);
    return Number(v.toPrecision(sig || 6)).toString().replace('.', ',');
  }

  // ---------- Glossar-Suche ----------

  var GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ϵ': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta', 'ϑ': 'theta', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau', 'φ': 'phi', 'ϕ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega' };

  /** "F_{G}" / "F_G" / "FG" / "F G" -> "fg"; "ρ_Fl" -> "rhofl"; "kg/m³" -> "kgm3"; "Gr\u00f6\u00dfe" -> "grosse" */
  function normalizeSearch(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\u00df/g, 'ss')
      .replace(/[Ͱ-Ͽ]/g, function (c) { return GREEK[c] || c; })
      .replace(/[\s_{}\-–·.,()\/*^'’:;"„“]/g, '');
  }

  /**
   * entries: [{symbol, name, unit, meaning, example, aliases:[]}]
   * @returns Array<{entry, score, ambiguous:boolean}> in Trefferreihenfolge
   */
  function searchGlossary(entries, query) {
    var symCount = {};
    entries.forEach(function (e) { var k = normalizeSearch(e.symbol); symCount[k] = (symCount[k] || 0) + 1; });
    var q = normalizeSearch(query);
    var out = [];
    entries.forEach(function (e, idx) {
      var sym = normalizeSearch(e.symbol);
      var aliases = (e.aliases || []).map(normalizeSearch);
      var score = 0;
      if (!q) score = 1;
      else if (sym === q) score = 100;
      else if (aliases.indexOf(q) >= 0) score = 90;
      else if (normalizeSearch(e.unit) === q) score = 50;
      else if (sym.indexOf(q) === 0) score = 70;
      else if (aliases.some(function (a) { return a.indexOf(q) === 0; })) score = 60;
      else if (normalizeSearch(e.name).indexOf(q) >= 0) score = 45;
      else if (q.length >= 2 && normalizeSearch(e.unit).indexOf(q) >= 0) score = 30;
      else if (q.length >= 3 && (normalizeSearch(e.meaning).indexOf(q) >= 0 || normalizeSearch(e.example).indexOf(q) >= 0)) score = 15;
      if (score > 0) out.push({ entry: e, score: score, idx: idx, ambiguous: symCount[sym] > 1 });
    });
    out.sort(function (a, b) { return b.score - a.score || a.idx - b.idx; });
    return out;
  }

  /**
   * Zerlegt "F_A = ρ_{Fl} · V^3" in Tokens fuer die sichere DOM-Darstellung (keine innerHTML).
   * @returns Array<{t:'text'|'sub'|'sup', v:string}>
   */
  function symbolTokens(text) {
    var s = String(text == null ? '' : text);
    var re = /([_^])(\{([^}]*)\}|([A-Za-zÀ-ÿ0-9Ͱ-Ͽ]+|[+\-−]?\d+))/g;
    var out = [], last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
      out.push({ t: m[1] === '_' ? 'sub' : 'sup', v: m[3] != null ? m[3] : m[4] });
      last = re.lastIndex;
    }
    if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
    return out;
  }

  return {
    parseNumber: parseNumber,
    normalizeUnit: normalizeUnit,
    parseAltUnits: parseAltUnits,
    parseTolerance: parseTolerance,
    checkAnswer: checkAnswer,
    formatNumber: formatNumber,
    normalizeSearch: normalizeSearch,
    searchGlossary: searchGlossary,
    symbolTokens: symbolTokens
  };
});
