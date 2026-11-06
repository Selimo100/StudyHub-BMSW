/* StudyHub Guide – Laufzeit fuer alle Lernseiten (vanilla, ohne Abhaengigkeiten).
   Progressive Enhancement: Inhalte sind ohne JS lesbar (Loesungen in <details>).
   Dynamische Inhalte werden ausschliesslich ueber textContent/DOM-APIs erzeugt –
   nie ueber innerHTML mit Daten. */
(function () {
  'use strict';
  var core = window.SHCore;
  var doc = document;
  var root = doc.documentElement;
  root.classList.add('sh-js');

  var $ = function (id) { return doc.getElementById(id); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var el = function (tag, attrs, text) {
    var n = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    if (text != null) n.textContent = text;
    return n;
  };
  /** Text mit _sub und ^sup sicher als DOM darstellen. */
  var symbolic = function (text, target) {
    core.symbolTokens(text).forEach(function (t) {
      if (t.t === 'text') target.appendChild(doc.createTextNode(t.v));
      else target.appendChild(el(t.t, null, t.v));
    });
    return target;
  };
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var drawerMq = window.matchMedia('(max-width: 959.98px)');

  // ---------- Speicher (lokal, optional) ----------
  var storeKey = 'studyhub:v1:' + location.pathname;
  var state = { solved: {}, exam: {}, lz: {} };
  try { var saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); if (saved && typeof saved === 'object') state = { solved: saved.solved || {}, exam: saved.exam || {}, lz: saved.lz || {} }; } catch (e) { /* privat/gesperrt */ }
  var persist = function () { try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (e) { /* ignorieren */ } };

  // ---------- Drawer / Navigation ----------
  var sidebar = $('sh-sidebar'), shell = $('sh-shell'), topbar = $('sh-topbar');
  var menuBtn = $('sh-menu-btn'), closeBtn = $('sh-close-btn'), scrim = $('sh-scrim');
  var fab = $('sh-glossary-fab');
  var drawerOpen = false;

  function setInert(node, on) { if (!node) return; if (on) node.setAttribute('inert', ''); else node.removeAttribute('inert'); }
  function applyMode() {
    if (drawerMq.matches) { setInert(sidebar, !drawerOpen); }
    else { if (drawerOpen) closeDrawer(false); setInert(sidebar, false); setInert(shell, false); setInert(topbar, false); setInert(fab, false); }
  }
  function openDrawer(focusTarget) {
    if (!drawerMq.matches || !sidebar) return;
    drawerOpen = true;
    doc.body.classList.add('sh-drawer-open');
    setInert(sidebar, false); setInert(shell, true); setInert(topbar, true); setInert(fab, true);
    root.style.overflow = 'hidden';
    menuBtn && menuBtn.setAttribute('aria-expanded', 'true');
    var active = sidebar.querySelector('.sh-nav-link[aria-current="true"]');
    (focusTarget || active || closeBtn).focus({ preventScroll: true });
    if (active && !focusTarget) scrollNavIntoView(active);
  }
  function closeDrawer(restoreFocus) {
    if (!drawerOpen) return;
    drawerOpen = false;
    doc.body.classList.remove('sh-drawer-open');
    setInert(shell, false); setInert(topbar, false); setInert(fab, false);
    if (drawerMq.matches) setInert(sidebar, true);
    root.style.overflow = '';
    menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false && menuBtn) menuBtn.focus({ preventScroll: true });
  }
  menuBtn && menuBtn.addEventListener('click', function () { drawerOpen ? closeDrawer() : openDrawer(); });
  closeBtn && closeBtn.addEventListener('click', function () { closeDrawer(); });
  scrim && scrim.addEventListener('click', function () { closeDrawer(); });
  (drawerMq.addEventListener ? drawerMq.addEventListener.bind(drawerMq, 'change') : drawerMq.addListener.bind(drawerMq))(applyMode);
  applyMode();

  // Kapitel-Links: Drawer schliessen, Fokus ins Kapitel setzen
  var navLinks = $$('.sh-nav-link[href^="#"], .sh-lz-link[href^="#"]');
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      var target = $(a.getAttribute('href').slice(1));
      if (drawerOpen) closeDrawer(false);
      if (target) {
        setActive(target.id);
        window.setTimeout(function () {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }, 0);
      }
    });
  });

  function scrollNavIntoView(link) {
    if (!sidebar) return;
    var r = link.getBoundingClientRect(), s = sidebar.getBoundingClientRect();
    if (r.top < s.top + 60 || r.bottom > s.bottom - 60) sidebar.scrollTop += r.top - s.top - s.height / 3;
  }
  var sideLinks = $$('.sh-nav-link[href^="#"]');
  var currentId = null;
  function setActive(id) {
    if (!id || id === currentId) return;
    var match = sideLinks.filter(function (a) { return a.getAttribute('href') === '#' + id; });
    if (!match.length) return;
    currentId = id;
    sideLinks.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (!drawerMq.matches) scrollNavIntoView(match[0]);
  }
  var sections = $$('.sh-main > section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var first = sections.filter(function (s) { return visible[s.id]; })[0];
      if (first) setActive(first.id);
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
  setActive(location.hash.slice(1) || (sections[0] && sections[0].id));

  // ---------- Glossar ----------
  var glossaryData = [];
  try { var gd = $('sh-glossary'); if (gd) glossaryData = JSON.parse(gd.textContent || '[]'); } catch (e) { glossaryData = []; }
  var gPanel = $('sh-glossary-panel'), gInput = $('sh-glossary-search'), gResults = $('sh-glossary-results'), gToggle = $('sh-glossary-toggle'), gStatus = $('sh-glossary-status');

  function renderGlossary() {
    if (!gResults) return;
    var hits = core.searchGlossary(glossaryData, gInput.value);
    gResults.textContent = '';
    hits.forEach(function (h) {
      var e = h.entry;
      var li = el('li', { class: 'sh-gl-entry', 'data-symbol': e.symbol });
      var head = el('div', { class: 'sh-gl-head' });
      head.appendChild(symbolic(e.symbol, el('span', { class: 'sh-gl-sym' })));
      head.appendChild(el('span', { class: 'sh-gl-name' }, e.name));
      if (e.unit) head.appendChild(symbolic('[' + e.unit + ']', el('span', { class: 'sh-gl-unit' })));
      if (h.ambiguous) head.appendChild(el('span', { class: 'sh-gl-ambiguous', title: 'Gleiches Zeichen, andere Bedeutung' }, 'mehrdeutig'));
      li.appendChild(head);
      if (e.meaning) li.appendChild(symbolic(e.meaning, el('p', { class: 'sh-gl-meaning' })));
      if (e.example) li.appendChild(symbolic(e.example, el('p', { class: 'sh-gl-example' })));
      gResults.appendChild(li);
    });
    if (gStatus) gStatus.textContent = gInput.value.trim()
      ? (hits.length ? hits.length + (hits.length === 1 ? ' Treffer' : ' Treffer') : 'Kein Treffer. Versuche z. B. ein Zeichen, eine Einheit oder einen Begriff.')
      : glossaryData.length + ' Formelzeichen';
  }
  function openGlossary(query) {
    if (!gPanel) return;
    gPanel.hidden = false;
    gToggle && gToggle.setAttribute('aria-expanded', 'true');
    if (typeof query === 'string') gInput.value = query;
    renderGlossary();
    if (drawerMq.matches) openDrawer(gInput); else gInput.focus({ preventScroll: true });
    if (!drawerMq.matches && gToggle) scrollNavIntoView(gToggle);
  }
  function closeGlossary() {
    if (!gPanel) return;
    gPanel.hidden = true;
    gToggle && gToggle.setAttribute('aria-expanded', 'false');
  }
  if (gPanel && glossaryData.length) {
    gToggle.addEventListener('click', function () { gPanel.hidden ? openGlossary() : closeGlossary(); });
    gInput.addEventListener('input', renderGlossary);
    $$('[data-sh-open-glossary]').forEach(function (b) { b.addEventListener('click', function () { openGlossary(); }); });
    doc.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-glossary]');
      if (t) { e.preventDefault(); openGlossary(t.getAttribute('data-glossary')); }
    });
  } else {
    $$('.sh-glossary, [data-sh-open-glossary]').forEach(function (n) { n.hidden = true; });
  }

  // ---------- Tastatur ----------
  var typing = function (n) { return n && (n.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)); };
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var exp = doc.querySelector('.sh-figure.is-expanded');
      if (exp) { toggleFigure(exp, false); return; }
      if (drawerOpen) { closeDrawer(); return; }
      if (gPanel && !gPanel.hidden && doc.activeElement === gInput) { closeGlossary(); gToggle.focus(); return; }
    }
    if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(doc.activeElement) && gPanel && glossaryData.length) {
      e.preventDefault();
      openGlossary();
    }
  });

  // ---------- Lokales Scrollen (Formeln, Tabellen) ----------
  $$('.sh-main table').forEach(function (t) {
    if (t.parentElement && t.parentElement.classList.contains('sh-table')) return;
    var wrap = el('div', { class: 'sh-table' });
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });
  var scrollers = $$('.sh-table, .sh-formula');
  scrollers.forEach(function (s, i) {
    if (!s.nextElementSibling || !s.nextElementSibling.classList.contains('sh-scroll-hint')) {
      var hint = el('p', { class: 'sh-scroll-hint', 'aria-hidden': 'true' }, '↔ seitlich wischen, um alles zu sehen');
      s.parentNode.insertBefore(hint, s.nextSibling);
    }
  });
  function markOverflow() {
    scrollers.forEach(function (s) {
      var over = s.scrollWidth > s.clientWidth + 2;
      s.setAttribute('data-overflowing', over ? 'true' : 'false');
      if (over) { s.setAttribute('tabindex', '0'); if (!s.hasAttribute('role')) { s.setAttribute('role', 'region'); s.setAttribute('aria-label', s.classList.contains('sh-table') ? 'Tabelle, horizontal scrollbar' : 'Formel, horizontal scrollbar'); } }
      else if (s.getAttribute('role') === 'region') { s.removeAttribute('tabindex'); s.removeAttribute('role'); s.removeAttribute('aria-label'); }
    });
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(markOverflow, 120); });

  // ---------- Diagramme vergroessern ----------
  function toggleFigure(fig, on) {
    var btn = fig.querySelector('.sh-expand');
    fig.classList.toggle('is-expanded', on);
    root.style.overflow = on ? 'hidden' : (drawerOpen ? 'hidden' : '');
    if (btn) { btn.textContent = on ? 'Schliessen' : 'Vergrössern'; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.focus({ preventScroll: true }); }
    if (on) { fig.setAttribute('role', 'dialog'); fig.setAttribute('aria-modal', 'true'); } else { fig.removeAttribute('role'); fig.removeAttribute('aria-modal'); }
  }
  $$('.sh-figure').forEach(function (fig) {
    if (!fig.querySelector(':scope > svg') || fig.hasAttribute('data-no-expand')) return;
    var b = el('button', { type: 'button', class: 'sh-expand', 'aria-expanded': 'false' }, 'Vergrössern');
    b.addEventListener('click', function () { toggleFigure(fig, !fig.classList.contains('is-expanded')); });
    fig.appendChild(b);
  });

  // ---------- Uebungen ----------
  var LEVELS = { '1': 'Level 1 · Grundlagen', '2': 'Level 2 · Prüfungsniveau', '3': 'Level 3 · Transfer' };
  var HINT_LABELS = ['Tipp 1 · Idee', 'Tipp 2 · Formel', 'Tipp 3 · Ansatz'];
  var uid = 0;
  var exercises = $$('.sh-ex');

  function answerSpec(node) {
    var mistakes = [];
    try { mistakes = JSON.parse(node.getAttribute('data-mistakes') || '[]'); } catch (e) { mistakes = []; }
    return {
      answer: Number(String(node.getAttribute('data-answer')).replace(',', '.')),
      unit: node.getAttribute('data-unit') || '',
      tol: node.getAttribute('data-tol') || undefined,
      altUnits: node.getAttribute('data-alt-units') || undefined,
      mistakes: mistakes
    };
  }

  function buildAnswer(node, onResult) {
    var spec = answerSpec(node);
    var id = 'sh-in-' + (++uid);
    var row = el('div', { class: 'sh-answer-row' });
    var label = el('label', { for: id });
    symbolic(node.getAttribute('data-label') || 'Ergebnis', label);
    var a = Math.abs(spec.answer);
    var needsFullKeyboard = spec.answer < 0 || (a !== 0 && (a >= 1e5 || a < 1e-3));
    var input = el('input', {
      id: id, type: 'text', inputmode: needsFullKeyboard ? 'text' : 'decimal', autocomplete: 'off', autocapitalize: 'off',
      spellcheck: 'false', enterkeyhint: 'done', placeholder: needsFullKeyboard ? 'z. B. 1,2e-4' : 'Zahl', 'aria-describedby': id + '-fb'
    });
    row.appendChild(label); row.appendChild(input);
    var alts = Object.keys(core.parseAltUnits(spec.altUnits));
    var select = null;
    if (alts.length && spec.unit) {
      select = el('select', { 'aria-label': 'Einheit' });
      [spec.unit].concat(alts).forEach(function (u) { select.appendChild(el('option', { value: u }, u)); });
      row.appendChild(select);
    } else if (spec.unit) {
      row.appendChild(symbolic(spec.unit, el('span', { class: 'sh-answer-unit', 'aria-label': 'Einheit ' + spec.unit })));
    }
    var btn = el('button', { type: 'button' }, 'Prüfen');
    row.appendChild(btn);
    var fb = el('p', { class: 'sh-feedback', id: id + '-fb', role: 'status', 'aria-live': 'polite' });
    node.textContent = '';
    node.appendChild(row); node.appendChild(fb);
    var attempts = 0;
    function check() {
      var s = Object.assign({}, spec, { selectedUnit: select ? select.value : undefined });
      var r = core.checkAnswer(input.value, s);
      if (r.status !== 'empty' && r.status !== 'invalid') attempts++;
      var msg = r.message;
      if (r.status === 'correct') msg = '✓ Richtig' + (spec.unit ? ' (' + core.formatNumber(r.value) + ' ' + spec.unit + ')' : '') + '. Vergleiche trotzdem deinen Lösungsweg.';
      else if (r.status === 'wrong' && attempts >= 2) msg += ' Tipp: Öffne den nächsten Hinweis.';
      fb.textContent = msg;
      fb.setAttribute('data-status', r.status);
      input.setAttribute('aria-invalid', r.status === 'correct' || r.status === 'empty' ? 'false' : 'true');
      node.setAttribute('data-correct', r.status === 'correct' ? 'true' : 'false');
      onResult && onResult(r);
    }
    btn.addEventListener('click', check);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  }

  function updateProgress() {
    var box = $('sh-progress-box');
    if (!box || !exercises.length) return;
    box.hidden = false;
    var done = exercises.filter(function (ex) { return state.solved[ex.id]; }).length;
    $('sh-progress-text').textContent = done + ' / ' + exercises.length;
    $('sh-progress-bar').style.width = (done / exercises.length * 100) + '%';
  }

  exercises.forEach(function (ex, i) {
    if (!ex.id) ex.id = 'uebung-' + (i + 1);
    var meta = el('ul', { class: 'sh-ex-meta' });
    var lvl = ex.getAttribute('data-level');
    if (lvl && LEVELS[lvl]) meta.appendChild(el('li', { class: 'sh-level', 'data-level': lvl }, LEVELS[lvl]));
    var obj = ex.getAttribute('data-objective');
    if (obj) meta.appendChild(el('li', { class: 'sh-objective-ref' }, 'Lernziel ' + obj));
    if (meta.children.length && !ex.querySelector('.sh-ex-meta')) ex.insertBefore(meta, ex.firstChild);

    var answers = $$('.sh-answer[data-answer]', ex);
    var check = function () {
      var all = answers.every(function (a) { return a.getAttribute('data-correct') === 'true'; });
      if (all && answers.length) { state.solved[ex.id] = true; ex.classList.add('is-solved'); persist(); updateProgress(); }
    };
    answers.forEach(function (a) { buildAnswer(a, check); });
    if (state.solved[ex.id]) ex.classList.add('is-solved');

    // Gestufte Tipps
    var hints = $$('.sh-hint', ex);
    var solution = ex.querySelector('.sh-solution');
    var actions = el('div', { class: 'sh-actions' });
    if (hints.length) {
      var wrap = el('div', { class: 'sh-hints' });
      hints[0].parentNode.insertBefore(wrap, hints[0]);
      hints.forEach(function (h, k) {
        wrap.appendChild(h);
        h.id = h.id || ex.id + '-tipp-' + (k + 1);
        if (!h.querySelector('.sh-hint-label')) h.insertBefore(el('span', { class: 'sh-hint-label' }, h.getAttribute('data-label') || HINT_LABELS[k] || ('Tipp ' + (k + 1))), h.firstChild);
      });
      var shown = 0;
      var hb = el('button', { type: 'button', class: 'is-secondary', 'aria-controls': hints.map(function (h) { return h.id; }).join(' ') }, 'Tipp 1 von ' + hints.length);
      hb.addEventListener('click', function () {
        if (shown >= hints.length) return;
        hints[shown].classList.add('is-shown');
        hints[shown].setAttribute('tabindex', '-1');
        hints[shown].focus({ preventScroll: false });
        shown++;
        if (shown >= hints.length) { hb.textContent = 'Alle Tipps angezeigt'; hb.disabled = true; }
        else hb.textContent = 'Tipp ' + (shown + 1) + ' von ' + hints.length;
      });
      actions.appendChild(hb);
      wrap.parentNode.insertBefore(actions, wrap);
    } else if (answers.length) {
      answers[answers.length - 1].parentNode.insertBefore(actions, answers[answers.length - 1].nextSibling);
    }
    if (solution && solution.tagName === 'DETAILS') {
      var summary = solution.querySelector('summary');
      if (summary && !summary.textContent.trim()) summary.textContent = 'Vollständiger Lösungsweg';
    }
    if (!actions.children.length && actions.parentNode) actions.parentNode.removeChild(actions);
  });
  updateProgress();
  var resetBtn = $('sh-reset-btn');
  resetBtn && resetBtn.addEventListener('click', function () {
    if (!window.confirm('Fortschritt dieser Seite zurücksetzen? Eingaben und gelöste Übungen werden gelöscht.')) return;
    state = { solved: {}, exam: {}, lz: {} };
    try { localStorage.removeItem(storeKey); } catch (e) { /* ignorieren */ }
    exercises.forEach(function (ex) { ex.classList.remove('is-solved'); });
    $$('.sh-answer input, .sh-selfscore input').forEach(function (i) { i.value = ''; });
    $$('.sh-feedback').forEach(function (f) { f.textContent = ''; f.removeAttribute('data-status'); });
    updateProgress(); updateExam(); updateLz();
  });

  // ---------- Quiz ----------
  var qn = 0;
  $$('.sh-quiz').forEach(function (quiz) {
    var questions = $$('.sh-q', quiz);
    questions.forEach(function (q) {
      var name = 'sh-q-' + (++qn);
      var text = q.querySelector('.sh-q-text');
      if (text) { text.id = text.id || name + '-text'; q.setAttribute('role', 'radiogroup'); q.setAttribute('aria-labelledby', text.id); }
      $$('.sh-choices > li', q).forEach(function (li) {
        var why = li.querySelector('.sh-why');
        var key = li.getAttribute('data-key');
        var lab = el('label', { class: 'sh-choice' });
        var input = el('input', { type: 'radio', name: name, value: key });
        lab.appendChild(input);
        var span = el('span');
        Array.prototype.slice.call(li.childNodes).forEach(function (c) { if (c !== why) span.appendChild(c); });
        lab.appendChild(span);
        li.appendChild(lab);
        if (why) li.appendChild(why);
      });
    });
    var actions = el('div', { class: 'sh-actions' });
    var btn = el('button', { type: 'button' }, 'Quiz auswerten');
    var again = el('button', { type: 'button', class: 'is-secondary' }, 'Nochmals versuchen');
    var result = el('p', { class: 'sh-quiz-result', role: 'status', 'aria-live': 'polite' });
    actions.appendChild(btn); actions.appendChild(again);
    quiz.appendChild(actions); quiz.appendChild(result);
    btn.addEventListener('click', function () {
      var score = 0, open = 0;
      questions.forEach(function (q) {
        var correct = q.getAttribute('data-correct');
        var picked = q.querySelector('input:checked');
        $$('.sh-choices > li', q).forEach(function (li) {
          var k = li.getAttribute('data-key'), lab = li.querySelector('.sh-choice'), why = li.querySelector('.sh-why');
          lab.classList.remove('is-correct', 'is-wrong');
          if (why) { why.classList.remove('is-shown', 'is-correct'); }
          if (!picked) return;
          if (k === correct) { lab.classList.add('is-correct'); if (why) why.classList.add('is-shown', 'is-correct'); }
          else if (picked.value === k) { lab.classList.add('is-wrong'); if (why) why.classList.add('is-shown'); }
        });
        if (!picked) open++; else if (picked.value === correct) score++;
      });
      result.textContent = score + ' von ' + questions.length + ' richtig' + (open ? ' · ' + open + ' unbeantwortet' : '') + '. Lies bei falschen Antworten die Begründung.';
    });
    again.addEventListener('click', function () {
      $$('input[type="radio"]', quiz).forEach(function (i) { i.checked = false; });
      $$('.sh-choice', quiz).forEach(function (l) { l.classList.remove('is-correct', 'is-wrong'); });
      $$('.sh-why', quiz).forEach(function (w) { w.classList.remove('is-shown', 'is-correct'); });
      result.textContent = '';
    });
  });

  // ---------- Original-Lernziele: Selbsteinschaetzung (nie automatisch) ----------
  var lzChecks = $$('[data-lz-check]');
  function updateLz() {
    var done = 0;
    lzChecks.forEach(function (c) {
      c.checked = !!state.lz[c.getAttribute('data-lz-check')];
      if (c.checked) done++;
      var item = c.closest('.sh-lz-item');
      if (item) item.classList.toggle('is-checked', c.checked);
    });
    var cnt = $('sh-lz-count');
    if (cnt) cnt.textContent = done + ' von ' + lzChecks.length + ' verstanden';
  }
  lzChecks.forEach(function (c) {
    c.addEventListener('change', function () {
      var k = c.getAttribute('data-lz-check');
      if (c.checked) state.lz[k] = true; else delete state.lz[k];
      persist(); updateLz();
    });
  });
  updateLz();

  // ---------- Probepruefung (Selbstbewertung nach Musterloesung) ----------
  var examTasks = $$('.sh-exam-task[data-points]');
  var examSummary = $('sh-exam-summary') || null;
  function updateExam() {
    if (!examTasks.length) return;
    var total = 0, reached = 0, scored = 0, weak = [];
    examTasks.forEach(function (t) {
      var max = Number(t.getAttribute('data-points')) || 0;
      total += max;
      var v = state.exam[t.id];
      var inp = t.querySelector('.sh-selfscore input');
      if (inp && v != null && inp.value === '') inp.value = String(v).replace('.', ',');
      if (v != null) { scored++; reached += v; if (v < 0.6 * max) weak.push(t); }
    });
    if (!examSummary) return;
    examSummary.textContent = '';
    if (!scored) { examSummary.appendChild(el('p', { class: 'sh-exam-info' }, 'Bewerte jede Aufgabe nach der Musterlösung selbst. Danach erscheint hier deine Auswertung.')); return; }
    examSummary.appendChild(el('p', { class: 'sh-quiz-result' }, reached.toString().replace('.', ',') + ' von ' + total + ' Punkten (' + scored + ' von ' + examTasks.length + ' Aufgaben bewertet).'));
    if (weak.length) {
      examSummary.appendChild(el('p', null, 'Unter 60 % – diese Themen nochmals repetieren:'));
      var ul = el('ul', { class: 'sh-weak-list' });
      weak.forEach(function (t) {
        var li = el('li');
        var title = (t.querySelector('h3') || {}).textContent || t.id;
        var ref = t.getAttribute('data-review');
        if (ref && $(ref.replace('#', ''))) { var a = el('a', { href: '#' + ref.replace('#', '') }, title.trim()); li.appendChild(a); }
        else li.textContent = title.trim();
        ul.appendChild(li);
      });
      examSummary.appendChild(ul);
    } else if (scored === examTasks.length) {
      examSummary.appendChild(el('p', null, 'Alle Aufgaben mindestens 60 % – gute Basis. Prüfe trotzdem die Rundung und die Einheiten in deinen Lösungen.'));
    }
  }
  examTasks.forEach(function (t, i) {
    if (!t.id) t.id = 'pruefung-' + (i + 1);
    var max = Number(t.getAttribute('data-points')) || 0;
    $$('.sh-answer[data-answer]', t).forEach(function (a) { buildAnswer(a); });
    var id = t.id + '-score';
    var box = el('div', { class: 'sh-selfscore' });
    box.appendChild(el('label', { for: id }, 'Erreichte Punkte (selbst bewertet)'));
    var inp = el('input', { id: id, type: 'text', inputmode: 'decimal', autocomplete: 'off' });
    box.appendChild(inp);
    box.appendChild(el('span', { class: 'sh-answer-unit' }, 'von ' + max));
    t.appendChild(box);
    inp.addEventListener('change', function () {
      var p = core.parseNumber(inp.value);
      if (!p.ok) { delete state.exam[t.id]; }
      else state.exam[t.id] = Math.max(0, Math.min(max, Math.round(p.value * 2) / 2));
      if (p.ok) inp.value = String(state.exam[t.id]).replace('.', ',');
      persist(); updateExam();
    });
  });
  updateExam();

  markOverflow();
  // Sichtbar fuer Tests/Diagnose
  window.StudyHubGuide = { openDrawer: openDrawer, closeDrawer: closeDrawer, openGlossary: openGlossary, version: root.getAttribute('data-sh-guide') };
})();
