# Quellenanalyse

Ziel: **nicht** von Dateien direkt zu HTML springen. Erst das Material verstehen,
dann ein Prüfungsmodell bauen, dann schreiben.

## 1. Inventar

`scripts/preflight.sh` liefert eine Dateiliste des aktuellen Ordners. Ignoriert
werden bereits: `.git`, `node_modules`, `dist`, `build`, `target`, `.venv`,
`__pycache__`, `.next`, Caches, Lockfiles, `.DS_Store`, `*.macos-backup`.

Bei vielen Dateien: erst Inventar bilden, dann priorisieren — nicht blind alles lesen.

## 2. Priorisierung

Zuerst lesen:
- Dateien mit Prüfungsbezug im Namen (`pruefung`, `exam`, `test`, `probe`, `kt`,
  `lernziel`, `loesung`, `solution`, `spick`, `zusammenfassung`)
- Handouts und Präsentationen der Lehrperson
- Übungsblätter mit Lösungen
- eigene Notizen

Dann der Rest, soweit für die Lernziele relevant.

## 3. Was tatsächlich gelesen wird

Nicht nur Dateinamen. Inhalte öffnen:

- Markdown, Text, HTML, Quellcode, Konfigurationen, Datendateien → direkt lesen
- PDF → mit dem Read-Tool über `pages` lesen (max. 20 Seiten pro Aufruf); bei
  langen PDFs die relevanten Bereiche gezielt durchgehen
- Bilder/Screenshots → Read-Tool zeigt sie visuell; nur verwenden, wenn wirklich lesbar
- `.docx`, `.pptx`, `.xlsx` sind ZIP-Container. Wenn kein Konverter da ist:
  `unzip -p datei.docx word/document.xml` bzw. `ppt/slides/slide*.xml` und
  Text extrahieren. Gelingt das nicht, die Datei als nicht lesbar melden statt
  ihren Inhalt zu erfinden.
- OneNote-Exporte meist als PDF oder HTML vorhanden → wie oben

Nicht lesbares Material **benennen**, nicht überspringen und verschweigen.

## 4. Quellenpriorität bei Widersprüchen

1. Lernziele
2. offizielles Material der Lehrperson / Schule
3. Prüfungsanweisungen und alte Prüfungen
4. Handouts / Präsentationen
5. Übungen und offizielle Lösungen
6. eigene Notizen
7. Lehrmittel im Ordner
8. bestehende StudyHub-Zusammenfassungen
9. allgemeines Modellwissen

Internetrecherche ist **nicht** Standard. Wenn externes Wissen eine wichtige Lücke
schliessen würde: sagen, was fehlt, und fragen. Kursanforderungen nie erfinden.

Wenn das Kursmaterial bewusst vereinfacht: das Kursniveau bedienen, aber nichts
sachlich Falsches schreiben. Wo die Vereinfachung an eine Grenze stösst, kurz
als Randnotiz kennzeichnen.

## 5. Prüfungsmodell

Intern aufbauen (nicht als Gedankenprotokoll ausgeben):

- Fach · Schule (BMSW / BMSW-Abschluss / BBW) · Modul · Thema · Prüfungsdatum
- Lernziele mit IDs L1…Ln
- benötigte Konzepte, Verfahren, Formeln, Definitionen, Vokabular
- wichtige Abgrenzungen und Verwechslungsgefahren
- Terminologie der Lehrperson (deren Begriffe verwenden, nicht Synonyme erfinden)
- wahrscheinliche Aufgabentypen der Prüfung
- wiederkehrende Fehler, sichtbar in korrigierten Arbeiten und Lösungen
- Ausnahmen und Randfälle
- auswendig / verstehen / nachschlagbar
- geforderte praktische Fertigkeiten
- vorhandene Beispiele und Aufgaben samt Schwierigkeitsgrad

## 6. Coverage-Map

Pro Lernziel:

```
L2  „Arbeitsvertrag von Auftrag abgrenzen"
    Quellen:   handout_kap12.pdf S. 3–7, uebung_4.docx
    Konzepte:  Subordination, Weisungsgebundenheit, OR 319 vs. OR 394
    Beispiele: 2 Fallbeispiele
    Übungen:   Level 2 ×1, Level 3 ×1, Level 5 ×1
    Status:    offen
```

Lernziele ohne tragfähige Quellenbasis **vor** dem Schreiben melden:
konkret benennen, was fehlt, und um Material oder Klärung bitten. Niemals still
weglassen und niemals mit erfundenem Inhalt auffüllen.
