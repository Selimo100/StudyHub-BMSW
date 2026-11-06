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

## Lernsequenz für schwierige Konzepte

1. **Intuition / mentales Modell** – warum passiert das überhaupt?
2. **Exaktes Gesetz und Annahmen** – wann gilt es, wann **nicht**?
3. **Beschriftete Visualisierung** (`diagrams.md`)
4. **Symbolische Herleitung** – so weit, wie die Prüfung sie verlangt
5. **Vollständig gerechnetes Beispiel** (Rechenweg in 8 Schritten, `exercises.md`)
6. **Geführte Aufgabe** (Level 1, mit Tipps)
7. **Selbständige Anwendung** (Level 2)
8. **Schwierigere Transferaufgabe** (Level 3)

Dazu: typische Fehlvorstellung und **woran man in der Aufgabenstellung den richtigen
Ansatz erkennt** (Signalwörter wie «schwimmt», «vollständig eingetaucht», «hängt an»).

Einfache Nachschlagefakten knapp halten – nicht jedes Detail durch alle acht Schritte
ziehen. Jedes Kapitel ist sinnvoll, aber nicht aufgebläht.

## Sprache

- **Deutsch (Schweiz).** **Niemals `ß`, immer `ss`** (Strasse, dass, muss, grösser).
- Umlaute ä ö ü Ä Ö Ü normal. Kein `ae`/`oe`/`ue`, ausser in Dateinamen, IDs und URLs.
- Klar, präzise, schülerfreundlich, fachlich korrekt, prüfungsorientiert, scanbar.
- Nicht kindlich, nicht unnötig akademisch. Komplexes einfach erklären, ohne
  fachlich falsch zu werden.
- Fremdsprachliche Lerninhalte bleiben in ihrer Sprache (englischer Beispielsatz
  bleibt englisch), die Erklärung drumherum ist deutsch.
- Schweizer Hochdeutsch, kein Dialekt. Skill-Anweisungen und Code dürfen Englisch sein.

## Notation der Schule

Formelzeichen, Indizes, Vorzeichen- und Einheitenkonventionen der Lehrperson bzw.
der Formelsammlung übernehmen (z. B. `ρ_Fl` Flüssigkeit, `ρ_K` Körper). Weicht das
Material in sich ab oder gibt es mehrere übliche Schreibweisen: einmal explizit
gegenüberstellen und im Glossar vermerken. Symbolkollisionen (z. B. `W` Arbeit vs.
`W` Watt) immer auflösen.

## Herkunft und Zusatzwissen

- Inhalte aus dem Material dezent belegen: `<span class="sh-source">Skript S. 12</span>`,
  `Arbeitsblatt 3, Nr. 4` – Dokumenttitel, Seite oder Aufgabennummer, **nie**
  Dateinamen oder Pfade (öffentliche Seite). Nicht jeden Satz belegen.
- Keine längeren Passagen oder Abbildungen wörtlich übernehmen – paraphrasieren und
  Diagramme neu zeichnen.
- Wichtiges Zusatzwissen, das nicht im Material steht, als
  `.sh-extra` («Zusatzerklärung – nicht aus dem Skript») kennzeichnen.
- Unklares oder widersprüchliches Material offen benennen statt still zu glätten.

## Sektionen

Anzupassen an Fach und Prüfung — nur verwenden, was Sinn ergibt:

- **Kopfbereich** — kommt aus `sh-meta`: Fach, Thema, Schule, Prüfungsinfo, Lead,
  Umfang-Tags. Kein Marketing («Offline nutzbar» o. ä.).
- **Schnellüberblick** — visuelle Übersicht aller Prüfungsthemen
- **Original-Lernziele** — wörtlich, eingeklappt in der Sidebar (aus `objectives`),
  nicht als grosse Liste im Artikel; Abdeckung über `data-objective`
- **Prüfungsfokus** — unbedingt können / verstehen / auswendig / nachschlagen / häufige Fehler
- **Theorieteil** — vollständig, logisch gegliedert
- **Durchgerechnete Beispiele** — nicht nur triviale
- **Typische Fehler und Fallen**
- **Merkhilfen** — nur wo echt hilfreich; keine albernen Eselsbrücken, die das
  Verständnis verschlechtern
- **Übungen** (Pflicht) → `exercises.md`
- **Lösungen** (Pflicht) → `exercises.md`
- **Quiz** — Konzeptfragen zu echten Fehlvorstellungen, mit Begründung je Option
- **Formelzeichen-/Begriffslegende** — `sh-glossary`, überall wo Symbole oder Fachbegriffe vorkommen
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

Layout, Navigation (Sidebar/Drawer), Theme, Antwortprüfung und Legende liefert das
Design-System → `design-system.md`. Inhaltlich gilt:

- eine `h1` (aus Meta), pro Kapitel `h2`, darunter `h3` – keine Sprünge
- Tabellen mit `caption` und `th scope`, Diagramme mit `title`/`desc` und Caption
- progressive Offenlegung: Lösungen und Tipps eingeklappt, Theorie offen
- Simulationen nur, wenn sie einen schwierigen Zusammenhang wirklich verständlicher
  machen; sonst weglassen. Keine Fake-Interaktivität.

## Qualitätsvergleich vor dem Abschluss

Mit den stärksten bestehenden Seiten des Repos vergleichen (z. B.
`summaries/bmsw/mathe/trigonometrische_gleichungen.html`,
`summaries/bbw/m347/modul347_pruefungsvorbereitung.html`,
`summaries/bmsw/wirtschaft-recht/kap_21&22.html`).

Prüfen: Informationsmenge, Erklärqualität, Prüfungsbezug, Übungs- und
Lösungsqualität, Struktur, Navigation, Mobilnutzung, Interaktivität. Die neue Seite
darf den Standard nicht unterschreiten. Visuell ist der Massstab das Design-System
(Referenz: `assets/example/auftrieb.content.html`), nicht das Aussehen älterer Seiten.

## Faktentreue

Genauigkeit schlägt Selbstsicherheit. Niemals erfinden: Gesetze, Formeln,
historische Daten, Anforderungen der Lehrperson, Prüfungsregeln, Quellenangaben,
Befehle, Syntax, Definitionen, Buchinhalte, Bewertungskriterien.

Bei widersprüchlichem Material: nachgehen. Bleibt es unklar: fragen.
