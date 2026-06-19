// parseShift.js
// Wandelt das extrahierte PDF-Array in eine strukturierte JSON-Datei um

const fs = require("fs");
const path = require("path");

// Template laden
const template = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "template.json"), "utf-8")
);

/**
 * Konvertiert das extrahierte Zeilen-Array in das Template-Format.
 * @param {string[]} lines - Das rohe Array aus der PDF-Extraktion
 * @returns {object[]} - Array mit { role, name } Objekten
 */
function parseShiftArray(lines) {
  const roleSet = new Set(template.map((t) => t.role));

  // Für diese Rollen steht der Name ÜBER (davor) der Rolle
  const nameBeforeRole = new Set([
    "1. Dispo",
    "2. Dispo",
    "3. Dispo",
    "LF 2 Fü",
    "FüAss",
    "LF 2 Ma",
    "Schw.Retter",
    "LF 2 ATF",
    "LF 1 Fü",
    "LF 2 ATM",
    "LF 1 Ma",
    "LF 2 WTF",
    "LF 1 ATF",
    "LF 2 WTM",
    "LF 1 ATM",
    "LF 1 WTF",
    "LF 1 WTM",
    "DLK1 Fü",
    "DLK1 Ma",
    "SoFzg Fü",
    "SoFzg Ma",
    "KEF Fü",
    "KEF Ma",
    "Fwk Fü",
    "Fwk Ma",
  ]);

  const result = template.map((t) => ({ role: t.role, name: "" }));
  const roleIndexTracker = {};
  result.forEach((item, idx) => {
    if (!roleIndexTracker[item.role]) roleIndexTracker[item.role] = [];
    roleIndexTracker[item.role].push(idx);
  });
  const roleFillCount = {};

  let i = 0;
  while (i < lines.length) {
    const entry = lines[i].trim();

    if (roleSet.has(entry)) {
      const role = entry;
      let name = "";

      if (nameBeforeRole.has(role)) {
        // Name rückwärts suchen — letzter nicht-leerer Eintrag vor dieser Rolle
        let j = i - 1;
        while (j >= 0) {
          const prev = lines[j].trim();
          if (prev === "") { j--; continue; }
          if (roleSet.has(prev)) break; // anderer Rollenname → kein Name
          name = prev;
          lines[j] = ""; // verbraucht markieren, damit er nicht doppelt genutzt wird
          break;
        }
      } else {
        // Name vorwärts suchen
        let j = i + 1;
        while (j < lines.length) {
          const next = lines[j].trim();
          if (next === "") { j++; continue; }
          if (roleSet.has(next)) break;
          name = next;
          i = j;
          break;
        }
      }

      const fillCount = roleFillCount[role] || 0;
      const indices = roleIndexTracker[role] || [];
      if (indices[fillCount] !== undefined) {
        result[indices[fillCount]].name = name;
        roleFillCount[role] = fillCount + 1;
      }
    }

    i++;
  }

  // ELW bekommt immer denselben Namen wie LD 1
  const ld1Entry = result.find((r) => r.role === "LD 1");
  if (ld1Entry) {
    result.forEach((r) => {
      if (r.role === "ELW") {
        r.name = ld1Entry.name;
      }
    });
  }

  return result;
}

module.exports = { parseShiftArray };