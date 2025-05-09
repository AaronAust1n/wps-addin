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

export default {
  WPS_Enum,
  GetUrlPath,
  GetRouterHash,
  FormatAIResponse,
  GetSelectedText,
  GetDocumentText,
  InsertTextToDocument,
  ReplaceSelectedText
} 