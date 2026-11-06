# StudyHub Design-System (Lernseiten v2)

Alle Lernseiten sehen gleich aus und funktionieren gleich – **nur die Fachfarbe
und die fachspezifischen Inhalte ändern sich**. Vorbild ist das helle
Fluidstatik-Lernstudio: off-white Canvas, weisse Karten, linke Kapitel-Sidebar,
Formelblöcke mit Akzentrand, gerechnete Beispiele, Übungen, Quiz, Probeprüfung,
durchsuchbare Formelzeichen-Legende.

Du schreibst **nur den Inhalt**. Rahmen, CSS, Navigation, Drawer, Legende,
Antwortprüfung und Theme kommen aus `assets/` und werden vom Builder eingesetzt.
Kein eigenes CSS-Design pro Seite, keine eigene Palette, kein dunkles Layout.

## Dateien

| Datei | Zweck |
|---|---|
| `assets/subjects.json` | **einzige** Fach→Farbe-Zuordnung inkl. Aliase |
| `assets/studyhub-guide.css` | Design-Tokens, Layout, alle Komponenten, Mobile, Druck |
| `assets/guide-shell.html` | Seitengerüst: Topbar, Drawer/Sidebar, Hero, Footer |
| `assets/sh-core.js` | reine Logik: Zahlen lesen, Antworten prüfen, Glossarsuche |
| `assets/studyhub-guide.js` | UI: Drawer, aktive Navigation, Legende, Übungen, Quiz, Prüfung |
| `assets/example/auftrieb.content.html` | **Referenz-Inhalt** – bei Unsicherheit dort nachsehen |
| `scripts/build-guide.mjs` | baut daraus eine eigenständige HTML-Datei |
| `scripts/check-render.mjs` | rendert in 8 Viewports und prüft Layout + Interaktion |

## Ablauf

```bash
SK=~/.claude/skills/studyhub-summary
# 1. Inhalt schreiben (Arbeitskopie ausserhalb des Repos, z. B. im Scratchpad)
# 2. Bauen – Fachfarbe kommt automatisch aus "subject"
node $SK/scripts/build-guide.mjs thema.content.html --out "$REPO/summaries/bmsw/<fach>/<name>.html"
# 3. Bestehende v2-Seite aktualisieren: Inhalt zwischen den sh:content-Markern
#    bearbeiten, dann neu bauen (übernimmt neues CSS/JS, Meta bleibt erhalten)
node $SK/scripts/build-guide.mjs "$REPO/summaries/bmsw/<fach>/<name>.html"
```

Der Builder bricht bei Fehlern ab und schreibt nichts: fehlende Pflicht-Meta,
doppelte/reservierte IDs, `ß`, «Offline nutzbar»-Labels, SVG ohne `viewBox`,
`<img>` ohne `alt`, unausgeglichenes `<math>`, kaputtes Glossar-JSON,
Lernziel-Sprungziele ins Leere. Warnungen (kein Glossar, keine Übungen,
Inline-Hexfarben, unbekanntes Fach) beheben, sofern sie nicht bewusst sind.

## Inhaltsdatei

```html
<script type="application/json" id="sh-meta">
{
  "subject": "Physik",                       // Pflicht – freier Name/Slug, wird normalisiert
  "topic": "Fluidstatik – Auftrieb",         // Pflicht – Thema (Titel, Footer, Topbar-Fallback)
  "title": "Auftrieb verstehen und berechnen", // Pflicht – h1
  "shortTitle": "Auftrieb",                  // kurz für die mobile Kopfzeile
  "school": "BMS",                           // BMS | BMS Abschlussprüfung | BBW
  "symbol": "ρ",                             // Zeichen im Sidebar-Logo (optional)
  "lead": "Ein Satz, worum es geht und was man danach kann.",
  "tags": ["6 Lernziele", "12 Rechenaufgaben", "Probeprüfung"],
  "examInfo": "Prüfung 14.09., 45 min, Taschenrechner + Formelsammlung",
  "objectivesHeading": "5  Fluidstatik II: Auftrieb",          // Originalüberschrift, wörtlich
  "objectivesSource": "Lernziele Fluidstatik II, Seite 1",       // Dokumenttitel, nie Dateiname/Pfad
  "objectives": [                                               // WÖRTLICH aus dem Lernziel-Dokument
    { "id": "5.1", "text": "Sie können das Prinzip von Archimedes …" },
    { "id": "5.4", "text": "…", "scope": "adjacent" }          // Prüfungsumfang nicht bestätigt
  ],
  "glossaryTitle": "Formelzeichen-Legende",  // z. B. "Begriffe" in Geschichte
  "glossaryShort": "Formeln"                 // Button-Text in der mobilen Kopfzeile
}
</script>
<section id="archimedes" data-nav="Archimedes" data-nav-num="5.1"
         data-nav-group="Lernziele" data-objective="5.1"> … </section>
<script type="application/json" id="sh-glossary">[ … ]</script>
<script> /* optional: Simulation dieser Seite */ </script>
```

