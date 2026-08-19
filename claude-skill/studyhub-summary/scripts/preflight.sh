#!/usr/bin/env bash
# Preflight fuer /studyhub-summary — rein lesend, veraendert nichts.
# Prueft: Lernziele, Repo-Zugriff, Git-Zustand, Inventar des aktuellen Ordners.

set -uo pipefail

SKILL_DIR="${STUDYHUB_SKILL_DIR:-$HOME/.claude/skills/studyhub-summary}"
SRC="$(pwd)"
BLOCKERS=0

# Repo-Pfad aufloesen: ENV > config.md > uebliche Orte. Ueberlebt Ordner-Umbenennungen.
resolve_repo() {
  if [ -n "${STUDYHUB_REPO:-}" ] && [ -d "$STUDYHUB_REPO" ]; then printf '%s' "$STUDYHUB_REPO"; return; fi
  if [ -f "$SKILL_DIR/config.md" ]; then
    local p
    p=$(grep -m1 -E '^[[:space:]]*(~|/)[^[:space:]*<>]+[[:space:]]*$' "$SKILL_DIR/config.md" \
        | tr -d ' ' | sed "s|^~|$HOME|")
    if [ -n "$p" ] && [ -d "$p" ]; then printf '%s' "$p"; return; fi
  fi
  local c
  for c in "$HOME/dev/school/StudyHub" "$HOME/dev/school/StudyHub-BMSW" "$HOME/dev/StudyHub"; do
    [ -d "$c" ] && { printf '%s' "$c"; return; }
  done
  printf '%s' "${p:-$HOME/dev/school/StudyHub}"
}
REPO="$(resolve_repo)"

hr() { printf '\n== %s ==\n' "$1"; }

hr "QUELLORDNER"
echo "$SRC"
case "$SRC" in
  "$REPO"|"$REPO"/*)
    echo "HINWEIS: Du bist im StudyHub-Repo selbst gestartet, nicht in einem Fachordner."
    echo "         Das ist nur sinnvoll, wenn du eine bestehende Seite ueberarbeiten willst."
    ;;
esac

# ---------- Lernziele ----------
# Drei moegliche Quellen, Prioritaet: 1) inline beim Aufruf  2) Datei im Fachordner
# 3) LERNZIELE.md im Skill-Verzeichnis.  --inline setzen, wenn die Lernziele direkt
# im /studyhub-summary-Aufruf oder im Chat mitgegeben wurden.
hr "LERNZIELE"
INLINE=0
[ "${1:-}" = "--inline" ] && INLINE=1

# Datei im aktuellen Ordner suchen (max. 3 Ebenen tief)
LOCAL=$(find "$SRC" -maxdepth 3 -type f \
        \( -iname 'lernziele*.md' -o -iname 'lernziele*.txt' -o -iname 'lernziel*.md' \) \
        2>/dev/null | head -5)

# Datei im Skill-Verzeichnis pruefen
LZ="$SKILL_DIR/LERNZIELE.md"
SKILL_USABLE=0
if [ -f "$LZ" ]; then
  if [ -f "$SKILL_DIR/LERNZIELE.template.md" ] && diff -q "$LZ" "$SKILL_DIR/LERNZIELE.template.md" >/dev/null 2>&1; then
    SKILL_STATE="unveraendertes Template"
  else
    GOALS=$(awk '
      /^##[[:space:]]/ { inz = ($0 ~ /Lernziele/) ? 1 : 0; next }
      inz && /^[[:space:]]*[-*][[:space:]]*[^[:space:]]/ {
        line = $0
        sub(/^[[:space:]]*[-*][[:space:]]*/, "", line)
        if (line !~ /^\.+$/ && length(line) > 2) print line
      }' "$LZ")
    N=$(printf '%s\n' "$GOALS" | grep -c . || true)
    BODY=$(grep -vE '^[[:space:]]*(#|>|$)' "$LZ" | grep -vE '^[[:space:]]*[-*][[:space:]]*\.*[[:space:]]*$' \
           | grep -vE '^(Fach|Thema|Datum|Schule):[[:space:]]*(BMSW / BBW)?[[:space:]]*$' | grep -c . || true)
    if [ "$N" -gt 0 ] || [ "$BODY" -ge 3 ]; then
      SKILL_USABLE=1
      SKILL_STATE="$N Lernziel(e), $BODY Inhaltszeile(n)"
    else
      SKILL_STATE="leer / keine Lernziele"
    fi
  fi
else
  SKILL_STATE="Datei fehlt"
fi

echo "Quellen:"
[ "$INLINE" -eq 1 ] && echo "  [1] inline beim Aufruf .... JA (hat Vorrang)" \
                    || echo "  [1] inline beim Aufruf .... nein"
if [ -n "$LOCAL" ]; then
  echo "  [2] Datei im Fachordner ... JA"
  printf '%s\n' "$LOCAL" | sed "s|$SRC/|        |"
else
  echo "  [2] Datei im Fachordner ... nein"
fi
echo "  [3] Skill-LERNZIELE.md .... $SKILL_STATE"

if [ "$INLINE" -eq 1 ]; then
  echo
  echo "OK — Lernziele wurden direkt mitgegeben. Diese verwenden."
  echo "     Die anderen Quellen nur als Ergaenzung heranziehen, nicht als Ersatz."
elif [ -n "$LOCAL" ]; then
  echo
  echo "OK — Lernziel-Datei im Fachordner gefunden. Diese lesen und verwenden."
