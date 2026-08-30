# StudyHub Summary — How To

Quick guide for creating an exam summary with `/studyhub-summary`.

---

## TL;DR

```
1. cd  into the folder with your exam material
2. claude
3. /studyhub-summary  + paste your Lernziele right after the command
4. Read the preflight report, answer any question
5. When it's done:  cd /Users/selina/dev/school/StudyHub-BMSW && git push
```

That's the whole thing. Everything below is detail.

---

## Step 1 — Your Lernziele

Since the Lernziele change for every exam, the easiest way is to **paste them
straight into the command**. Three sources are supported — the first one present wins.

### Option 1 — Inline (recommended)

Just type them after the command. Multi-line is fine:

```
/studyhub-summary Lernziele:
- Arbeitsvertrag definieren und Merkmale nennen
- Arbeitsvertrag vom Auftrag und Werkvertrag abgrenzen
- Kündigungsfristen korrekt berechnen

Prüfung am 14.09., 90 Minuten, Hilfsmittel: OR
```

Nothing to open, nothing to maintain. Best for the normal case.

### Option 2 — A file in the subject folder

Drop a `lernziele.md` (or `.txt`) next to your material. It's found up to 3 levels
deep. Handy when your teacher already gave you the Lernziele as a file — and it
stays with the material for next time.

### Option 3 — The permanent fallback file

```
~/.claude/skills/studyhub-summary/LERNZIELE.md
```

```bash
code ~/.claude/skills/studyhub-summary/LERNZIELE.md
```

Used only when you gave nothing inline and there's no file in the folder.

### Format

No template needed anywhere. A raw list is valid. More context = better result:

```markdown
Fach: Wirtschaft & Recht
Thema: Arbeitsvertrag
Datum: 14.09.2026
Schule: BMSW

- Erlaubte Hilfsmittel: OR
- Prüfungsform: schriftlich, Fälle
- Dauer: 90 Minuten
- Hinweise der Lehrperson: Fokus auf Abgrenzungen
```

If you pass only context inline (`/studyhub-summary "Prüfung am 14.09."`) that counts
as an *addition* — the actual Lernziele are then taken from option 2 or 3.

> **The Lernziele decide the scope of the summary.** Every single one gets explained,
> shown with an example, tested with an exercise, and solved. If one of them can't be
> answered from your material, you'll be told *before* the page is written — not
> silently skipped.

**Do not edit** `LERNZIELE.template.md` — that's the blank reference copy used to
detect "you forgot to fill this in".

---

## Step 2 — Go to your material

Open a terminal in the folder that holds the exam material:

```bash
cd "/Users/selina/Library/CloudStorage/OneDrive-bbw.ch/Desktop-School/BMSW/Wirtschaft-Recht/Arbeitsvertrag"
claude
```

The **current folder is the source**. It gets scanned recursively, so pick the folder
that contains everything relevant — but not your whole school drive.

What gets read: Markdown, text, HTML, code, PDFs, Word/PowerPoint (when readable),
spreadsheets, OneNote exports, handouts, old exams, worksheets, solutions, cheat
sheets, your own notes, screenshots.

What gets ignored: `.git`, `node_modules`, build output, caches, lock files, `.DS_Store`.

---

## Step 3 — Run it

With the Lernziele inline:

```
/studyhub-summary Lernziele:
- erstes Lernziel
- zweites Lernziel
```

Or bare, if the Lernziele are in a file (option 2 or 3):

```
/studyhub-summary
```

Or just extra context on top of a file:

```
/studyhub-summary "Prüfung am 14.09., nur Kapitel 3 und 4"
```

Arguments are never required.

---

## Step 4 — Check the preflight report

Before anything is written, you get a short summary:

```
Erkannt:
- Bereich: BMSW
- Fach: Wirtschaft & Recht
- Prüfung: Arbeitsvertrag
- Lernziele: 12 (Quelle: inline)
- relevante Quelldateien: 8
- bestehende StudyHub-Zusammenfassung: nein
- Ziel: summaries/bmsw/wirtschaft-recht/arbeitsvertrag.html
```