- Kommentare (`<!-- … -->`) werden beim Bauen entfernt.
- **Navigation entsteht aus den Sections**: jede `<section>` mit `id` + `data-nav`
  wird ein Sidebar-Eintrag. `data-nav-num` (z. B. `5.1`) oder `data-nav-icon`
  (`✎`, `?`, `✓`), `data-nav-group` gruppiert (Grundlagen · Lernziele · Training ·
  Nachschlagen). Jede dieser Sections beginnt mit `<span class="sh-eyebrow">` + `<h2>`.
- Lernziele → siehe «Original-Lernziele» unten.
- Reservierte IDs: `main`, alles mit `sh-` (ausser `sh-glossary`, `sh-exam-summary`).
- `"subject"` ist ein Name – keine Farbe. Fehlt ein Fach in `subjects.json`, wird es
  dort ergänzt (siehe unten), nicht in der Seite eingefärbt.

## Komponenten (Klassen)

Nur diese Klassen verwenden. Keine `style="color:#…"` im Inhalt.

| Zweck | Markup |
|---|---|
| Kapitel-Kicker | `<span class="sh-eyebrow">Lernziel 5.1</span>` |
| Einleitung | `<p class="sh-section-intro">` |
| Karte / Raster | `.sh-card` (`.is-soft`), `.sh-grid` (auto), `.sh-two` (2 Spalten → 1 auf Mobile) |
| Formelblock | `<div class="sh-formula"><span class="sh-formula-label">…</span><math display="block">…</math><span class="sh-formula-note">Gültigkeit</span></div>` |
| Rechenweg | `<dl class="sh-calc">` mit `dt`/`dd`: Gegeben · Gesucht · Skizze / Kräftebild · Ansatz · Formel umstellen · SI-Werte einsetzen · Berechnen · Ergebnis & Kontrolle |
| Ergebnis | `<span class="sh-result">` |
| Schritte | `<ol class="sh-steps">` |
| Typischer Fehler | `<div class="sh-warn"><span class="sh-callout-title">Typischer Fehler</span>…</div>` |
| Prüfungstipp | `.sh-tip` · neutrale Notiz `.sh-note` |
| Zusatz, nicht aus dem Material | `<div class="sh-extra"><span class="sh-callout-title">Zusatzerklärung – nicht aus dem Skript</span>…</div>` |
| Quellenhinweis | `<span class="sh-source">Skript S. 12</span>` – Dokumenttitel/Seite/Aufgabe, **nie** Dateinamen oder Pfade |
| Tabelle | normales `<table>` (mit `<caption>`, `th scope`); wird automatisch in einen lokal scrollbaren Container mit Hinweis gesetzt |
| Diagramm | `<figure class="sh-figure"><span class="sh-figure-title">…</span><svg viewBox=…>…</svg><figcaption>…</figcaption></figure>` → `references/diagrams.md` |
| Situation + Kräftebild | `<div class="sh-figure-pair">` mit zwei `.sh-figure` |
| Begriff mit Legende verknüpfen | `<button type="button" data-glossary="F_A">F<sub>A</sub></button>` öffnet die Legende gefiltert |

### Mathematik

- Abgesetzte Formeln: **MathML** (`<math display="block">`) – läuft ohne Bibliothek
  in Safari, Chrome, Firefox, Edge. Brüche mit `<mfrac>`, Indizes `<msub>`,
  Potenzen `<msup>`, Wurzeln `<msqrt>`, Vektoren `<mover><mi>v</mi><mo>→</mo></mover>`,
  Integrale `<msubsup><mo>∫</mo>…</msubsup>`.
- Beschreibende Indizes aufrecht: `<msub><mi>F</mi><mi mathvariant="normal">G</mi></msub>`,
  mehrbuchstabige als `<mi>Fl</mi>` / `<mtext>verdr</mtext>`.
- Im Fliesstext: `<var>F</var><sub>A</sub>`, Einheiten aufrecht (`kg/m³`, `m/s²`).
- **Keine** Schrägstrich-Brüche wie `F_A/(rho*g)` in Formelblöcken.
- Lange Gleichungen: auf mehrere `<math>`-Zeilen umbrechen (je Umformungsschritt eine);
  sonst scrollt der Formelblock lokal mit sichtbarem Hinweis – nie die Seite.

### Übungen (numerisch)

