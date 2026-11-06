# Übungen, Lösungen, Quiz und Probeprüfung

Übungen sind **Kernanforderung**, kein Füllmaterial. Eine Seite ohne substanzielle
Übungen ist nicht fertig. Markup der Bausteine: `design-system.md`.

## Umfang

Genug Aufgaben, um **jedes** Lernziel zu prüfen – Qualität und Vielfalt vor einer
hohen Zahl. Kein Lernziel ohne Aufgabe. Zentrale und rechenintensive Lernziele
bekommen mehrere Aufgaben auf verschiedenen Niveaus.

## Drei Niveaus + Prüfungssimulation

| Level | Name | Was geprüft wird |
|---|---|---|
| 1 | Grundlagen | Definitionen, einfache Formelanwendung, Umrechnungen – Sicherheit aufbauen |
| 2 | Prüfungsniveau | realistische mehrschrittige Aufgaben, Formel selbst wählen, Resultat deuten |
| 3 | Transfer | Konzepte kombinieren, komplexer umstellen, Annahmen erkennen, unbekannte Situation |
| – | Probeprüfung | eigene Sektion: realistisch, Methode nicht verraten, Punkte, Musterlösung |

`data-level="1|2|3"` am `article.sh-ex`. **Die Mehrheit darf nicht triviales Abfragen
sein.** Für rechenlastige Themen: Konzeptfragen **und** vollständige Rechenaufgaben,
nicht nur Multiple Choice.

## Aufgabendesign

Grundlage: Lernziele, Material der Lehrperson, nummerierte Schulaufgaben, alte
Prüfungen, im Material sichtbare Fehler. Schulaufgaben nicht kopieren – mit
Aufgabennummer referenzieren (`.sh-source`) und paraphrasierte Varianten bauen,
die dieselbe Kompetenz prüfen. Fallen gezielt einbauen:

- irrelevante Zusatzangaben, leicht veränderte Bedingungen
- Wahl zwischen ähnlichen Konzepten (z. B. Körper- vs. verdrängtes Volumen)
- Resultat interpretieren, **Warum** erklären, fehlerhafte Lösung korrigieren
- erkennen, dass eine Methode hier nicht anwendbar ist
- mehrere Lernziele kombinieren

Nicht in jedes Fach Zahlenrechner zwingen. Geschichte/Sprachen/Recht: Analyse-,
Begründungs-, Zuordnungs-, Fall- und Schreibaufgaben mit Bewertungsraster.

## Numerische Aufgaben

Jede braucht: klar definierte Gegebenheiten mit Einheiten, klar benannte gesuchte
Grösse, erwartete Einheit, sinnvolle signifikante Stellen und – wenn Geometrie oder
Kräfte eine Rolle spielen – ein Diagramm.

Die Antwortprüfung (`sh-core.js`) akzeptiert `1,25`, `1.25`, `1.25e3`,
`1,25·10^3`, `1'250` und getippte Einheiten; sie vergleicht mit Toleranz, nicht
per String. Pro Antwort festlegen:

- `data-answer`: exakter Endwert (nicht der gerundete)
- `data-unit` und, wo sinnvoll, `data-alt-units` (kN, g/cm³, cm …)
- `data-tol`: Standard 1 %; bei Tabellenwerten/Ablesungen grösser, bei Ganzzahlen absolut
- `data-mistakes`: typische, **aus dem Rechenweg ableitbare** Fehlresultate mit
  konkreter Rückmeldung

Automatische Rückmeldungen ohne Zusatzangaben: richtig · knapp daneben (Rundung) ·
Vorzeichen · Zehnerpotenz (Einheiten) · ungültige/leere Eingabe · unbekannte Einheit.
Mehr Diagnose nicht vortäuschen: Aus **einer** Zahl lässt sich ein falscher Ansatz
nur erkennen, wenn sein Resultat als `data-mistakes` hinterlegt ist.

