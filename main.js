const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { runBuild } = require("./scripts/build");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "scripts", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "views", "index.html"));
}

ipcMain.handle("run-build", async () => {
  return runBuild();
});

ipcMain.handle("save-json", async (event, jsonString) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: "Schicht speichern",
    defaultPath: "schicht.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (canceled || !filePath) return { success: false };

  fs.writeFileSync(filePath, jsonString, "utf-8");
  return { success: true, filePath };
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
