# Diagramme

Jedes Diagramm **lehrt etwas**. Keine Deko-Grafik, keine vagen Skizzen, keine
Screenshots aus PDFs. Abbildungen der Lehrperson dienen als Vorlage für Physik,
Geometrie und Begriffe – gezeichnet wird ein sauberes, eigenes SVG.

Geometrie nicht erfinden, damit es schöner aussieht: Masse, Lagen und Verhältnisse
kommen aus der Aufgabe. Ist eine kritische Angabe im Material unleserlich, nachfragen;
sonst nach bestem Wissen aus dem vorhandenen Material zeichnen.

## Technik

```html
<figure class="sh-figure">
  <span class="sh-figure-title">1 · Situation</span>
  <svg viewBox="0 0 320 260" role="img" aria-labelledby="f1-t f1-d">
    <title id="f1-t">Kurzer Titel</title>
    <desc id="f1-d">Was zu sehen ist, inkl. aller Zahlenwerte – für Screenreader.</desc>
    …
  </svg>
  <figcaption>Was man daraus lernen soll.</figcaption>
</figure>
```

- Immer `viewBox`, nie feste `width`/`height` – das SVG skaliert mit.
- Breite der viewBox **≤ 340** wählen, Schrift 13 (Standard) bzw. ≥ 11 (`dg-small`):
  dann sind Beschriftungen auch bei 320 px Bildschirmbreite lesbar.
  Breitere Diagramme (Zeitstrahl, Datenflüsse) erhalten automatisch «Vergrössern».
- Mindestens 12 Einheiten Rand; keine Beschriftung ausserhalb der viewBox.
- Labels nicht überlappen lassen; lieber Pfeil versetzen und in der Caption erklären.
- Index in SVG-Text: `F<tspan dy="4" font-size="10">A</tspan><tspan dy="-4"> = 19,6 N</tspan>`.
- Farben **nur über Klassen** (Tokens), keine Hexwerte.
- Situation und Kräftebild als Paar: `<div class="sh-figure-pair">`.

## Klassen

| Klasse | Bedeutung | Darstellung (nie nur Farbe) |
|---|---|---|
| `dg-fluid`, `dg-fluid-line` | Flüssigkeit, Oberfläche | Fläche + Linie, beschriftet |
| `dg-body` | Körper | Fläche mit Kontur |
| `dg-displaced` | verdrängtes Volumen | schraffiert/gestrichelt, beschriftet |
| `dg-wall`, `dg-line` | Gefäss, Seil, Hilfslinie | |
| `dg-dim` | Bemassung | Masslinie mit Endstrichen + Text |
| `dg-force-g` + `dg-label-g` | Gewichtskraft | durchgezogen, volle Spitze |
| `dg-force-a` + `dg-label-a` | Auftrieb | durchgezogen, eingekerbte Spitze |
| `dg-force-h` + `dg-label-h` | Halte-/Seil-/Federkraft | gestrichelt, offene Spitze |
| `dg-force-o` + `dg-label-o` | weitere Kraft (Druck, Reibung …) | gepunktet |
| `dg-point` | Angriffspunkt | Punkt |
| `dg-accent`, `dg-accent-fill`, `dg-accent-soft` | Fach-Hervorhebung | |
| `dg-small` | Nebenbeschriftung | |

Pfeilspitzen kommen aus globalen Markern (`url(#sh-arrow-g)` usw.) – die Klassen
setzen sie automatisch. Für neutrale Pfeile: `marker-end="url(#sh-arrow)"`.

## Physik: Pflichtinhalte

- Körper, Flüssigkeits-/Luftniveau, Bezugsachsen, Masse und Abstände der Aufgabe
- jede Kraft mit Richtung, Angriffspunkt und Bezeichnung; Betrag, wenn gegeben/berechnet
- Kräftebild **massstäblich**, wenn Beträge bekannt sind (Massstab angeben, z. B. «≙ 10 N»),
  und Kräftegleichgewicht sichtbar (Summe der Pfeile nach oben = nach unten)
- Gesamthöhe vs. eingetauchte Höhe, Körpervolumen vs. verdrängtes Volumen unterscheiden
- Tiefe und Druck: Tiefe von der Oberfläche aus bemassen

## Andere Fächer

| Fach | Sinnvolle Visualisierung |
|---|---|
| Mathematik | Konstruktionen, Graphen mit Achsen/Skalen, Einheitskreis, Vektoren |
| Geschichte | Zeitstrahl (horizontal → auf Mobile vergrösserbar), Ursache-Wirkung, Akteure |
| Wirtschaft & Recht | Modelle (Kreislauf, Angebot/Nachfrage), Prüfschema als Flussdiagramm |
| Biologie | beschriftete Strukturen und Prozesse |
| Sprachen | Satzbau-Diagramme, annotierte Beispielsätze, Zeitformen-Achse |
| Informatik | Architektur-, Ablauf-, Sequenzdiagramme |

## Interaktive Diagramme

Werte, Bild, Gleichung und Text kommen aus **einer** Funktion und werden gemeinsam
aktualisiert. Massstab fix (z. B. 4 px pro cm) und im Code dokumentiert. Annahmen
neben der Simulation nennen. Keine physikalisch falschen Animationen oder Skalierungen.
