const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  runBuild: () => ipcRenderer.invoke("run-build")
});
