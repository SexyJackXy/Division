const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Bestehend
  runBuild: () => ipcRenderer.invoke("run-build"),

  // Neu: PDF-Schicht als JSON speichern
  saveJson: (jsonString) => ipcRenderer.invoke("save-json", jsonString),
});
