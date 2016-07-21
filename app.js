const electron = require('electron');
const {BrowserWindow,app} = electron;
global.windows = {mainWindow: null};
global.lang = 'english';
let windows = global.windows;
function newWin() {
  windows.mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    show: false,
    backgroundColor: '#ddd',
    title: 'Skedit',
    disableAutoHideCursor: true,
    minWidth: 700,
    minHeight: 500
  });
  windows.mainWindow.on('closed', () => {
    windows.mainWindow= null;
  });
  windows.mainWindow.loadURL('file://' + __dirname + '/index.html');
};
app.on('ready', newWin);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (windows.mainWindow=== null) {
    newWin();
  }
});
