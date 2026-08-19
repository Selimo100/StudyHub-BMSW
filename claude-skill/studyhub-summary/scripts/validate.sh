#!/usr/bin/env bash
# Validiert eine generierte StudyHub-Seite und ihre Einbindung. Rein lesend.
# Aufruf: bash validate.sh "summaries/bmsw/mathe/thema.html"

set -uo pipefail

SKILL_DIR="${STUDYHUB_SKILL_DIR:-$HOME/.claude/skills/studyhub-summary}"

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
  printf '%s' "$HOME/dev/school/StudyHub"
}
REPO="$(resolve_repo)"
REL="${1:-}"
ERR=0
WARN=0

fail() { echo "  FEHLER: $*"; ERR=$((ERR+1)); }
warn() { echo "  WARNUNG: $*"; WARN=$((WARN+1)); }
ok()   { echo "  OK: $*"; }
hr()   { printf '\n== %s ==\n' "$1"; }

if [ -z "$REL" ]; then
  echo "Aufruf: bash validate.sh \"summaries/bmsw/<fach>/<name>.html\""
  exit 2
fi
REL="${REL#./}"
REL="${REL#$REPO/}"
F="$REPO/$REL"

hr "DATEI"
if [ ! -f "$F" ]; then echo "  FEHLER: $F existiert nicht."; exit 1; fi
echo "  $REL  ($(wc -c <"$F" | tr -d ' ') Bytes, $(wc -l <"$F" | tr -d ' ') Zeilen)"
case "$REL" in
  summaries/bmsw/*/*.html|summaries/bbw/*/*.html) ok "Ablageort entspricht der Konvention." ;;
  *) fail "Ablageort weicht ab — erwartet summaries/bmsw/<fach>/ oder summaries/bbw/<modul>/." ;;
esac
BASE=$(basename "$REL")
case "$BASE" in
  summary.html|test.html|new.html|exam.html|index.html) fail "Generischer Dateiname: $BASE" ;;
esac
printf '%s' "$BASE" | LC_ALL=C grep -qE '^[a-z0-9_&.-]+\.html$' \
  || warn "Dateiname enthaelt Grossbuchstaben oder Sonderzeichen: $BASE"

hr "SPRACHE (Schweiz)"
if grep -q 'ß' "$F"; then
  fail "'ß' gefunden — immer 'ss' verwenden:"
  grep -n 'ß' "$F" | head -10 | sed 's/^/    /'
else
  ok "kein 'ß'."
fi
grep -qE '\b(fuer|ueber|koennen|muessen|waehrend|zaehlen|groesse)\b' "$F" \
  && warn "ae/oe/ue-Umschreibung im Fliesstext gefunden — Umlaute verwenden." \
  || ok "keine unnoetige Umlaut-Umschreibung."

hr "HTML-GRUNDGERUEST"
grep -qi '<!doctype html>' "$F" && ok "doctype" || fail "<!doctype html> fehlt"
grep -qi 'charset=["'\'']*UTF-8' "$F" && ok "charset UTF-8" || fail "meta charset fehlt"
grep -qi 'name=["'\'']viewport' "$F" && ok "viewport" || fail "meta viewport fehlt"
grep -qi '<html[^>]*lang=' "$F" && ok "lang-Attribut" || fail "lang-Attribut fehlt"
T=$(grep -oi '<title>[^<]*' "$F" | head -1 | sed 's/<title>//I')
[ -n "$T" ] && ok "title: $T" || fail "<title> fehlt oder leer"

hr "STRUKTUR"
for tag in html head body; do
  O=$(grep -oi "<$tag[ >]" "$F" | wc -l | tr -d ' ')
  C=$(grep -oi "</$tag>" "$F" | wc -l | tr -d ' ')
  [ "$O" = "$C" ] && ok "<$tag> ausgeglichen" || fail "<$tag>: $O offen / $C geschlossen"
done
for tag in div section details script style; do
  O=$(grep -oi "<$tag[ >]" "$F" | wc -l | tr -d ' ')
  C=$(grep -oi "</$tag>" "$F" | wc -l | tr -d ' ')
  [ "$O" = "$C" ] || fail "<$tag>: $O offen / $C geschlossen"
done
H1=$(grep -oi '<h1[ >]' "$F" | wc -l | tr -d ' ')
[ "$H1" -ge 1 ] && ok "h1 vorhanden ($H1)" || fail "kein <h1>"
DUP=$(grep -oE 'id="[^"]+"' "$F" | sort | uniq -d)
[ -z "$DUP" ] && ok "keine doppelten IDs" || { fail "doppelte IDs:"; printf '%s\n' "$DUP" | sed 's/^/    /'; }

hr "ANKER UND LINKS"
IDS=$(grep -oE 'id="[^"]+"' "$F" | sed 's/id="//;s/"//' | sort -u)
BROKEN=""
for a in $(grep -oE 'href="#[^"]+"' "$F" | sed 's/href="#//;s/"//' | sort -u); do
  printf '%s\n' "$IDS" | grep -qx "$a" || BROKEN="$BROKEN $a"
done
[ -z "$BROKEN" ] && ok "alle internen Anker aufloesbar" || fail "tote Anker:$BROKEN"
PH=$(grep -c 'href="#"' "$F" || true)
[ "$PH" -eq 0 ] && ok "keine href=\"#\"-Platzhalter" \
  || warn "$PH x href=\"#\" — nur zulaessig als bewusstes In-Page-Steuerelement"