```html
<div class="sh-exercises">
<article class="sh-ex" id="ue-1" data-level="2" data-objective="5.2">
  <h3>2. Federwaage unter Wasser</h3>
  <p>Aufgabenstellung mit allen Angaben und Einheiten …</p>
  <div class="sh-answer" data-answer="29.43" data-unit="N" data-label="F_H ="
       data-tol="1%" data-alt-units="kN:1000"
       data-mistakes='[{"value":49.05,"msg":"Das ist nur F_G – der Auftrieb fehlt."}]'></div>
  <div class="sh-hint"><p>Idee …</p></div>        <!-- Tipp 1 · Idee -->
  <div class="sh-hint"><p>Formel …</p></div>      <!-- Tipp 2 · Formel -->
  <div class="sh-hint"><p>Ansatz …</p></div>      <!-- Tipp 3 · Ansatz -->
  <details class="sh-solution"><summary>Vollständiger Lösungsweg</summary> … </details>
</article>
</div>
```

- `data-answer` mit Punkt, ungerundet (Endwert der exakten Rechnung).
- `data-tol`: Standard `1%`; absolut z. B. `0.05`. Bei gerundeten Tabellenwerten grosszügiger.
- `data-alt-units`: `Einheit:Faktor`, Faktor = Wert in der Haupteinheit (1 kN = 1000 N).
- `data-mistakes`: nur **echte**, aus dem Rechenweg ableitbare Fehlresultate mit
  konkreter Rückmeldung (vergessene Umrechnung, falsche Kraft, Teil statt Ganzes).
- Mehrteilige Aufgaben: mehrere `.sh-answer` im selben `article`.
- Ohne Zahlenantwort (Begründen, Skizzieren): kein `.sh-answer`, nur Tipps + Lösung.
- Die Runtime ergänzt Level-Badge, Eingabefeld (16 px, passende Tastatur), Prüfen-Button,
  gestufte Tipp-Taste, Live-Feedback und lokalen Fortschritt.

### Quiz

```html
<div class="sh-quiz">
  <div class="sh-q" data-correct="b">
    <p class="sh-q-text">1. Frage …</p>
    <ol class="sh-choices">
      <li data-key="a">Antwort A<span class="sh-why">Warum A falsch ist …</span></li>
      <li data-key="b">Antwort B<span class="sh-why">Warum B stimmt …</span></li>
    </ol>
  </div>
</div>
```

Jede Option bekommt ein `.sh-why` – die Falschantworten zielen auf echte Fehlvorstellungen.

### Probeprüfung

```html
<p class="sh-exam-head"><span>Hilfsmittel: …</span><span>Total 22 Punkte</span></p>
<article class="sh-exam-task" id="pa" data-points="4" data-review="archimedes">
  <h3>Aufgabe A · Thema <span class="sh-points">4 P.</span></h3>
  <p>Aufgabe ohne Methodenhinweis …</p>
  <div class="sh-answer" data-answer="25.506" data-unit="N" data-label="F_H ="></div>  <!-- optional -->
  <details class="sh-solution"><summary>Musterlösung und Bewertung</summary> … Punkte pro Teilschritt … </details>
</article>
<div id="sh-exam-summary" class="sh-exam-summary" aria-live="polite"></div>
```

Selbstbewertung pro Aufgabe → Summe + Liste der Aufgaben unter 60 %, verlinkt über
`data-review` auf das passende Kapitel. Keine erfundenen Statistiken.

### Glossar / Formelzeichen-Legende

```json
[{ "symbol": "F_A", "name": "Auftriebskraft", "unit": "N",
   "meaning": "Wirkt nach oben; gleich dem Gewicht der verdrängten Flüssigkeit.",
   "example": "F_A = ρ_Fl · V_verdr · g", "aliases": ["auftrieb"] }]
```

- `symbol`, `name` Pflicht; `_x` / `_{xy}` → Index, `^2` → Exponent (sicher gerendert).
- Suche findet `FG`, `F_G`, `F G`, `rho`, `ρ`, Einheiten (`kg/m3`) und Begriffe ohne Umlaute.
- Gleiches Zeichen, andere Bedeutung (z. B. `W` Arbeit vs. Watt): **beide** Einträge
  anlegen – die Legende markiert sie automatisch als «mehrdeutig».
- Symbole und Schreibweise der Lehrperson übernehmen, Abweichungen im `meaning` nennen.
- Sachfächer: als Begriffslegende nutzen (`glossaryTitle: "Begriffe"`, `unit` leer lassen).
- Öffnen: Sidebar, Taste **L** (nicht in Eingabefeldern), Kopfzeilen-Button auf Mobile.

### Simulation (nur wenn sie Verständnis bringt)

