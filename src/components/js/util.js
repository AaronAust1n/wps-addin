// WPS枚举值
const WPS_Enum = {
  wdFieldNoValue: true,
  msoCTPDockPositionLeft: 0,
  msoCTPDockPositionRight: 2
}

// 获取URL路径
function GetUrlPath() {
  let e = document.location.toString()
  return -1 != (e = decodeURI(e)).indexOf('/') && (e = e.substring(0, e.lastIndexOf('/'))), e
}

// 获取路由哈希
function GetRouterHash() {
  const hash = window.location.hash
  if (hash) {
    // 从哈希中去掉可能包含的路由信息，只保留#号前面的部分
    return hash.split('#')[0]
  }
  return ''
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