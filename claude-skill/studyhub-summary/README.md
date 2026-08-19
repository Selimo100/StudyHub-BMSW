# studyhub-summary

Ein Claude-Code-Skill, das aus dem Material eines Fachordners eine umfassende
deutsche Prüfungszusammenfassung als HTML-Seite baut und vollständig in StudyHub
integriert — inklusive Übungen, Lösungen, Prüfungssimulation und Index-Eintrag.

## Installation

```bash
# 1. Repo klonen (falls noch nicht geschehen)
git clone git@github.com:Selimo100/StudyHub-BMSW.git ~/dev/school/StudyHub

# 2. Skill ins persönliche Claude-Verzeichnis kopieren
mkdir -p ~/.claude/skills
cp -R ~/dev/school/StudyHub/claude-skill/studyhub-summary ~/.claude/skills/

# 3. Konfiguration anlegen
cd ~/.claude/skills/studyhub-summary
cp config.example.md config.md

# 4. In config.md den Pfad zu deinem lokalen Repo eintragen
```

Danach in `~/.claude/settings.json` den Repo-Pfad unter
`permissions.additionalDirectories` ergänzen, damit das Skill aus jedem Fachordner
heraus auf das Repo zugreifen kann. Details in `config.example.md`.

Prüfen, ob das Skill erkannt wird: `claude` starten und `/` tippen —
`/studyhub-summary` muss in der Liste erscheinen.

## Aufbau

```
studyhub-summary/
├── SKILL.md                 Workflow in 8 Phasen — das Herzstück
├── config.example.md        Vorlage für die persönliche config.md
├── LERNZIELE.md             Fallback-Datei für die Lernziele
├── LERNZIELE.template.md    Leervorlage (nicht bearbeiten)
├── README.md
├── references/
│   ├── source-analysis.md       Material sichten, Prüfungsmodell, Coverage-Map
│   ├── summary-quality.md       Inhalt, Sprache, fachspezifische Didaktik
│   ├── exercises.md             Übungen auf 5 Niveaus, Lösungen, Simulation
│   └── studyhub-integration.md  Repo-Konventionen, Einbindung, Validierung
└── scripts/
    ├── preflight.sh         Lernziele, Zugriff, Git-Zustand, Materialinventar
    └── validate.sh          HTML, Anker, Sprache, Lecks, Index-Verlinkung
```

`SKILL.md` bleibt bewusst kurz. Die langen Anweisungen stehen in `references/` und
werden nur bei Bedarf gelesen — das hält den Kontext schlank.

Die Skripte machen genau das, was ein Sprachmodell unzuverlässig macht und ein
Skript deterministisch: zählen, prüfen, vergleichen.

## Lernziele

Drei Quellen, die erste vorhandene gewinnt:

**1. Direkt beim Aufruf** (empfohlen, weil die Lernziele jedes Mal wechseln):

```
/studyhub-summary Lernziele:
- Arbeitsvertrag definieren und Merkmale nennen
- Arbeitsvertrag vom Auftrag abgrenzen
- Kündigungsfristen berechnen

Prüfung am 14.09., Hilfsmittel: OR
```

**2. Datei im Fachordner** — `lernziele.md` neben dem Material (bis 3 Ebenen tief).

**3. `LERNZIELE.md` im Skill-Verzeichnis** — der dauerhafte Fallback.

Kein Template nötig, eine rohe Liste reicht. Mehr Kontext (Fach, Datum,
Prüfungsform, Hilfsmittel, Hinweise der Lehrperson) = präziseres Ergebnis.
Niedrigere Quellen ergänzen die höhere, ersetzen sie aber nicht.

Die Lernziele sind die **Quelle der Wahrheit** für den Umfang. Jedes wird erklärt,
an einem Beispiel gezeigt, abgefragt und gelöst. Fehlt für ein Lernziel das
Material, meldet das Skill dies **vor** dem Schreiben.

## Nutzung

Im Ordner mit dem Prüfungsmaterial:

```bash
cd ~/Schule/Wirtschaft-Recht/Arbeitsvertrag
claude
```

dann `/studyhub-summary` mit oder ohne Lernziele.

## Ablauf

1. **Preflight** — Lernziele, Repo-Zugriff, Git-Zustand, Materialinventar.
2. **Analyse** — Material tatsächlich lesen (auch PDFs), Fach/Schule/Thema
   bestimmen, Ziel im Repo festlegen, Coverage-Map Lernziel → Quelle → Übung.
3. **Preflight-Bericht** — Übersicht des Erkannten. Rückfragen nur bei echten
   Blockern, nicht bei Ableitbarem.
4. **Schreiben** — eigenständige HTML-Seite: Theorie, durchgerechnete Beispiele,
   typische Fehler, Übungen auf 5 Schwierigkeitsstufen, vollständige Lösungen,
   Prüfungssimulation, Last-Minute-Checkliste. Deutsch (Schweiz), niemals `ß`.
5. **Coverage-Gate** — jedes Lernziel muss auf PASS stehen, sonst wird nachgebessert.
6. **Integration** — Datei nach `summaries/bmsw/<fach>/` bzw. `summaries/bbw/<modul>/`
   plus Eintrag in `index.html`. Die Live-Suche zieht neue Einträge automatisch.
7. **Validierung** — `scripts/validate.sh`.
8. **Commit** — knappe Message, nur die eigenen Dateien.

## Bestehende Zusammenfassungen

Existiert schon eine Seite zum Thema, wird sie gelesen und **verbessert**, nicht
blind ersetzt. Gute vorhandene Inhalte bleiben erhalten. Bei unklarer Lage
(Update oder neue Seite?) wird gefragt.

## Sicherheit

- Standardmässig wird **committet, aber nicht gepusht**.
- Nur die selbst erstellten Dateien werden gestaged (`git add <pfad>`), nie `git add -A`.
- Fremde uncommittete Änderungen bleiben unangetastet und werden im Preflight gemeldet.
- Niemals `git reset --hard`, `git clean -fd` oder force-push.
- Läuft ein Merge/Rebase oder ist HEAD detached, wird abgebrochen und gefragt.
- Auf die öffentliche Seite gelangen keine lokalen Pfade, Benutzernamen oder
  privaten Dateinamen — `validate.sh` prüft das.

## Anpassen

Alles Konfigurierbare steht in `config.md`. Die inhaltlichen Standards stehen in
`references/` — wer andere didaktische Vorgaben will, ändert dort, nicht in `SKILL.md`.
