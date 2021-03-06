const {app, BrowserWindow, globalShortcut} = require('electron')

var win;

function createWindow() {
    // 创建浏览器窗口
    win = new BrowserWindow({
        width: 800,
        height: 700,
        resizable: false,//禁止缩放
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    require('@electron/remote/main').initialize(); // 初始化
    require('@electron/remote/main').enable(win.webContents);
    // 加载index.html文件
    win.loadFile('index.html');
    win.setMenu(null);//去除上面一排按钮
}

// 应用程序准备就绪后打开一个窗口
app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+Shift+i', function () {
        win.webContents.openDevTools()
    });
    createWindow();
});