Wiederholen ist jederzeit möglich; gelöste Aufgaben werden lokal gespeichert
(Zurücksetzen in der Sidebar).

## Gestufte Hilfe – genau drei Tipps pro Rechenaufgabe

1. **Idee** – welches Prinzip zählt? (ohne Formel)
2. **Formel / Skizze** – welche Gleichung, welche Kräfte?
3. **Ansatz** – wie wird umgestellt / eingesetzt? (ohne Endresultat)

Kein Tipp verrät das Resultat.

## Lösungen

Jede Aufgabe hat eine Lösung in `<details class="sh-solution">` (anfangs zu).
Ausnahme nur bei offenen Diskussionsaufgaben – dann Bewertungsraster oder
Argumentationslinien.

Rechenlösungen folgen dem **Rechenweg** (bei ausführlichen Beispielen als `dl.sh-calc`):

1. **Gegeben** – alle Werte mit Symbol und Einheit
2. **Gesucht**
3. **Skizze / Kräftebild**
4. **Ansatz / Prinzip** – welches Gesetz und warum es hier gilt (Bedingungen, Richtungen)
5. **Formel symbolisch umstellen** – vor dem Einsetzen
6. **Werte mit SI-Einheiten einsetzen** – Umrechnungen sichtbar
7. **Berechnen** – Zwischenresultate, wo hilfreich
8. **Ergebnis und Plausibilitätskontrolle** – sinnvoll gerundet, Grössenordnung, Deutung

Zusätzlich, wo relevant: der typische Irrweg. Bei Rechtsfällen Subsumtion,
bei Sprachaufgaben **warum** die Antwort richtig ist, bei Code das Laufzeitverhalten.

## Lösungen verifizieren

Lösungsblätter der Lehrperson dienen zur **Kontrolle**, nicht zum Abschreiben.
Jede Rechnung selbst nachrechnen (am besten mit `node -e` / `python3 -c`):
Zwischenwerte, Einheiten, Rundung, Randbedingungen, Annahmen, physikalische
Plausibilität. Abweichungen vom Lösungsblatt transparent als `.sh-note`
kennzeichnen («Lösungsblatt: 24 N; mit g = 9,81 m/s² ergibt sich 24,5 N»).

## Konzept-Quiz

Fragen zielen auf **echte Fehlvorstellungen**. Jede Option hat ein `.sh-why`:
warum richtig bzw. warum falsch. 3 Optionen genügen meist; keine Scherzantworten.

## Probeprüfung

- deckt die Lernziele im Verhältnis ihrer Prüfungsrelevanz ab
- realistische Schwierigkeit, eindeutige Aufgabenstellungen, Methode **nicht** verraten
- Punkte pro Aufgabe (`data-points`) und Zeitrahmen, Hilfsmittel nennen
- Musterlösung mit Punkteverteilung pro Teilschritt
- `data-review` verweist auf das Kapitel zum Repetieren
- automatische Kontrolle (`.sh-answer`) nur bei eindeutigen Zahlenresultaten

Wo eine schriftliche Prüfung nicht passt (mündlich, Portfolio): Sprechanlässe mit
Musterantworten, Analyseauftrag mit Bewertungsraster, Praxisaufgabe mit Referenzlösung.

## Verknüpfung mit den Original-Lernzielen

Jede Übung, Prüfungsaufgabe und Quizfrage trägt `data-objective="<key>"` des
Lernziels, das sie prüft. Damit prüft der Builder die Abdeckung und druckt die
Abdeckungstabelle. Das Häkchen «verstanden» setzt **nur** der Lernende – gelöste
Übungen haken nichts ab.

## Rückkopplung zum Coverage-Gate

```
Lernziel ↔ Erklärung ↔ (Herleitung) ↔ Beispiel ↔ Übung ↔ Lösung ↔ Konzeptcheck
```

Ein Lernziel, das nur in einer Überschrift auftaucht, gilt als **nicht** abgedeckt.
