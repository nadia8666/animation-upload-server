const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("nodeServer", {
    submitCookie: (cookie) => ipcRenderer.send("submitCookie", cookie)
})