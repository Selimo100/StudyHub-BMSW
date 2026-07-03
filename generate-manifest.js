#!/usr/bin/env node
/**
 * Baut pdfs/manifest.json: durchsucht pdfs/ rekursiv nach *.pdf und gruppiert
 * sie pro Fach-Ordner (der Pfad relativ zu pdfs/ ist der "slug", z. B.
 * "wirtschaft-recht" oder "bbw/m165"). Keine Dependencies, reines Node.
 *
 * Aufruf:  node generate-manifest.js
 */

const fs = require("fs");
const path = require("path");

const PDF_DIR = path.join(__dirname, "pdfs");
const OUT_FILE = path.join(PDF_DIR, "manifest.json");

function humanSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  const units = ["KB", "MB", "GB"];
  let val = bytes / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return (val < 10 ? val.toFixed(1) : Math.round(val)) + " " + units[i];
}

/** Sammelt alle .pdf-Dateien rekursiv, gruppiert nach Ordner-Slug. */
function collect(dir, subjects) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(full, subjects);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      const relDir = path.relative(PDF_DIR, dir).split(path.sep).join("/");
      const slug = relDir || ".";
      const stat = fs.statSync(full);
      (subjects[slug] = subjects[slug] || []).push({
        name: entry.name,
        path: "pdfs/" + path.relative(PDF_DIR, full).split(path.sep).join("/"),
        size: stat.size,
        sizeLabel: humanSize(stat.size),
        modified: stat.mtime.toISOString().slice(0, 10),
      });
    }
  }
}

const subjects = {};
if (fs.existsSync(PDF_DIR)) {
  collect(PDF_DIR, subjects);
}

// Innerhalb jedes Fachs alphabetisch sortieren
for (const slug of Object.keys(subjects)) {
  subjects[slug].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

const manifest = {
  generated: new Date().toISOString(),
  subjects,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n");

const total = Object.values(subjects).reduce((n, arr) => n + arr.length, 0);
console.log(
  `manifest.json geschrieben: ${total} PDF(s) in ${Object.keys(subjects).length} Fach/Fächern.`
);
