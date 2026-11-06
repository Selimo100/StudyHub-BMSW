# Konfiguration

Diese Datei nach `config.md` kopieren und die Werte anpassen:

```bash
cp config.example.md config.md
```

`config.md` ist deine persönliche Konfiguration und wird nicht ins Repo eingecheckt.

## StudyHub-Repository

Der Pfad zu **deinem** lokalen Klon dieses Repositories. Die erste alleinstehende
Pfadzeile in dieser Datei wird von den Skripten automatisch als Repo-Pfad gelesen —
also genau hier eintragen:

```
/Users/DEIN-NAME/dev/school/StudyHub
```

Alternativ per Umgebungsvariable, die Vorrang hat:

```bash
export STUDYHUB_REPO="$HOME/dev/school/StudyHub"
```

Branch: `main` · Deployment: Netlify, automatisch bei Push auf `main`

## Zugriff

Damit das Skill aus einem beliebigen Fachordner heraus auf das Repo zugreifen kann,
muss der Repo-Pfad in `~/.claude/settings.json` eingetragen sein:

```json
{
  "permissions": {
    "additionalDirectories": [
      "/Users/DEIN-NAME/dev/school/StudyHub"
    ]
  }
}
```

Ohne diesen Eintrag funktioniert es auch, dann aber mit explizitem Flag:

```bash
claude --add-dir /Users/DEIN-NAME/dev/school/StudyHub
```

oder in laufender Session:

```
/add-dir /Users/DEIN-NAME/dev/school/StudyHub
```

## Git-Verhalten

Einen Modus wählen und die anderen löschen oder auskommentieren.

**Modus B — generieren + integrieren + validieren + committen. Kein Push.** ← Standard

- Modus A: nur generieren, integrieren, validieren. Kein Commit.
- Modus B: zusätzlich committen, aber **nicht** pushen. Du pushst selbst.
- Modus C: zusätzlich pushen. Löst direkt das Netlify-Deployment aus.

Unabhängig vom Modus gilt immer:

- Nur die selbst erstellten/geänderten Dateien gezielt stagen (`git add <pfad>`),
  niemals `git add -A` oder `git add .`.
- Commit-Message knapp und beschreibend, z. B.
  `Add Arbeitsvertrag exam summary` / `Update Trigonometrie summary`.
- Verboten: `git reset --hard`, `git clean -fd`, `--force`, Verwerfen fremder
  Änderungen, Reverts an nicht selbst geänderten Dateien.

## Design

Alle neuen Seiten nutzen das gemeinsame helle StudyHub-Design-System
(`references/design-system.md`). Die gebaute Seite bleibt eine eigenständige
HTML-Datei ohne Abhängigkeiten. Fachfarben stehen zentral in `assets/subjects.json` –
dort, nicht hier, wird ein neues Fach ergänzt.

Voraussetzung: Node.js ≥ 22 (Builder, Tests, Rendering-Check) und für den
Rendering-Check ein Chromium-Browser (Chrome, Edge, Chromium, Brave) oder Safari
im `--serve`-Modus.
