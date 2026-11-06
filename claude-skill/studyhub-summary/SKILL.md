---
name: studyhub-summary
description: Erstellt aus dem Schulmaterial im aktuellen Ordner (Lernziele, Skripte, Übungsblätter, Lösungen, Formelsammlungen, Fotos) eine interaktive deutsche HTML-Lernseite im einheitlichen hellen StudyHub-Design (Sidebar, Fachfarbe, Formeln, Diagramme, Übungen mit Antwortprüfung, Quiz, Probeprüfung, Formelzeichen-Legende) und integriert sie vollständig ins StudyHub-Repository. Nur auf ausdrückliche Anfrage ausführen (/studyhub-summary) — der Workflow schreibt Dateien und committet.
argument-hint: "[Lernziele und/oder Kontext, z. B. \"Prüfung am 14.09.\" oder direkt die Lernziel-Liste]"
---

# StudyHub Summary

Baut aus dem Material im **aktuellen Arbeitsverzeichnis** eine vollständige
Prüfungszusammenfassung und integriert sie in **StudyHub**.

Denke gründlich. Dies ist ein langer, mehrstufiger Workflow mit Quellenanalyse,
didaktischem Design, Codegenerierung und Repo-Integration. Optimiere **nicht**
auf wenige Token — optimiere auf Prüfungsqualität.

## Konfiguration

Lies **immer zuerst** `config.md` in diesem Skill-Verzeichnis (Repo-Pfad, Git-Verhalten).

Skill-Verzeichnis: `~/.claude/skills/studyhub-summary/`

## Woher die Lernziele kommen

Drei Quellen, **absteigende Priorität** — die erste vorhandene gewinnt:

1. **Inline beim Aufruf** — die Lernziele stehen im Argument von
   `/studyhub-summary` oder wurden im Chat mitgeschickt. Erkennbar an einer
   Lernziel-Liste, an „Lernziele:", an Fach-/Themen-/Datumsangaben.
   Dann `scripts/preflight.sh --inline` aufrufen.
2. **Datei im Fachordner** — `lernziele.md` / `lernziele.txt` o. ä. im aktuellen
   Verzeichnis (bis 3 Ebenen tief). Preflight listet gefundene Dateien auf; lies sie.
3. **`LERNZIELE.md` im Skill-Verzeichnis** — der dauerhafte Fallback.

