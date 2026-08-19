# StudyHub-Integration

Repo-Pfad und Git-Verhalten stehen in `config.md`.

„Zusammenfassung erstellen" heisst: **die gesamte Integrationsarbeit**, damit die
Seite auf StudyHub nutzbar ist — nicht nur eine HTML-Datei irgendwo ablegen.

> Struktur bei **jedem** Lauf frisch prüfen. Die Angaben hier beschreiben den Stand
> vom 2026-08-18. Wenn das Repo abweicht, gilt das Repo.

## Architektur (Stand 2026-08-18)

- Kein Build, kein Framework, keine Abhängigkeiten. Reines HTML/CSS/JS.
- `index.html` — Startseite mit Fächerübersicht, Live-Suche und PDF-Hub.
- `summaries/` — eigenständige HTML-Seiten.
- `pdfs/` + `pdfs/manifest.json` — **automatisch** generiert, nie von Hand pflegen.
- `generate-manifest.js` — Node ohne Deps, baut das Manifest.
- `.github/workflows/generate-pdf-manifest.yml` — läuft bei Push auf `pdfs/**`.
- Netlify deployt `main` automatisch.

## Ablageorte

```
summaries/bmsw/<fach-slug>/<name>.html     BMSW-Fächer und Abschlussprüfungen
summaries/bbw/<modul>/<name>.html          BBW-Module, z. B. bbw/m165
```

Vorhandene Slugs: `wirtschaft-recht`, `geschichte-politik`, `englisch`, `deutsch`,
`mathe`, `physik`, `chemie`, `french`, `GLF`, `SPF`, `english-books`,
`bbw/m165`, `bbw/m347`.

Achtung: Abschlussprüfungs-Fächer (GLF, SPF, english-books, Französisch mündlich)
liegen im Dateisystem ebenfalls unter `summaries/bmsw/…`; getrennt sind sie nur
in `index.html` durch einen eigenen `.school-block`.

## Einordnung