elif [ "$SKILL_USABLE" -eq 1 ]; then
  echo
  echo "OK — Lernziele aus $LZ"
  grep -E '^(Fach|Thema|Datum|Schule):[[:space:]]*[^[:space:]]' "$LZ" | sed 's/^/  /'
  [ "${N:-0}" -gt 0 ] && printf '%s\n' "$GOALS" | awk 'NF{printf "  L%d: %s\n", ++i, $0}'
else
  echo
  echo "BLOCKER: keine Lernziele gefunden. Drei Moeglichkeiten:"
  echo "  a) direkt beim Aufruf mitgeben:"
  echo "       /studyhub-summary Lernziele: - erstes Ziel - zweites Ziel"
  echo "  b) Datei lernziele.md in den Fachordner legen: $SRC"
  echo "  c) dauerhaft eintragen in: $LZ"
  BLOCKERS=$((BLOCKERS+1))
fi

# ---------- Repo-Zugriff ----------
hr "STUDYHUB-ZUGRIFF"
if [ ! -d "$REPO" ]; then
  echo "BLOCKER: Repository nicht gefunden unter $REPO"
  BLOCKERS=$((BLOCKERS+1))
elif [ ! -r "$REPO/index.html" ] || [ ! -w "$REPO" ]; then
  echo "BLOCKER: Kein Lese-/Schreibzugriff auf $REPO"
  echo "         Session mit Zugriff neu starten:"
  echo "           claude --add-dir $REPO"
  echo "         oder in dieser Session:  /add-dir $REPO"
  BLOCKERS=$((BLOCKERS+1))
else
  echo "OK — $REPO les- und schreibbar."
fi

# ---------- Git ----------
if [ -d "$REPO/.git" ]; then
  hr "GIT"
  BRANCH=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
  echo "Branch: $BRANCH"
  if [ "$BRANCH" = "HEAD" ]; then
    echo "BLOCKER: Detached HEAD — bitte klaeren, bevor geschrieben wird."
    BLOCKERS=$((BLOCKERS+1))
  fi
  for m in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD; do
    if [ -e "$REPO/.git/$m" ]; then
      echo "BLOCKER: laufender Vorgang erkannt ($m) — nicht sicher beschreibbar."
      BLOCKERS=$((BLOCKERS+1))
    fi
  done
  DIRTY=$(git -C "$REPO" status --porcelain 2>/dev/null)
  if [ -n "$DIRTY" ]; then
    echo "ACHTUNG: fremde uncommittete Aenderungen vorhanden — unangetastet lassen,"
    echo "         niemals mit 'git add -A' mitstagen:"
    printf '%s\n' "$DIRTY" | sed 's/^/  /'
  else
    echo "Working tree sauber."
  fi

  hr "REPO-STRUKTUR"
  echo "Fach-Ordner unter summaries/:"
  find "$REPO/summaries" -mindepth 2 -maxdepth 2 -type d 2>/dev/null \
    | sed "s|$REPO/summaries/|  |" | sort
  echo "Bestehende Zusammenfassungen: $(find "$REPO/summaries" -name '*.html' 2>/dev/null | wc -l | tr -d ' ')"
fi

# ---------- Inventar ----------
hr "MATERIAL IM AKTUELLEN ORDNER"
FILES=$(find "$SRC" \
  \( -name .git -o -name node_modules -o -name dist -o -name build -o -name target \
     -o -name .venv -o -name venv -o -name __pycache__ -o -name .next -o -name .cache \
     -o -name .idea -o -name .vscode -o -name vendor -o -name .gradle -o -name .mvn \) -prune -o \
  -type f \
  ! -name '.DS_Store' ! -name '*.macos-backup' ! -name '*.lock' ! -name '*-lock.json' \
  ! -name 'Thumbs.db' ! -name '*.tmp' ! -name '*~' \
  -print 2>/dev/null | sort)

COUNT=$(printf '%s\n' "$FILES" | grep -c . || true)
echo "Relevante Dateien: $COUNT"
if [ "$COUNT" -eq 0 ]; then
  echo "BLOCKER: kein verwertbares Material gefunden. Stimmt der Ordner?"
  BLOCKERS=$((BLOCKERS+1))
else
  echo
  echo "Nach Typ:"
  printf '%s\n' "$FILES" | sed 's/.*\.//' | tr '[:upper:]' '[:lower:]' \
    | sort | uniq -c | sort -rn | head -15 | sed 's/^/  /'
  echo
  echo "Pruefungsrelevante Treffer (zuerst lesen):"
  printf '%s\n' "$FILES" | grep -iE 'pruefung|prüfung|exam|test|probe|_kt|lernziel|loesung|lösung|solution|spick|zusammenfassung|handout|uebung|übung' \
    | sed "s|$SRC/|  |" | head -30 || echo "  (keine)"
  echo
  echo "Alle Dateien:"
  printf '%s\n' "$FILES" | sed "s|$SRC/|  |" | head -200
  if [ "$COUNT" -gt 200 ]; then echo "  … $((COUNT-200)) weitere"; fi
fi

hr "ERGEBNIS"
if [ "$BLOCKERS" -gt 0 ]; then
  echo "PREFLIGHT FAILED — $BLOCKERS Blocker. Nicht weiterarbeiten, Blocker melden."
  exit 1
fi
echo "PREFLIGHT OK — Analyse kann beginnen."