Niedrigere Quellen dürfen **ergänzen** (z. B. Prüfungsform, Hilfsmittel, Datum),
aber den Lernziel-Umfang der höheren Quelle nicht überschreiben. Wenn inline nur
Kontext ohne Lernziele kommt („Prüfung am 14.09."), gilt das als Ergänzung — die
Lernziele kommen dann aus Quelle 2 oder 3.

Widersprechen sich zwei Quellen inhaltlich deutlich (anderes Thema, anderes Fach):
nachfragen statt raten.

Egal welche Quelle: Die Lernziele sind der **Umfang** der Zusammenfassung. Jedes
bekommt eine ID L1…Ln und muss das Coverage-Gate in Phase 5 bestehen.

## Referenzen (bei Bedarf lesen, nicht alle auf Vorrat)

| Datei | Wann lesen |
|---|---|
| `references/source-analysis.md` | Phase 1 — Material sichten, Prüfungsmodell, Coverage-Matrix |
| `references/summary-quality.md` | Phase 3–4 — Lernsequenz, Sprache, Notation, Quellen |
| `references/design-system.md` | Phase 3–4 — **Pflicht**: Inhaltsdatei, Komponenten, Fachfarbe, Bauen |
| `references/diagrams.md` | Phase 4 — SVG-Diagramme, Kräftebilder, Simulationen |
| `references/exercises.md` | Phase 4 — Niveaus, Rechenweg, Tipps, Lösungen, Quiz, Probeprüfung |
| `references/studyhub-integration.md` | Phase 1, 6 — Repo-Struktur, Einbindung, Validierung, Rendering-Gate |

Vorlage für jede Seite: `assets/example/auftrieb.content.html` (vollständiges Beispiel
aller Bausteine). Das Aussehen kommt **immer** aus dem Design-System – nie eigenes
CSS, eigene Palette oder dunkles Layout.

---

## Phase 0 — Preflight (read-only)

```bash
bash ~/.claude/skills/studyhub-summary/scripts/preflight.sh
# Lernziele kamen inline im Aufruf/Chat mit:
bash ~/.claude/skills/studyhub-summary/scripts/preflight.sh --inline
```

Das Skript prüft Repo-Zugriff, Git-Zustand und erstellt ein Inventar des
aktuellen Ordners. Bei fehlendem Zugriff gibt es den exakten Befehl aus —
**diesen ausgeben und abbrechen**, nicht improvisieren.

Abbruchbedingungen (klar melden, dann stoppen):
- Keine Lernziele in **keiner** der drei Quellen → die drei Wege nennen und
  um die Lernziele bitten.
- Der aktuelle Ordner enthält kaum verwertbares Material → auflisten, was gefunden
  wurde, und fragen, ob der Ordner stimmt.
- Repo nicht erreichbar → Zugriffsbefehl ausgeben.
- Git-Zustand erlaubt kein sicheres Arbeiten (Merge/Rebase im Gang, Detached HEAD)
  → Lage erklären und fragen.

## Phase 1 — Analyse

1. Lernziele aus der höchstpriorisierten Quelle parsen (auch eine rohe Liste ohne
   Template ist gültig). **Wortlaut, Nummerierung, Reihenfolge und Überschrift exakt
   übernehmen** (→ `source-analysis.md` 1b) – sie erscheinen später unverändert im
   Sidebar-Block «Original-Lernziele». Unklarer Prüfungsumfang → «angrenzend».
2. Quellmaterial rekursiv sichten → `references/source-analysis.md`. PDFs nicht nur
   als Text: Seiten mit Diagrammen, Formeln, Tabellen und Annotationen ansehen.
3. Fach, Schule (BMSW / BMSW-Abschlussprüfung / BBW), Modul, Thema, Prüfungsdatum
   bestimmen. Belege aus Dateien, nicht raten.
4. Ziel im Repo bestimmen und prüfen, ob eine passende Zusammenfassung schon
   existiert → `references/studyhub-integration.md`.
5. **Coverage-Matrix** aufbauen: Lernziel → Erklärung → Herleitung → Beispiel →
   Übungen → Konzeptcheck, inkl. geforderter Tiefe und Prüfungsform.
6. Lücken erkennen: Lernziele ohne ausreichende Quellenbasis **jetzt** melden,
   nicht später mit Platzhaltern füllen.

## Phase 2 — Preflight-Bericht

Kurz, deutsch, dann weiter oder nachfragen:

```
Erkannt:
- Bereich: BMSW / BMSW Abschluss / BBW
- Fach/Modul: …
- Prüfung: …
- Prüfungsdatum: …
- Lernziele: N (Quelle: inline / Fachordner / Skill-Datei)
- relevante Quelldateien: N
- bestehende StudyHub-Zusammenfassung: ja (Pfad) / nein
- Ziel: summaries/<schule>/<slug>/<name>.html
- Offene Punkte: keine / …
```

Nur bei echten Blockern fragen. Was aus Dateien und Repo sicher ableitbar ist,
wird **nicht** gefragt. Bei „Update oder neue Seite?" mit unklarer Lage: fragen.

## Phase 3 — Aufbau planen

Gliederung festlegen, fachspezifisch angepasst (`references/summary-quality.md`):
Kapitel = `<section data-nav>` (Grundlagen · Lernziele · Training · Nachschlagen).
Pro schwierigem Lernziel die Lernsequenz (Intuition → Gesetz → Bild → Herleitung →
Beispiel → geführte, selbständige, Transfer-Aufgabe). Diagramme, Simulationen
(nur wenn sie Verständnis bringen), Glossar-Einträge und Probeprüfung planen.
Fach prüfen: `node scripts/build-guide.mjs --resolve "<Fach>"`.

## Phase 4 — Seite schreiben

- Sprache: **Deutsch (Schweiz)**. **Niemals `ß`, immer `ss`.** Umlaute ä ö ü Ä Ö Ü
  normal verwenden — nur in Dateinamen/IDs/URLs ASCII.
- Fremdsprachliche Lerninhalte bleiben in ihrer Sprache, Erklärungen drumherum deutsch.
- Umfang: lehrbuchtief, nicht Spickzettel. Wissen verdichten, nicht weglassen.
- Übungen und Lösungen sind Pflicht → `references/exercises.md`.
- **Inhaltsdatei** nach `references/design-system.md` schreiben (Arbeitskopie im
  Scratchpad, nicht im Repo), dann bauen:
  ```bash
  node ~/.claude/skills/studyhub-summary/scripts/build-guide.mjs <thema>.content.html \
       --out "<REPO>/summaries/<schule>/<slug>/<name>.html"
  ```
  Bestehende v2-Seite aktualisieren: Inhalt zwischen `sh:content`-Markern ändern und
  `build-guide.mjs <seite.html>` erneut ausführen.
- **Jede Zahl nachrechnen** (`node -e`/`python3 -c`), auch gegen Lösungsblätter –
  Abweichungen auf der Seite transparent vermerken.
- Keine absoluten lokalen Pfade, keine OneDrive-Pfade, keine privaten Dateinamen,
  keine Platzhalter, keine TODOs auf der Seite.

## Phase 5 — Coverage-Gate

Vor dem Abschluss jedes Lernziel prüfen:

```
L3  Theorie ✓  Bild ✓  Beispiel ✓  Übung L1–L3 ✓  Lösung ✓  Konzeptcheck ✓  Rechnungen geprüft ✓  → PASS
```

Zusätzlich für die **Original-Lernziele** (Abdeckungstabelle des Builders hilft):
jedes Lernziel des Dokuments angezeigt · Wortlaut und Nummerierung identisch mit
der Quelle (nochmals Zeichen für Zeichen vergleichen) · nichts weggelassen · jedes
bestätigte Lernziel mit Abschnitt + Übung · alle «Zum Kapitel»-Links gültig ·
Block eingeklappt. Fehlt Abdeckung: Inhalt ergänzen, nie den Lernziel-Text ändern.

Alles muss PASS sein. Bei FAIL: nachbessern, nicht beschönigen. Niemals
„alles abgedeckt" schreiben, ohne diese Tabelle tatsächlich durchgegangen zu sein.

## Phase 6 — Integration und Validierung

1. Datei an den richtigen Ort schreiben.
2. `index.html`: Link in die passende `.link-list` eintragen (Reihenfolge und
   Format der bestehenden Einträge übernehmen). Neues Fach ⇒ Karte + `pdfs/<slug>/.gitkeep`.
3. Statisch validieren:
   ```bash
   bash ~/.claude/skills/studyhub-summary/scripts/validate.sh "<relativer Pfad zur neuen Seite>"
   ```
4. **Rendering-Gate** (Pflicht) – 8 Viewports von 320 px bis 1440 px:
   ```bash
   node ~/.claude/skills/studyhub-summary/scripts/check-render.mjs "<absoluter Pfad>" --screenshots "<scratchpad>/shots"
   ```
   Screenshots (v. a. 320/390 px, Drawer offen) ansehen. Bei Admin-Policy-Sperre
   Fallback `--serve --open safari` (siehe `studyhub-integration.md`). Läuft keines:
   im Bericht offenlegen, was ungeprüft ist.
5. Nur eigene Fehler beheben. Fremde Baustellen im Repo nicht anfassen.

## Phase 7 — Git

Verhalten laut `config.md`. Nie `reset --hard`, nie `clean -fd`, nie force-push,
nie fremde Änderungen stagen. Nur die eigenen Dateien gezielt hinzufügen.

## Phase 8 — Abschlussbericht

Knapp, kein Log:

```
Erstellt/Aktualisiert: <Titel>
StudyHub:              <Pfad>
Abgedeckte Lernziele:  N/N (Original-Lernziele wörtlich in der Sidebar: ja/nein, angrenzend: N)
Fach / Farbe:          <Fach> (<key>, <accent>)
Übungen:               N (L1: a, L2: b, L3: c) · Quiz: N · Glossar: N Einträge
Prüfungssimulation:    ja/nein
Integration:           <was geändert wurde>
Validierung:           <validate.sh-Ergebnis>
Rendering:             <check-render: Modus, Browser, Fehler/Warnungen – oder „nicht geprüft, weil …“>
Git:                   <Status / Commit>
Route:                 https://studyhub-bmsw.netlify.app/<pfad>
```
