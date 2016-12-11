// REST 服务
var serverProcess = require('child_process').spawn(__dirname + '/bin/node', [__dirname + '/server/server.js']);

// app and main window
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var path = require('path');
var url = require('url');
var fs = require('fs');

var packageJsonPath = __dirname + '/package.json';
var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    "icon": __dirname + "/app.png",
    "title": packageJson.name,
    width: 1000, height: 600,
    min_width: 800,
    min_height: 400,
    max_width: 8000,
    max_height: 4000,
    "web-preferences": {
      "web-security": false
    }
  });

  // dev状态下打开开发者工具
  if (packageJson.dev) {
    mainWindow.webContents.openDevTools();
  }

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    serverProcess.kill();
    
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