- **BMSW** — Berufsmaturitätsschule, reguläre Fächer → erster `.school-block`
- **BMSW · Abschlussprüfungen** → zweiter `.school-block` (`.school-name` =
  „Abschlussprüfungen")
- **BBW** — Berufsschule, Module `mXXX` → dritter `.school-block`

Lässt sich die Zuordnung nicht sicher aus Material und Lernzielen ableiten: fragen.

## Dateinamen

Kleinbuchstaben, `snake_case`, deskriptiv, ASCII (Umlaute umschreiben: `pruefung`,
`loesung`, `groesse`), Endung `.html`.

Gut: `trigonometrische_gleichungen.html`, `arbeitsvertrag.html`,
`zitieren_referenzieren_bibliografieren_pruefung.html`, `redis_backup_replikation.html`

Verboten: `summary.html`, `test.html`, `new.html`, `exam.html`, `zusammenfassung2.html`

Im Repo existieren Altlasten (`test3.html`, `exam_2.html`) — diese nicht als
Vorbild nehmen.

## Duplikate und Updates

Vor dem Schreiben den Zielordner prüfen. Bei einem thematisch ähnlichen
vorhandenen Namen: die Datei **erst lesen**, dann entscheiden.

Ist es dieselbe Prüfung → **Update**:
1. bestehende Seite vollständig lesen
2. mit den aktuellen Lernzielen abgleichen
3. mit dem aktuellen Quellmaterial abgleichen
4. veraltete und fehlende Abschnitte identifizieren
5. gute vorhandene Inhalte **erhalten**
6. gezielt verbessern statt blind neu generieren
7. Übungen nachziehen, wo nötig
8. alle Lernziele erneut prüfen

Gute bestehende Inhalte werden nicht zerstört, nur weil das Skill nochmals lief.
Nie eine bestehende Zusammenfassung überschreiben, bloss weil die Namen ähnlich
sind. Bei Unklarheit fragen: Update oder separate neue Seite?

## HTML-Konventionen der Seiten

Die bestehenden Seiten sind **vollständig eigenständig**: eigenes `<style>` im
`<head>`, eigene Farbpalette, eigenes JS inline. Es gibt bewusst kein gemeinsames
Stylesheet und kein Template.

- `<!doctype html>`, `<html lang="de">` (Sprachseiten dürfen abweichen)
- `<meta charset="UTF-8">` und `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `<title>` im Repo-Stil: `Thema – Kontext · Prüfungsvorbereitung`
- Theming über CSS Custom Properties in `:root`, Skalierung mit `clamp()`
- Google Fonts per `<link>` ist im Repo etabliert und erlaubt; sonst **keine**
  externen Abhängigkeiten, kein CDN-Framework, kein Build-Schritt
- Sticky-Nav mit Sprungmarken bei langen Seiten (Muster vorhanden)
- Inline-JS in einer IIFE, vanilla, ohne Bibliotheken
- Assets liegen im Repo-Root (`logo-bmsw.png`, `logo-bbw.svg`, `favicon.svg`) —
  von einer Seite aus relativ als `../../../<datei>` erreichbar

## Registrierung in index.html (manuell, Pflicht)

Die Live-Suche liest ihre Einträge beim Laden aus dem DOM. Ein Eintrag in der
Fächerkarte genügt — es gibt **keinen** separaten Suchindex und keine
Routing-Konfiguration.

Neuen Link in die `.link-list` der passenden `.subject-card` einfügen, Format der
Nachbarn übernehmen:

```html
<li><a href="./summaries/bmsw/mathe/trigonometrische_gleichungen.html" target="_blank" rel="noopener">Trigonometrische Gleichungen</a></li>
```

- `&` im Pfad als `&amp;` escapen
- Linktext ist ein sprechender Titel, kein Dateiname
- Einordnung sinnvoll (thematisch oder chronologisch wie die Nachbarn)

### Neues Fach / neues Modul

Nur nötig, wenn keine passende Karte existiert:

1. `<article class="subject-card">` im richtigen `.school-block` ergänzen —
   Markup einer bestehenden Karte 1:1 übernehmen, inkl. PDF-Button und SVG
2. `data-pdf-subject="<slug>"` setzen; der Slug muss **exakt** dem Ordnernamen
   unter `pdfs/` entsprechen (verschachtelt möglich: `bbw/m165`)
3. `pdfs/<slug>/.gitkeep` anlegen
4. `summaries/<schule>/<slug>/` anlegen

`pdfs/manifest.json` **nicht** von Hand bearbeiten. Nur wenn tatsächlich PDFs
dazukommen: `node generate-manifest.js`.

## Was sonst nicht angefasst wird

Nur ändern, was wirklich geändert werden muss: die neue Seite, `index.html`,
bei neuem Fach die beiden Ordner. Nicht anfassen: fremde Zusammenfassungen,
Logos, Workflow, README (ausser du legst ein neues Fach an, das dort in der
Fächertabelle fehlt), `.vscode/`, `.claude/`.

Bekannte Altlast: der Abschnitt „Projektstruktur" in `README.md` zeigt noch das
alte Layout ohne `summaries/bmsw/`. Nicht ungefragt im Rahmen eines
Zusammenfassungs-Laufs mitreparieren.

## Privatsphäre der öffentlichen Seite

Die Seite geht auf eine öffentliche Website. Nicht ins HTML gelangen dürfen:
absolute Mac-Pfade, OneDrive-Pfade, Benutzernamen, Claude-Konfiguration, interne
Git-Informationen, private Notizen ohne Lernbezug, Dateinamen, die nicht
öffentlich sein sollen, Tokens oder Zugangsdaten.

Quelldateien dienen dem Lernen — nicht als Herkunftsnachweis auf der Seite.
Die Lernziel-Abdeckung wird thematisch dargestellt, nicht über Dateipfade.

## Validierung

```bash
bash ~/.claude/skills/studyhub-summary/scripts/validate.sh "summaries/bmsw/<fach>/<name>.html"
```

Geprüft werden: Existenz, `ß`, Doctype/Charset/Viewport/Title/`lang`,
Tag-Balance, doppelte IDs, tote interne Anker, `href="#"`-Platzhalter,
Platzhalter/TODO-Reste, geleakte lokale Pfade, Übungen/Lösungen vorhanden,
Verlinkung in `index.html`, Ziel-Datei existiert für jeden Summary-Link im Index,
optional `node --check` für das Inline-JS.

Das Repo hat kein `package.json`, keine Tests, keinen Linter und keinen Build —
also keine Befehle erfinden. Zusätzlich sinnvoll:

```bash
node generate-manifest.js          # nur wenn PDFs dazukamen
python3 -m http.server 8000        # lokale Vorschau
```

Optionaler visueller Check (Chrome ist auf dem Gerät vorhanden):

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless --disable-gpu \
  --hide-scrollbars --window-size=390,1200 --virtual-time-budget=2000 \
  --screenshot=/tmp/studyhub-mobile.png "file://<absoluter Pfad zur Seite>"
```

Nach der Validierung zusätzlich manuell prüfen: Ziel und Dateiname korrekt,
Indexlink vorhanden und funktionierend, Anker springen richtig, JS ohne
offensichtliche Fehler, Mobil-Layout plausibel, Übungen und Lösungen vollständig,
Quiz funktioniert (falls vorhanden), alle Lernziele abgedeckt, keine
Platzhalter-Reste, keine kaputte StudyHub-Navigation.

## Git

Verhalten laut `config.md` (aktuell: committen, nicht pushen).

Vor Änderungen `git status` prüfen und **verstehen**. Fremde unversionierte oder
geänderte Dateien bleiben unangetastet und werden nicht mitgestaged — deshalb
gezielt `git add <pfad>` statt `git add -A`.

Verboten: `git reset --hard`, `git clean -fd`, force-push, Verwerfen fremder
Änderungen, Reverts an nicht selbst geänderten Dateien.

Ist das Repo in einem Zustand, in dem sicheres Arbeiten nicht möglich ist
(laufender Merge/Rebase, Detached HEAD, Konflikte): Lage erklären und fragen.