`.sh-card` > `.sh-sim` mit `.sh-sim-controls` (Label + `<output>` + `input[type=range]`/`select`),
`.sh-sim-readout` (`aria-live`) mit Live-Gleichung, `.sh-sim-assumptions`, und eine
`.sh-figure data-no-expand` mit SVG. Skript als `<script>` in der Inhaltsdatei;
`window.SHCore.formatNumber()` für Dezimalkomma. Das Modell muss exakt stimmen und
Bild, Zahlen und Text müssen aus **derselben** Rechnung kommen.

## Original-Lernziele (Pflicht bei offiziellen Lernzielen)

Die offiziellen Lernziele erscheinen **wörtlich** in einem eingeklappten Block
«Original-Lernziele» in der linken Sidebar (auf Mobile im Drawer) – mit
Originalüberschrift, Originalnummerierung, Häkchen «verstanden» (Selbsteinschätzung,
lokal gespeichert, nie automatisch gesetzt), Zähler «x von n verstanden» und
«Zum Kapitel →». Kein grosser Lernziel-Block im Artikel.

- `id` = Nummerierung **exakt wie im Original** («5.1», «2.3 a)», «LZ 4»).
- `text` = Wortlaut **exakt wie im Original**: nicht kürzen, umformulieren, korrigieren,
  zusammenlegen oder an den Inhalt anpassen. Zeichensetzung, Fachbegriffe und Symbole
  (ρ, ², ≠ als Unicode) wie in der Quelle; Zeilenumbrüche bleiben erhalten. Der Text
  wird nur escaped, nie als Markup interpretiert.
- Reihenfolge = Reihenfolge im Dokument. Nichts weglassen; nicht prüfungsrelevante
  Ziele nur weglassen, wenn die Lehrperson den Umfang so festgelegt hat.
- `scope: "adjacent"`: im Dokument vorhanden, aber Prüfungsumfang unklar/nicht
  bestätigt → separat «Angrenzend – Prüfungsumfang nicht bestätigt».
- Verknüpfung über `data-objective="<key>"` an `<section>`, `.sh-ex`, `.sh-exam-task`,
  `.sh-q`. `key` = `id` ohne Leerzeichen/Kommas («2.3 a)» → `2.3a)`) oder explizit
  `"key"`. Mehrere Lernziele: `data-objective="5.1 5.2"`.
- Gibt es kein offizielles Lernziel-Dokument: **keine** `objectives` erfinden.
- Enthält eine Quelle `ß`, bricht der Build ab – dann nachfragen, nicht still ändern.

Der Builder **bricht ab**, wenn ein bestätigtes Lernziel keinen Abschnitt oder keine
Übung/Prüfungsaufgabe hat, wenn `data-objective` auf ein unbekanntes Lernziel zeigt,
bei doppelten Nummern, leerem Wortlaut oder toten Links. Er druckt eine
Abdeckungstabelle (Abschnitt · Übungen · Prüfung · Quiz). Fehlt Abdeckung: **Inhalt
ergänzen** – nie den Lernziel-Text anpassen.

## Fachfarben

Quelle: `assets/subjects.json`. Der Builder löst `"subject"` über Aliase auf
(Gross/Klein, Akzente, `&`, Ordner-Slugs wie `wirtschaft-recht`, BBW-Module `m165`)
und berechnet alle Varianten WCAG-geprüft (`--subject-text`, `-soft`, `-hover`, …).

Neues Fach: in `subjects.json` einen Eintrag mit `label`, `accent`, `aliases`
ergänzen, dann `node scripts/build-guide.mjs --themes` (muss überall «AA ✓» zeigen)
und `node --test tests/*.test.mjs`. Bestehende Seiten erhalten die Farbe beim Neubau.

Die Farbe färbt nur Akzente: aktiver Navigationspunkt, Eyebrow, Fortschritt, Tags,
Formelrand, Buttons, Hervorhebungen in Diagrammen (`dg-accent`). Lesefläche bleibt
neutral. Das Fach steht immer zusätzlich als Text da (Chip, Eyebrow, Kopfzeile).

## Verboten

- dunkles Layout, Neon, grosse Verläufe, Glassmorphism, Deko-Animationen
- eigene Paletten / Hexfarben im Inhalt, eigene Navigation, zweite Top-Navigation
- «Offline nutzbar», «Lokal im Browser nutzbar», «mit Lösungen» als Badge/Footer
- Funktionen nur per Hover, Buttons ohne Funktion, Platzhalter-Aufgaben
- `innerHTML` mit Daten in Seitenskripten (DOM/`textContent` verwenden)
- externe Skripte/Bibliotheken (MathML statt KaTeX, SVG statt Chart-Libs)

## Druck

Sidebar, Kopfzeile und Buttons verschwinden. Geschlossene Lösungen bleiben verborgen
(Übungsblatt), geöffnete werden mitgedruckt.
