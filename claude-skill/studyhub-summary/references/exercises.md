# Übungen und Lösungen

Übungen sind **Kernanforderung**, kein Füllmaterial. Eine Seite ohne substanzielle
Übungen ist nicht fertig.

## Umfang

Genug Aufgaben, um **jedes** wichtige Lernziel zu prüfen. Kein Lernziel ohne
mindestens eine Aufgabe. Zentrale Lernziele bekommen mehrere Aufgaben auf
verschiedenen Niveaus.

## Kognitive Niveaus

| Level | Name | Was geprüft wird |
|---|---|---|
| 1 | Grundlagen | Definitionen, Grundverfahren |
| 2 | Anwendung | Wissen auf normale Situationen anwenden |
| 3 | Schwierige Anwendung | mehrere Konzepte kombinieren |
| 4 | Transfer | Wissen in neuer, ungewohnter Situation einsetzen |
| 5 | Prüfungssimulation | realistisch schwer, Methode nicht offensichtlich |

**Die Mehrheit darf nicht triviales Abfragen sein.** Die Aufgaben müssen schwer
genug sein, um echtes Verständnis von Auswendiggelerntem zu trennen.
Jedes Level klar auszeichnen, damit gezielt geübt werden kann.

## Aufgabendesign

Grundlage: Lernziele, Material der Lehrperson, Beispiele im Ordner, alte Prüfungen,
bestehende Arbeitsblätter, wahrscheinliche Prüfungsstruktur, im Material sichtbare
Fehler, konzeptionelle Zusammenhänge.

Vorhandene Aufgaben **nicht einfach kopieren** — Varianten bauen, die dieselbe
Kompetenz prüfen. Bewusst Fallen einbauen, wo es didaktisch sinnvoll ist:

- irrelevante Zusatzinformationen
- leicht veränderte Bedingungen gegenüber dem Standardfall
- Wahl zwischen ähnlichen Konzepten
- mehrschrittige Aufgaben
- Ergebnis interpretieren statt nur ausrechnen
- **Warum** erklären
- eine fehlerhafte Lösung finden und korrigieren
- erkennen, dass eine Methode hier nicht anwendbar ist
- mehrere Lernziele in einer Aufgabe kombinieren

## Lösungen

Jede Aufgabe hat eine Lösung — Ausnahme nur bei bewusst offenen Diskussions- oder
Reflexionsaufgaben ohne eindeutige Antwort (dann als solche kennzeichnen und
stattdessen Bewertungskriterien oder Argumentationslinien angeben).

Eine Lösung nennt nicht nur das Resultat, sondern erklärt:

1. welches Konzept geprüft wird
2. wie man den richtigen Ansatz erkennt
3. den Lösungsweg
4. das Ergebnis
5. den typischen Irrweg, wo relevant

Fachspezifisch: bei Rechnungen die relevanten Zwischenschritte; bei Rechtsfällen
die Subsumtion und Begründung; bei Sprachaufgaben, **warum** die Antwort richtig
ist; bei Code das wichtige Laufzeitverhalten; bei komplexen Aufgaben eine
ordentliche Musterlösung.

## Darstellung

Lösungen einklappbar, damit man erst selbst rechnet. Im Repo gibt es dafür keine
`<details>`-Konvention, sondern kleine eigene JS-Toggles — beides ist zulässig,
solange es tastaturbedienbar ist und ohne Framework auskommt. `<details>/<summary>`
ist die robusteste Variante und funktioniert auch ohne JS.

## Prüfungssimulation

Wo für das Fach sinnvoll, am Ende eine realistische Mini-Prüfung:

- kombiniert mehrere Lernziele
- schwerer als die Einstiegsaufgaben
- verrät die Methode **nicht** in der Aufgabenstellung
- genug Variation, um Wissenslücken sichtbar zu machen
- vollständige Musterlösungen
- realistischer Zeit- und Punkterahmen, wo bekannt

Wo eine Mini-Prüfung nicht passt (z. B. mündliche Prüfung, Portfolio), das
sinnvollste Äquivalent bauen: Sprechanlässe mit Musterantworten, Analyseauftrag
mit Bewertungsraster, praktische Umsetzungsaufgabe mit Referenzlösung.

## Rückkopplung zum Coverage-Gate

Die Kette muss geschlossen sein:

```
Lernziel ↔ Erklärung ↔ Beispiel ↔ Übung ↔ Lösung
```

Ein Lernziel, das nur in einer Überschrift auftaucht, gilt als **nicht** abgedeckt.
Es muss tatsächlich gelehrt **und** geprüft werden.
