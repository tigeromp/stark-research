const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('arc', {
  platform: process.platform,
  version: '1.0.0',
})
