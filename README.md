<div align="center">
  <img src="./logo-bmsw.png" alt="BMSW Logo" width="110" />

  <h1>StudyHub-BMSW</h1>

  <p><em>Zentrale Übersicht für Lern- und Prüfungsunterlagen – nach Schule und Fach geordnet, mit integrierter Suche.</em></p>

  <p>
    <img alt="Status" src="https://img.shields.io/badge/Status-aktiv-2ea44f" />
    <img alt="Tech" src="https://img.shields.io/badge/Tech-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-informational" />
    <img alt="Dependencies" src="https://img.shields.io/badge/Dependencies-keine-blue" />
  </p>
</div>

---

## Überblick

**StudyHub** bündelt alle HTML-Zusammenfassungen, Prüfungsvorbereitungen und interaktiven
Lernseiten an einem Ort. Statt einzelne Dateien über verschiedene Ordner und Geräte hinweg
zu suchen, liefert eine zentrale `index.html` eine strukturierte Fächerübersicht inklusive
**Live-Suche** über alle Einträge.

## Motivation

- **Schneller Zugriff** auf die richtigen Unterlagen, insbesondere in der Prüfungsvorbereitung.
- **Zentralisierung** von Materialien aus mehreren Schulen (BMSW und BBW) an einem Ort.
- **Wartungsarme Lösung** ohne Build-Prozess, Framework oder externe Abhängigkeiten.

## Funktionsumfang

- Fächerübersicht, gruppiert nach Schule und Fach
- Live-Suche über Titel, Fach und Schule
- Vollständig client-seitig – funktioniert auch offline
- Responsives Layout über CSS Custom Properties und `clamp()`

---

## Schnellstart

1. Repository klonen oder als ZIP herunterladen.
2. `index.html` im Browser öffnen.
3. Im Suchfeld ein Thema eingeben (z. B. *Recht*, *Trigonometrie*, *NoSQL*).

## Projektstruktur

```
StudyHub-BMSW/
├── index.html          Startseite mit Fächerübersicht und Suche
├── logo-bmsw.png       Logo BMSW
├── logo-bbw.svg        Logo BBW
└── summaries/          Zusammenfassungen, nach Fach gegliedert
    ├── deutsch/
    ├── englisch/
    ├── mathe/
    ├── french/
    ├── wirtschaft-recht/
    ├── GLF/
    ├── english-books/
    └── bbw/            Module der Berufsschule (m165, m347 …)
```

## Inhalte erweitern

Neue `.html`-Datei in den passenden Ordner unter `summaries/` ablegen und in `index.html`
einen Eintrag in der jeweiligen `link-list` ergänzen:

```html
<li>
  <a href="./summaries/mathe/algebra.html" target="_blank" rel="noopener">
    Algebra – Grundlagen
  </a>
</li>
```

Die Suche erfasst neue Einträge automatisch, da sie die Links beim Laden direkt aus der
Seite ausliest.

---

## Fächerübersicht

<table>
  <tr>
    <th align="left">Schule</th>
    <th align="left">Fächer / Module</th>
  </tr>
  <tr>
    <td><strong>BMSW</strong></td>
    <td>Wirtschaft &amp; Recht, Englisch, Deutsch, Mathe, Physik, Französisch</td>
  </tr>
  <tr>
    <td><strong>BMSW</strong> · Abschluss</td>
    <td>GLF, English Books</td>
  </tr>
  <tr>
    <td><strong>BBW</strong></td>
    <td>Modul 165 – NoSQL, Modul 347 – Dienst mit Container anwenden</td>
  </tr>
</table>

---

<details>
  <summary><strong>Technische Details</strong></summary>

  <br />

  - **Live-Suche:** Ein Skript erfasst beim Laden alle Links aus den `.subject-card`-Blöcken
    und filtert nach Titel, Fach und Schule.
  - **Kein Backend:** Die Anwendung läuft vollständig im Browser und benötigt keinen Server.
  - **Responsives Design:** Layout und Typografie skalieren über `clamp()` mit der Bildschirmbreite.
  - **Zentrales Theming:** Farben und Abstände werden über CSS Custom Properties (`:root`) gesteuert.

</details>

---

<div align="center">
  <sub>BMSW · BBW — Lernunterlagen, zentral verwaltet.</sub>
</div>
