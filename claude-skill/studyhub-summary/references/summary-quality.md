# Inhalt und Qualität der Seite

## Der Massstab

Die Seite muss diese Frage mit **Ja** beantworten:

> „Wenn ich alles auf dieser Seite verstehe und lösen kann — bin ich nach den
> gelieferten Lernzielen optimal auf die Prüfung vorbereitet?"

Sie ist Lehrbuch, Nachschlagewerk, Übungsheft, Prüfungssimulator und
Last-Minute-Checkliste in einem.

## Nicht überzusammenfassen

Häufigster Fehlermodus: 100 Seiten Material → 2 Seiten HTML. Das ist unbrauchbar.

**Redundanz verdichten, Wissen nicht.** Wenn ein Lernziel ein Konzept verlangt,
bleibt genug drin, um es wirklich zu lehren. Definitionen, Ausnahmen, Verfahren,
Beispiele, Abgrenzungen, Formeln und Regeln aus dem Material werden **nicht**
gestrichen, nur damit die Seite kürzer wird.

Umgekehrt: keine Länge um der Länge willen. Jeder Abschnitt hat Lernwert.

## Aufbau eines wichtigen Konzepts

1. Definition
2. Erklärung in einfacher Sprache
3. Warum es zählt
4. Woran man es erkennt
5. Wie man es anwendet
6. Durchgerechnetes Beispiel
7. Typischer Fehler
8. Prüfungstipp, wo sinnvoll
9. Verbindung zu verwandten Themen

Nicht mechanisch bei jedem Detail durchziehen — bei den tragenden Konzepten schon.

## Sprache

- **Deutsch (Schweiz).** **Niemals `ß`, immer `ss`** (Strasse, dass, muss, grösser).
- Umlaute ä ö ü Ä Ö Ü normal. Kein `ae`/`oe`/`ue`, ausser in Dateinamen, IDs und URLs.
- Klar, präzise, schülerfreundlich, fachlich korrekt, prüfungsorientiert, scanbar.
- Nicht kindlich, nicht unnötig akademisch. Komplexes einfach erklären, ohne
  fachlich falsch zu werden.
- Fremdsprachliche Lerninhalte bleiben in ihrer Sprache (englischer Beispielsatz
  bleibt englisch), die Erklärung drumherum ist deutsch.

## Sektionen

Anzupassen an Fach und Prüfung — nur verwenden, was Sinn ergibt:

- **Header/Hero** — Fach, Thema, Schule, Prüfungsdatum, kurze Beschreibung, Umfang
- **Schnellüberblick** — visuelle Übersicht aller Prüfungsthemen
- **Lernziel-Abdeckung** — welche Bereiche abgedeckt sind (ohne private Dateipfade)
- **Prüfungsfokus** — unbedingt können / verstehen / auswendig / nachschlagen / häufige Fehler
- **Theorieteil** — vollständig, logisch gegliedert
- **Durchgerechnete Beispiele** — nicht nur triviale
- **Typische Fehler und Fallen**
- **Merkhilfen** — nur wo echt hilfreich; keine albernen Eselsbrücken, die das
  Verständnis verschlechtern
- **Übungen** (Pflicht) → `exercises.md`
- **Lösungen** (Pflicht) → `exercises.md`
- **Quiz** — wo sinnvoll, leichtgewichtig
- **Prüfungssimulation** → `exercises.md`
- **Last-Minute-Repetition** — kompakte Schlusscheckliste: Konzepte ohne Hilfe,
  Formeln auswendig, Abgrenzungen, Verfahren, Fallen. Ersetzt die Zusammenfassung nicht.

## Fachspezifische Anpassung

Nicht für jedes Fach dieselbe Didaktik. Das Skill muss für Mathe, Deutsch,
Englisch, Französisch, Wirtschaft & Recht, Geschichte & Politik, Physik, Chemie,
BBW-IT-Module und künftige Fächer funktionieren.

**Mathematik** — Formeln, Bedeutung jeder Variable, Bedingungen, Schritt-für-Schritt-
Verfahren, vollständig gerechnete Beispiele, typische Fallen, Taschenrechner-Hinweise,
Aufgaben von leicht → mittel → schwer → Prüfungsniveau, Transferaufgaben,
vollständige Rechenwege in den Lösungen.

**Physik / Chemie** — Konzepte, Einheiten, Formeln, Umrechnungen, Annahmen,
Diagramme wo HTML/CSS das sauber kann, gerechnete Beispiele, Interpretationsfragen,
Experiment- und Kontextfragen.

**Wirtschaft & Recht** — Definitionen, Abgrenzungen, juristische Logik, Artikel
(nur wenn im Kursmaterial vorhanden — **nie erfinden**), Entscheidungswege,
realistische Fälle, Fallbearbeitungsstrategie, Fallen, kurze und komplexe
Fallstudien mit vollständig begründeten Musterlösungen.

**Geschichte & Politik** — Chronologie, Ursachen, Ereignisse, Folgen, Akteure,
Begriffe, Zusammenhänge, Vergleiche, Quelleninterpretation, Bedeutung,
Argumentationsaufgaben, Transferfragen.

**Sprachen** — an die Prüfungsform anpassen: Grammatik, Regeln, Ausnahmen,
Wortschatz, Umformungen, Beispiele, typische Fehler, Schreibstrukturen,
Lesestrategien, prüfungsnahe Aufgaben, Musterantworten.

**Informatik / BBW-Module** — Theorie, Terminologie, Architektur, Befehle, Syntax,
Code, Konfiguration, Workflows, Troubleshooting, praktische Aufgaben,
„was intern passiert", Vergleiche, typische Fehler, realistische
Implementationsszenarien, prüfungsnahe Praxisaufgaben.

## HTML, Interaktivität, Zugänglichkeit

Technische Konventionen und Repo-Vorgaben stehen in `studyhub-integration.md`.
Inhaltlich gilt:

- semantische Überschriftenhierarchie, lesbare Typografie, ausreichender Kontrast
- responsive Tabellen, mobiltaugliches Layout, kein horizontales Überlaufen
- interaktive Elemente per Tastatur bedienbar, sinnvolle Labels
- lange Seiten brauchen eine brauchbare Navigation (Sprungmarken, Sticky-Nav)
- progressive Offenlegung, damit die Länge beherrschbar bleibt
- korrekt escaptes HTML, keine kaputten Anker

## Qualitätsvergleich vor dem Abschluss

Mit den stärksten bestehenden Seiten des Repos vergleichen (z. B.
`summaries/bmsw/mathe/trigonometrische_gleichungen.html`,
`summaries/bbw/m347/modul347_pruefungsvorbereitung.html`,
`summaries/bmsw/wirtschaft-recht/kap_21&22.html`).

Prüfen: Informationsmenge, Erklärqualität, Prüfungsbezug, Übungs- und
Lösungsqualität, Struktur, visuelle Stimmigkeit, Navigation, Mobilnutzung,
Interaktivität. Die neue Seite darf den Standard nicht unterschreiten.

## Faktentreue

Genauigkeit schlägt Selbstsicherheit. Niemals erfinden: Gesetze, Formeln,
historische Daten, Anforderungen der Lehrperson, Prüfungsregeln, Quellenangaben,
Befehle, Syntax, Definitionen, Buchinhalte, Bewertungskriterien.

Bei widersprüchlichem Material: nachgehen. Bleibt es unklar: fragen.
