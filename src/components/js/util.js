// WPS枚举值
const WPS_Enum = {
  wdFieldNoValue: true,
  msoCTPDockPositionLeft: 0,
  msoCTPDockPositionRight: 2
}

// 获取URL路径
function GetUrlPath() {
  // 在本地网页的情况下获取路径
  if (window.location.protocol === 'file:') {
    const path = window.location.href;
    // 删除文件名以获取根路径
    return path.substring(0, path.lastIndexOf('/'));
  }

  // 在非本地网页的情况下获取根路径
  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${hostname}${portPart}`;
}

// 获取路由哈希
function GetRouterHash() {
  if (window.location.protocol === 'file:') {
    return '';
  }

  return '/#'
}

// 格式化AI响应文本
function FormatAIResponse(text) {
  // 清理文本，移除不必要的前缀和换行符
  if (!text) return ''
  text = text.trim()
  if (text.startsWith('```') && text.endsWith('```')) {
    text = text.substring(3, text.length - 3).trim()
  }
  return text
}

// 获取选中文本
function GetSelectedText() {
  if (!window.Application || !window.Application.ActiveDocument) {
    return ''
  }
  
  try {
    return window.Application.ActiveDocument.Application.Selection.Text
  } catch (e) {
    console.error('获取选中文本失败:', e)
    return ''
  }
}

// 获取文档全文
function GetDocumentText() {
  if (!window.Application || !window.Application.ActiveDocument) {
    return ''
  }
  
  try {
    return window.Application.ActiveDocument.Content.Text
  } catch (e) {
    console.error('获取文档全文失败:', e)
    return ''
  }
}

// 向文档插入文本
function InsertTextToDocument(text) {
  if (!window.Application || !window.Application.ActiveDocument) {
    return false
  }
  
  try {
    window.Application.ActiveDocument.Application.Selection.TypeText(text)
    return true
  } catch (e) {
    console.error('插入文本失败:', e)
    return false
  }
}

// 替换选中文本
function ReplaceSelectedText(text) {
  if (!window.Application || !window.Application.ActiveDocument) {
    return false
  }
  
  try {
    window.Application.ActiveDocument.Application.Selection.Text = text
    return true
  } catch (e) {
    console.error('替换文本失败:', e)
    return false
  }
}

// 显示调试控制台
function showDebugConsole() {
  // 如果已存在则不重复创建
  if (document.getElementById('debug-console')) {
    return;
  }

  const debugConsole = document.createElement('div');
  debugConsole.id = 'debug-console';
  debugConsole.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 400px;
    height: 300px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    overflow: auto;
    z-index: 9999;
    border: 1px solid #444;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
  `;
  
  const title = document.createElement('span');
  title.textContent = 'WPS AI助手调试控制台';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = `
    background: #555;
    border: none;
    color: white;
    padding: 2px 5px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => debugConsole.remove();
  
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '清空';
  clearBtn.style.cssText = `
    background: #555;
    border: none;
    color: white;
    padding: 2px 5px;
    margin-right: 5px;
    cursor: pointer;
  `;
  clearBtn.onclick = () => {
    const logArea = document.getElementById('debug-log-area');
    if (logArea) logArea.innerHTML = '';
  };
  
  const controls = document.createElement('div');
  controls.appendChild(clearBtn);
  controls.appendChild(closeBtn);
  
  header.appendChild(title);
  header.appendChild(controls);
  
  const logArea = document.createElement('div');
  logArea.id = 'debug-log-area';
  logArea.style.cssText = `height: calc(100% - 30px); overflow-y: auto;`;
  
  debugConsole.appendChild(header);
  debugConsole.appendChild(logArea);
  
  document.body.appendChild(debugConsole);
  
  // 重写console方法
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = function() {
    originalLog.apply(console, arguments);
    logToDebugConsole('log', arguments);
  };
  
  console.error = function() {
    originalError.apply(console, arguments);
    logToDebugConsole('error', arguments);
  };
  
  console.warn = function() {
    originalWarn.apply(console, arguments);
    logToDebugConsole('warn', arguments);
  };
  
  // 添加全局错误处理
  window.onerror = function(message, source, lineno, colno, error) {
    logToDebugConsole('error', [`全局错误: ${message}`, `位置: ${source}:${lineno}:${colno}`, error]);
    return false;
  };
  
  function logToDebugConsole(type, args) {
    const logArea = document.getElementById('debug-log-area');
    if (!logArea) return;
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid #333';
    entry.style.padding = '3px 0';
    
    // 添加时间戳
    const timestamp = new Date().toLocaleTimeString();
    const timeElement = document.createElement('span');
    timeElement.textContent = `[${timestamp}] `;
    timeElement.style.color = '#aaa';
    entry.appendChild(timeElement);
    
    // 添加类型标签
    const typeElement = document.createElement('span');
    typeElement.textContent = `[${type.toUpperCase()}] `;
    
    if (type === 'error') {
      typeElement.style.color = '#ff5555';
    } else if (type === 'warn') {
      typeElement.style.color = '#ffcc00';
    } else {
      typeElement.style.color = '#55ff55';
    }
    
    entry.appendChild(typeElement);
    
    // 添加内容
    const content = document.createElement('span');
    Array.from(args).forEach((arg, index) => {
      let text = '';
      
      if (typeof arg === 'object' && arg !== null) {
        try {
          text = JSON.stringify(arg, null, 2);
        } catch (e) {
          text = arg.toString();
        }
      } else {
        text = String(arg);
      }
      
      if (index > 0) {
        content.appendChild(document.createElement('br'));
      }
      
      content.appendChild(document.createTextNode(text));
    });
    
    entry.appendChild(content);
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight; // 滚动到底部
  }
  
  console.log('调试控制台已启动');
  
  return debugConsole;
}

export default {
  WPS_Enum,
  GetUrlPath,
  GetRouterHash,
  FormatAIResponse,
  GetSelectedText,
  GetDocumentText,
  InsertTextToDocument,
  ReplaceSelectedText,
  showDebugConsole
} 