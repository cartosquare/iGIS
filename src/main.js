// REST 服务
var serverProcess = require('child_process').spawn(__dirname + '/bin/node', [__dirname + '/server/server.js']);

// app and main window
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = require('electron').ipcMain;

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

  // 创建系统菜单
  if (process.platform == 'darwin') {
    var template = [{
      label: packageJson.name,
      submenu: [{
        label: '关于 ' + packageJson.name,
        selector: 'orderFrontStandardAboutPanel:'
      }, {
        type: 'separator'
      }, {
        label: '退出',
        accelerator: 'CmdOrCtrl+Q',
        selector: 'terminate:'
      }]
    }, {
      label: '编辑',
      submenu: [{
        label: '撤销',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      }, {
        label: '重做',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      }, {
        type: 'separator'
      }, {
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      }, {
        label: '拷贝',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      }, {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      }, {
        label: '全选',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      }]
    }, {
      label: '视图',
      submenu: [{
        label: '刷新',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          mainWindow.webContents.session.clearCache(function() {
            mainWindow.webContents.reloadIgnoringCache();
          });
        }
      }]
    }];
    var Menu = electron.Menu;
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }

  // 最大化窗口
  mainWindow.maximize();

  // dev状态下打开开发者工具
  if (packageJson.dev) {
    mainWindow.webContents.openDevTools();
  }

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'preloader.html'),
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

ipc.on('open-dashboard', function() {
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
});