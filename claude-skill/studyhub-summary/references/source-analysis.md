# Quellenanalyse

Ziel: **nicht** von Dateien direkt zu HTML springen. Erst das Material verstehen,
dann ein Prüfungsmodell bauen, dann schreiben.

## 1. Inventar

`scripts/preflight.sh` liefert eine Dateiliste des aktuellen Ordners. Ignoriert
werden bereits: `.git`, `node_modules`, `dist`, `build`, `target`, `.venv`,
`__pycache__`, `.next`, Caches, Lockfiles, `.DS_Store`, `*.macos-backup`.

Bei vielen Dateien: erst Inventar bilden, dann priorisieren — nicht blind alles lesen.

## 1b. Original-Lernziele wörtlich übernehmen

- Lernziele **wörtlich** aus dem Lernziel-Dokument übernehmen: Nummerierung,
  Reihenfolge, Überschrift, Zeichensetzung, Symbole. Nichts glätten oder kürzen.
- Bei unsicherer Textextraktion (Formeln, Hochstellungen, Silbentrennung,
  Spalten) die PDF-Seite bzw. das Bild **visuell** prüfen und den Wortlaut daran
  abgleichen. Silbentrennungen am Zeilenende zusammenfügen, sonst nichts ändern.
- Markierungen der Lehrperson zum Prüfungsumfang (Unterstreichungen, «nicht
  prüfungsrelevant», Haken) beachten. Unklarer Umfang → `scope: "adjacent"` und im
  Preflight-Bericht nennen.
- Inline mitgegebene Lernziele gelten als offizielle Quelle (Wortlaut wie geliefert).
- Kein offizielles Dokument → keine Lernziele erfinden; Gliederung trotzdem aus dem
  Material, Block «Original-Lernziele» entfällt.

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
- Bilder/Screenshots/Fotos von Notizen → Read-Tool zeigt sie visuell; nur verwenden,
  wenn wirklich lesbar
- **PDF-Text allein reicht nicht.** Textextraktion verliert Abbildungen, Tabellen,
  Formeln und handschriftliche Annotationen. Seiten mit Diagrammen, Formeln oder
  Markierungen zusätzlich visuell ansehen (Read mit `pages` rendert die Seite) –
  dort stehen oft Kraftrichtungen, Masse, Prüfungshinweise der Lehrperson.
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

Zuerst die Prüfungsform klären: rechenlastig (→ Skizze, Kräftebild, Formelwahl,
symbolisches Umstellen, SI-Einheiten, Resultat deuten) oder argumentativ/sprachlich
(→ Begriffe, Zusammenhänge, Quellenarbeit, Schreibaufgaben).


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

## 6. Coverage-Matrix

Pro Lernziel (intern, nicht auf die Seite):

```
L2  „Haltekraft eines eingetauchten Körpers berechnen"     Tiefe: rechnen + begründen
    Quellen:     Skript S. 12–14, Arbeitsblatt 5 Nr. 2–4 (+ Lösungsblatt)
    Formeln:     F_A = ρ_Fl·V_verdr·g, F_H = F_G − F_A   Einheiten: N, kg/m³, m³
    Erklärung:   Intuition Druckdifferenz → Gesetz + Annahmen
    Herleitung:  ja (Druck oben/unten)
    Beispiel:    Stein am Seil (Rechenweg 8 Schritte)
    Diagramm:    Situation + Kräftebild
    Übungen:     L1 ×1, L2 ×2, L3 ×1, Probeprüfung A
    Konzeptcheck: Quiz 1, 2
    Lösungsblatt geprüft: ja – Abweichung Nr. 3 (Rundung), auf Seite vermerkt
    Status:      offen
```

Auch schwierige Lernziele ohne fertige Beispiele werden abgedeckt – dann eigene,
korrekte Beispiele bauen. Die geforderte **Tiefe** (nennen / erklären / berechnen /
herleiten / beurteilen) aus der Formulierung des Lernziels und der Prüfungsform ableiten.

Lernziele ohne tragfähige Quellenbasis **vor** dem Schreiben melden:
konkret benennen, was fehlt, und um Material oder Klärung bitten. Niemals still
weglassen und niemals mit erfundenem Inhalt auffüllen.
