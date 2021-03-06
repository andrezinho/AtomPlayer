const electron = require('electron');
// Module to control application life.
const {app, globalShortcut} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;

const ipcMain = electron.ipcMain

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({icon: __dirname + '/icono.ico', width: 800, height: 600, frame: false, resizable: false});

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.on("minimize", function (){
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    if(win.getSize()[0] == 386 && win.getSize()[1] == 75){
      win.show();
    }
  });

  //Toogle Basic and full mode
  ipcMain.on('toogleMode', function(eventRet, arg) {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    if(win.getSize()[0] == 800 && win.getSize()[1] == 600){
      win.setSize(386, 75, true);
      win.setAlwaysOnTop(true);
      win.setPosition(width-386, height-75);
    }else{
      win.setSize(800, 600, true);
      win.setAlwaysOnTop(false);
      win.setPosition(width/2-400, height/2-300);
    }
    eventRet.returnValue = '1'
  });

  //Open Settings Window
  var settingsWindow;
  ipcMain.on('openSettings', function(eventRet, arg) {
    var settingsWindow = new BrowserWindow({
      parent: win,
      width: 500,
      height: 400,
      show: false,
      resizable: false,
      movable: false,
      alwaysOnTop: false,
      frame: false
    });
    settingsWindow.loadURL(`file://${__dirname}/settings.html`);
    settingsWindow.show();
    settingsWindow.webContents.openDevTools();
    settingsWindow.on('closed', function() {
      settingsWindow = null;
    });
    eventRet.returnValue = '1';
  });

  //support prompt()
  var promptResponse;
  ipcMain.on('prompt', function(eventRet, arg) {
    promptResponse = null;
    var promptWindow = new BrowserWindow({
      width: 400,
      height: 100,
      show: false,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      frame: false
    });
    arg.val = arg.val || '';
    const promptHtml = '<label for="val">' + arg.title + '</label><input id="val" value="' + arg.val + '" autofocus /><button onclick="require(\'electron\').ipcRenderer.send(\'prompt-response\', document.getElementById(\'val\').value);window.close()">Aceptar</button><button onclick="window.close()">Cancelar</button><style>body {font-family: sans-serif;} button {float:right; margin-left: 10px;} label,input {margin-bottom: 10px; width: 100%; display:block;}</style>';
    promptWindow.loadURL('data:text/html,' + promptHtml);
    promptWindow.show();
    promptWindow.on('closed', function() {
      eventRet.returnValue = promptResponse;
      promptWindow = null;
    });
  });

  ipcMain.on('prompt-response', function(event, arg) {
    if (arg === ''){ arg = null }
    promptResponse = arg;
  });

  //Register shortcut
  ipcMain.on('registerShortcut', function(event, arg) {
    console.log(arg.key, arg.channel);
    var response = "1";
    try {
      var shortcut = globalShortcut.register(arg.key, () => {
        win.webContents.send(arg.channel, true);
      });
      if (!shortcut) {
        response = "0";
        console.log('shortcut failed' + arg[0]);
      }
    }catch(err) {
      response = "0";
      console.log(err);
    }
    event.returnValue = response;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

//For experimental features
var options = [
  //'enable-tcp-fastopen',
  //'enable-experimental-canvas-features',
  'enable-experimental-web-platform-features',
  //'enable-overlay-scrollbars',
  //'enable-hardware-overlays',
  //'enable-universal-accelerated-overflow-scroll',
  //'allow-file-access-from-files',
  //'allow-insecure-websocket-from-https-origin',
  ['js-flags', '--harmony_collections']
];

for(var i=0; i < options.length; ++i) {
  if (typeof options[i] === 'string')
  app.commandLine.appendSwitch(options[i]);
  else
  app.commandLine.appendSwitch(options[i][0], options[i][1]);
}
