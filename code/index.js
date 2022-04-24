const { app, BrowserWindow } = require('electron')
 
function createWindow () {   
  // 创建浏览器窗口
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
 
  // 加载index.html文件
  win.loadFile('index.html')
}
 
 // 应用程序准备就绪后打开一个窗口
app.whenReady().then(createWindow)