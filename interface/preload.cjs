const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script running');
console.log('Exposing electronAPI...');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => {
    console.log('Ping called from renderer');
    return ipcRenderer.invoke('ping');
  },
  loadAgenda: () => ipcRenderer.invoke('load-agenda'),
  saveAgenda: (events) => ipcRenderer.invoke('save-agenda', events),
  // Add email functionality
  fetchEmails: () => ipcRenderer.invoke('fetch-emails'),
  sendEmail: (to, subject, body) => ipcRenderer.invoke('send-email', { to, subject, body })
});

// Expose electron IPC for frame-to-frame communication
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      // Whitelist channels
      const validChannels = ['frame-message'];
      if (validChannels.includes(channel)) {
        console.log(`Sending to channel ${channel}:`, data);
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      // Whitelist channels that start with 'frame-' or 'console-'
      if (channel.startsWith('frame-') || channel === 'console-log') {
        console.log(`Setting up listener for channel: ${channel}`);
        // Strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => {
          console.log(`Received on channel ${channel}:`, args);
          func(...args);
        });
      }
    },
    removeAllListeners: (channel) => {
      if (channel.startsWith('frame-') || channel === 'console-log') {
        console.log(`Removing listeners for channel: ${channel}`);
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
});

console.log('Preload script finished');