**Read the "Ziel" line.** That's where the page lands. If the subject or school got
misidentified, say so now — it's cheap to correct here and annoying to fix later.

You'll only be asked questions where the answer actually changes the outcome
(e.g. "update the existing page or create a separate one?"). Everything derivable
from your files and the repo is not asked.

---

## Step 5 — Wait

This takes a while and produces a lot of output. That's intentional — the target is
a full study page (typically 40–100 KB, like your existing strong summaries), not a
2-page cheat sheet.

You get: theory, worked examples, common mistakes, memory aids, exercises on
5 difficulty levels, full solutions, a final exam simulation, and a last-minute
checklist. In Swiss German, always `ss`, never `ß`.

---

## Step 6 — Publish

The skill **commits but does not push**. Nothing is live until you do:

```bash
cd /Users/selina/dev/school/StudyHub-BMSW
git log --oneline -1     # check what was committed
git push
```

Netlify deploys `main` automatically. About a minute later:

```
https://studyhub-bmsw.netlify.app/
```

Want to look at it before pushing? Open the local file, or:

```bash
cd /Users/selina/dev/school/StudyHub-BMSW
python3 -m http.server 8000
# → http://localhost:8000
```

---

## Where things end up

```
summaries/bmsw/<fach>/<thema>.html     BMSW subjects + Abschlussprüfungen
summaries/bbw/<modul>/<thema>.html     BBW modules, e.g. bbw/m165
```

The link is also added to `index.html` in the right subject card. The live search
picks it up automatically — there's no separate index to maintain.

---

## Re-running for the same exam

Just run it again. If a summary for that topic already exists, it gets **read and
improved**, not blindly overwritten. Good existing content is preserved. If it's
unclear whether you want an update or a separate new page, you'll be asked.

---

## Before the next exam

Nothing to prepare. Just paste the new Lernziele into the command when you run it.
(Only if you rely on the fallback file do you need to replace `LERNZIELE.md`.)

---

## Safety — what it will never do

- Never pushes on its own
- Never `git reset --hard`, `git clean -fd`, or force-push
- Never stages your unrelated changes (uses `git add <path>`, never `git add -A`)
- Never touches the outdated OneDrive copy of StudyHub
- Never leaks local paths, OneDrive paths, or private filenames into the public page
- Never claims "everything covered" without actually checking every Lernziel

If your repo has uncommitted work in progress, it's reported in the preflight and
left completely alone.

---

## When something goes wrong

| Problem | What happens |
|---|---|
| No Lernziele in any of the 3 sources | Stops, shows you all three ways to provide them |
| No usable material in the folder | Lists what it found, asks if you're in the right folder |
| Subject / BMSW vs BBW unclear | Asks you |
| StudyHub not accessible | Prints the exact command to fix it |
| A Lernziel has no source material | Tells you what's missing, asks for it — before writing |
| Existing conflicting summary | Explains the situation, asks update vs. new |

---

## Changing settings

Everything configurable lives in one file:

```
~/.claude/skills/studyhub-summary/config.md
```

The one you're most likely to change is the Git mode — currently **commit, no push**.
Switch it to commit + push if you'd rather have it deploy straight away.

---

## Paths cheat sheet

| What | Where |
|---|---|
| Lernziele | inline in the command · `lernziele.md` in the folder · `~/.claude/skills/studyhub-summary/LERNZIELE.md` |
| Settings | `~/.claude/skills/studyhub-summary/config.md` |
| Skill itself | `~/.claude/skills/studyhub-summary/` |
| StudyHub repo | `/Users/selina/dev/school/StudyHub-BMSW` |
| Live site | https://studyhub-bmsw.netlify.app/ |

⚠️ The StudyHub folder in OneDrive is an **outdated clone** and is not used.
Always work with the repo under `~/dev/school/`.
