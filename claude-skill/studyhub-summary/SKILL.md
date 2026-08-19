---
name: studyhub-summary
description: Erstellt aus dem Schulmaterial im aktuellen Ordner eine umfassende deutsche HTML-Prüfungszusammenfassung mit Übungen und Lösungen und integriert sie vollständig ins StudyHub-Repository. Nur auf ausdrückliche Anfrage ausführen (/studyhub-summary) — der Workflow schreibt Dateien und committet.
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
| `references/source-analysis.md` | Phase 2 — Material sichten und Prüfungsmodell bauen |
| `references/summary-quality.md` | Phase 4 — Inhalt und Sprache der Seite |
| `references/exercises.md` | Phase 4 — Übungen und Lösungen |
| `references/studyhub-integration.md` | Phase 1, 5, 6 — Repo-Struktur, Einbindung, Validierung |

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
   Template ist gültig). Jedes Lernziel bekommt eine interne ID L1, L2, …
2. Quellmaterial rekursiv sichten → `references/source-analysis.md`.
3. Fach, Schule (BMSW / BMSW-Abschlussprüfung / BBW), Modul, Thema, Prüfungsdatum
   bestimmen. Belege aus Dateien, nicht raten.
4. Ziel im Repo bestimmen und prüfen, ob eine passende Zusammenfassung schon
   existiert → `references/studyhub-integration.md`.
5. **Coverage-Map** aufbauen: pro Lernziel Quelle → Konzepte → Beispiele → Übungen.
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

Gliederung festlegen, fachspezifisch angepasst (`references/summary-quality.md`).
Jedes Lernziel muss auf Theorie **und** mindestens eine Übung abgebildet sein.

## Phase 4 — Seite schreiben

- Sprache: **Deutsch (Schweiz)**. **Niemals `ß`, immer `ss`.** Umlaute ä ö ü Ä Ö Ü
  normal verwenden — nur in Dateinamen/IDs/URLs ASCII.
- Fremdsprachliche Lerninhalte bleiben in ihrer Sprache, Erklärungen drumherum deutsch.
- Umfang: lehrbuchtief, nicht Spickzettel. Wissen verdichten, nicht weglassen.
- Übungen und Lösungen sind Pflicht → `references/exercises.md`.
- HTML: eigenständige Datei, eigenes CSS, keine Frameworks, keine neuen
  Abhängigkeiten. Konventionen aus `references/studyhub-integration.md`.
- Keine absoluten lokalen Pfade, keine OneDrive-Pfade, keine privaten Dateinamen,
  keine Platzhalter, keine TODOs auf der Seite.

## Phase 5 — Coverage-Gate

Vor dem Abschluss jedes Lernziel prüfen:

```
L3  Theorie ✓  Beispiel ✓  Übung ✓  Lösung ✓  → PASS
```

Alles muss PASS sein. Bei FAIL: nachbessern, nicht beschönigen. Niemals
„alles abgedeckt" schreiben, ohne diese Tabelle tatsächlich durchgegangen zu sein.

## Phase 6 — Integration und Validierung

1. Datei an den richtigen Ort schreiben.
2. `index.html`: Link in die passende `.link-list` eintragen (Reihenfolge und
   Format der bestehenden Einträge übernehmen). Neues Fach ⇒ Karte + `pdfs/<slug>/.gitkeep`.
3. Validieren:
   ```bash
   bash ~/.claude/skills/studyhub-summary/scripts/validate.sh "<relativer Pfad zur neuen Seite>"
   ```
4. Nur eigene Fehler beheben. Fremde Baustellen im Repo nicht anfassen.

## Phase 7 — Git

Verhalten laut `config.md`. Nie `reset --hard`, nie `clean -fd`, nie force-push,
nie fremde Änderungen stagen. Nur die eigenen Dateien gezielt hinzufügen.

## Phase 8 — Abschlussbericht

Knapp, kein Log:

```
Erstellt/Aktualisiert: <Titel>
StudyHub:              <Pfad>
Abgedeckte Lernziele:  N/N
Übungen:               N (Level 1–5)
Prüfungssimulation:    ja/nein
Integration:           <was geändert wurde>
Validierung:           <Checks + Ergebnis>
Git:                   <Status / Commit>
Route:                 https://studyhub-bmsw.netlify.app/<pfad>
```
