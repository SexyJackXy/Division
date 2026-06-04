// pdfExtractor.js
// Ausgelagerte Logik: PDF lesen → Array extrahieren → JSON parsen
// Wird vom Renderer-Script aufgerufen

const pdfParse = require("pdf-parse-fork");
const { parseShiftArray } = require("./parseShift");

const reservedNames = [
  "ALvD", "DD", "LD 1", "LD2", "HLD", "EAL", "BvD", "LFüGr",
  "Schichtführer", "1. Dispo", "2. Dispo", "3. Dispo", "ELW", "FüAss",
  "Schw.Retter", "LF 1 Fü", "LF 1 Ma", "LF 1 ATF", "LF 1 ATM",
  "LF 1 WTF", "LF 1 WTM", "LF 2 Fü", "LF 2 Ma", "LF 2 ATF",
  "LF 2 ATM", "LF 2 WTF", "LF 2 WTM", "DLK Fü", "DLK Ma",
  "SOFA Fü", "SOFA Ma", "KEF Fü", "KEF Ma", "FwK Fü", "FwK Ma",
  "Kantine", "Wäsche", "Getränke", "ZAW", "ZSW", "Abrufschicht"
];

/**
 * Liest eine PDF-Datei als Buffer und gibt das befüllte Template zurück.
 * @param {Buffer} fileBuffer - Inhalt der PDF-Datei als Buffer
 * @returns {Promise<object[]>} - Befülltes Template-Array
 */
async function extractShiftFromPdf(fileBuffer) {
  const result = await pdfParse(fileBuffer);
  const extractedText = result.text;

  const regex = new RegExp(
    `(${reservedNames.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );

  const formattedText = extractedText.replace(regex, "\n$1\n");

  const lines = [];
  let i = 1;
  for (const line of formattedText.split("\n")) {
    if (line === "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
      continue;
    }
    lines.push(line);
    i++;
    if (i === 84) break;
  }

  return parseShiftArray(lines);
}

module.exports = { extractShiftFromPdf };