for r in $(grep -oE '(src|href)="\.\.[^"]*"' "$F" | sed 's/^[a-z]*="//;s/"$//' | sort -u); do
  [ -e "$(dirname "$F")/$r" ] || fail "relative Referenz zeigt ins Leere: $r"
done

hr "PLATZHALTER UND LECKS"
grep -inE 'TODO|FIXME|XXX+|Lorem ipsum|PLATZHALTER|\bTBD\b|hier einfuegen|hier einfügen' "$F" \
  | head -10 | sed 's/^/    /' | grep -q . \
  && fail "Platzhalter-/TODO-Reste gefunden (siehe oben)" || ok "keine Platzhalter"
LEAK=$(grep -nE '/Users/|CloudStorage|OneDrive|\.claude/|file:///' "$F" | head -10)
[ -z "$LEAK" ] && ok "keine lokalen Pfade geleakt" \
  || { fail "lokale Pfade im HTML:"; printf '%s\n' "$LEAK" | sed 's/^/    /'; }

hr "LERNINHALT"
EX=$(grep -ciE 'aufgabe|übung|uebung|exercise' "$F" || true)
[ "$EX" -ge 5 ] && ok "Uebungen erkennbar ($EX Treffer)" || fail "zu wenig Uebungsinhalt ($EX Treffer)"
SO=$(grep -ciE 'lösung|loesung|musterlösung|solution' "$F" || true)
[ "$SO" -ge 3 ] && ok "Loesungen erkennbar ($SO Treffer)" || fail "zu wenig Loesungsinhalt ($SO Treffer)"
TOG=$(grep -ciE '<details|toggle|einblenden|anzeigen' "$F" || true)
[ "$TOG" -ge 1 ] && ok "einklappbare Loesungen vorhanden" || warn "keine einklappbaren Loesungen erkannt"

hr "ABHAENGIGKEITEN"
EXT=$(grep -oE '(src|href)="https?://[^"]+"' "$F" | sed 's/^[a-z]*="//;s/"$//' \
      | grep -v 'fonts.googleapis.com\|fonts.gstatic.com' | sort -u)
[ -z "$EXT" ] && ok "keine externen Abhaengigkeiten ausser Google Fonts" \
  || { warn "externe Ressourcen (Repo-Konvention: keine):"; printf '%s\n' "$EXT" | sed 's/^/    /'; }

hr "INLINE-JS"
if command -v node >/dev/null 2>&1 && grep -q '<script' "$F"; then
  TMP=$(mktemp /tmp/studyhub-js-XXXX.js)
  awk '/<script[^>]*>/{f=1;next} /<\/script>/{f=0;print ";"} f' "$F" > "$TMP"
  if [ -s "$TMP" ]; then
    node --check "$TMP" >/dev/null 2>&1 && ok "Inline-JS syntaktisch gueltig" \
      || warn "node --check meldet Probleme (kann bei mehreren Bloecken falsch anschlagen): $(node --check "$TMP" 2>&1 | head -3 | tr '\n' ' ')"
  fi
  rm -f "$TMP"
else
  ok "kein Inline-JS oder node nicht verfuegbar"
fi

hr "EINBINDUNG IN index.html"
IDX="$REPO/index.html"
ESC=$(printf '%s' "$REL" | sed 's/&/\&amp;/g')
if grep -qF "\"./$ESC\"" "$IDX" || grep -qF "\"./$REL\"" "$IDX"; then
  ok "in index.html verlinkt"
  grep -nF "$ESC" "$IDX" | head -3 | sed 's/^/    /'
  grep -F "$ESC" "$IDX" | grep -q 'rel="noopener"' || warn "Link ohne rel=\"noopener\""
  grep -F "$ESC" "$IDX" | grep -q 'target="_blank"' || warn "Link ohne target=\"_blank\""
else
  fail "kein Link in index.html — die Seite ist auf StudyHub nicht auffindbar."
fi

hr "INDEX-INTEGRITAET"
DEAD=0
while IFS= read -r h; do
  p=$(printf '%s' "$h" | sed 's/^\.\///;s/&amp;/\&/g')
  [ -e "$REPO/$p" ] || { fail "Index verweist auf fehlende Datei: $p"; DEAD=$((DEAD+1)); }
done < <(grep -oE 'href="\./summaries/[^"]+"' "$IDX" | sed 's/href="//;s/"$//' | sort -u)
[ "$DEAD" -eq 0 ] && ok "alle Summary-Links im Index aufloesbar"
for tag in article ul section; do
  O=$(grep -oi "<$tag[ >]" "$IDX" | wc -l | tr -d ' ')
  C=$(grep -oi "</$tag>" "$IDX" | wc -l | tr -d ' ')
  [ "$O" = "$C" ] || warn "index.html <$tag>: $O offen / $C geschlossen (teils vorbestehend)"
done

hr "GIT"
git -C "$REPO" status --porcelain | sed 's/^/  /'

hr "ERGEBNIS"
echo "  Fehler: $ERR   Warnungen: $WARN"
[ "$ERR" -eq 0 ] && echo "  VALIDIERUNG BESTANDEN" || echo "  VALIDIERUNG FEHLGESCHLAGEN — beheben, nicht beschoenigen."
[ "$ERR" -eq 0 ]
