const fs = require("fs-extra");
const pdf = require("pdf-parse");
const ExcelJS = require("exceljs");
const path = require("path");

async function runBuild() {
  let i = 0;
  const pdfPath = path.join(__dirname, "..", "Einteilung", "Einteilung 11.05.2026.pdf");
  const logPath = path.join(__dirname, "..", "structedSeating");
  const template = path.join(__dirname, "..", "Sieda_template.xlsx");
  let outputFile = `output${i}.txt`;

  const mapping = {
    2:"B1",4:"F1",6:"F2",9:"F3",12:"F4",15:"F5",18:"F6",20:"F7",23:"F8",26:"F9",30:"F10",33:"F11",36:"F12",
    40:"B2",43:"B3",45:"B4",49:"B5",52:"B6",56:"B7",57:"B8",58:"B9",65:"B10",66:"B11",67:"B12",68:"B13",
    69:"B14",70:"B15",79:"B16",80:"B17",85:"B18",86:"B19",92:"B20",93:"B21",98:"B22",99:"B23",
    104:"B25",105:"B26",108:"B27",111:"B28",114:"B29",117:"B30",120:"B32"
  };

  await fs.ensureDir(logPath);

  const dataBuffer = await fs.readFile(pdfPath);
  let text = (await pdf(dataBuffer)).text;

  const start = text.indexOf("LD 1");
  if (start >= 0) text = text.substring(start);

  text = text
    .replace(/\x07/g, "")
    .replace(/\t/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n---\n")
    .replace(/([A-Za-zÄÖÜäöüß\-]+,\s[A-Za-zÄÖÜäöüß\-]+)\s(?=[A-Za-zÄÖÜäöüß\-]+,\s[A-Za-zÄÖÜäöüß\-]+)/g, "$1\n");

  const lines = text.split("\n");
  const cleanedLines = [];
  const removedNames = [];
  let skip = false;

  for (const line of lines) {
    if (/Frei/.test(line)) { skip = true; continue; }
    if (skip) {
      if (line === "---") { skip = false; continue; }
      if (/.+,\s.+/.test(line)) removedNames.push(line);
      continue;
    }
    cleanedLines.push(line);
  }

  const sortedKeys = Object.keys(mapping).map(Number).sort((a,b)=>a-b);

  for (const lineNumber of sortedKeys) {
    const idx = lineNumber - 1;
    if (idx >= cleanedLines.length) continue;
    if (!cleanedLines[idx].includes(",")) {
      for (let j = cleanedLines.length - 1; j > idx; j--) {
        cleanedLines[j] = cleanedLines[j - 1];
      }
      cleanedLines[idx] = " ";
    }
  }

  while (await fs.pathExists(path.join(logPath, outputFile))) {
    i++;
    outputFile = `output${i}.txt`;
  }

  const textOut = cleanedLines.join("\n");
  const outputTxtPath = path.join(logPath, outputFile);
  await fs.writeFile(outputTxtPath, textOut, "utf8");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(template);
  const sheet = workbook.worksheets[0];

  const fileLines = (await fs.readFile(outputTxtPath, "utf8")).split("\n");

  for (const lineNumber of sortedKeys) {
    sheet.getCell(mapping[lineNumber]).value = fileLines[lineNumber - 1] || "";
  }

  let row = 13;
  for (const name of removedNames) {
    if (row > 23) break;
    sheet.getCell(`F${row}`).value = name;
    row++;
  }

  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const outputExcel = path.join(logPath, `structedSeating_${dateStr}.xlsx`);
  await workbook.xlsx.writeFile(outputExcel);

  return `Fertig!\nTXT: ${outputFile}\nExcel: structedSeating_${dateStr}.xlsx`;
}

module.exports = { runBuild };
