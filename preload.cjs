const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

// In your main.js, specify the preload path like so:
// preload: path.join(__dirname, 'preload.js') // Stays if preload.js is in interface/