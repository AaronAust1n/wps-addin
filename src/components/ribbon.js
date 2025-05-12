import Util from './js/util.js'
import apiClient from './js/api.js'

// 这个函数在整个wps加载项中是第一个执行的
function OnAddinLoad(ribbonUI) {
  if (typeof window.Application.ribbonUI != 'object') {
    window.Application.ribbonUI = ribbonUI
  }

  if (typeof window.Application.Enum != 'object') {
    // 如果没有内置枚举值
    window.Application.Enum = Util.WPS_Enum
  }

  window.Util = Util
  window.Application.PluginStorage.setItem('EnableFlag', true) // 设置插件启用标记
  console.log('WPS AI助手加载项已加载')
  return true
}

function OnAction(control) {
  const eleId = control.Id
  switch (eleId) {
    case 'btnContinueText':
      handleContinueText()
      break
    case 'btnProofreadText':
      handleProofreadText()
      break
    case 'btnPolishText':
      handlePolishText()
      break
    case 'btnDocumentQA':
      handleDocumentQA()
      break
    case 'btnSummarizeDoc':
      handleSummarizeDoc()
      break
    case 'btnSettings':
      handleSettings()
      break
    case 'btnHelp':
      handleHelp()
      break
    default:
      break
  }
  return true
}

// 获取配置
function getConfig() {
  if (window.Application && window.Application.PluginStorage) {
    const configStr = window.Application.PluginStorage.getItem('aiConfig')
    if (configStr) {
      try {
        return JSON.parse(configStr)
      } catch (e) {
        console.error('配置加载失败', e)
      }
    }
  }
  return null
}

// 检查配置是否有效
function checkConfigured() {
  const config = getConfig()
  if (!config || !config.apiUrl) {
    window.Application.Alert('请先配置API设置')
    handleSettings()
    return false
  }
  return true
}

// 获取选中文本
function getSelectedText() {
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection) {
      return selection.Text
    } else {
      window.Application.Alert('未选择任何文本')
      return null
    }
  } catch (e) {
    console.error('获取选中文本失败:', e)
    window.Application.Alert('获取选中文本失败: ' + e.message)
    return null
  }
}

// 获取光标所在段落
function getCurrentParagraph() {
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection) {
      const paragraph = selection.Paragraphs(1)
      return paragraph.Range.Text
    } else {
      return null
    }
  } catch (e) {
    console.error('获取段落失败:', e)
    return null
  }
}

// 获取整个文档文本
function getDocumentText() {
  try {
    const doc = window.Application.ActiveDocument
    if (doc) {
      const range = doc.Range()
      return range.Text
    } else {
      window.Application.Alert('无法获取文档内容')
      return null
    }
  } catch (e) {
    console.error('获取文档内容失败:', e)
    window.Application.Alert('获取文档内容失败: ' + e.message)
    return null
  }
}

// 在光标位置插入文本
function insertTextAtCursor(text) {
  try {
    const selection = window.Application.ActiveDocument.Range
    selection.Collapse() // 确保光标折叠（不是选区）
    selection.InsertAfter(text)
    return true
  } catch (e) {
    console.error('插入文本失败:', e)
    window.Application.Alert('插入文本失败: ' + e.message)
    return false
  }
}

// 创建侧边栏
function createTaskpane(url, width = 300) {
  try {
    const taskpane = window.Application.CreateTaskPane()
    taskpane.DockPosition = window.Application.Enum.msoCTPDockPositionRight
    taskpane.Width = width
    taskpane.Visible = true
    taskpane.Navigate(url)
    return taskpane
  } catch (e) {
    console.error('创建侧边栏失败:', e)
    window.Application.Alert('创建侧边栏失败: ' + e.message)
    return null
  }
}

// 显示加载对话框
function showLoadingDialog(message) {
  if (window.Application) {
    return window.Application.ShowDialog(
      Util.GetUrlPath() + Util.GetRouterHash() + '/loading',
      message || 'WPS AI助手 - 正在处理',
      300,
      150,
      false
    )
  }
  return null
}

// 关闭对话框
function closeDialog(dialogId) {
  if (window.Application && dialogId) {
    window.Application.CloseDialog(dialogId)
  }
}

// 文本续写功能
async function handleContinueText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 检查是否有选中文本
  const selectedText = getSelectedText()
  if (!selectedText) {
    // 如果没有选中文本，使用光标所在段落
    const paragraph = getCurrentParagraph()
    if (!paragraph) {
      window.Application.Alert('请先选择文本或将光标放置在段落中')
      return
    }
    
    // 使用段落进行续写
    processParagraph('continue', paragraph)
  } else {
    // 使用选中文本进行续写
    processSelection('continue', selectedText)
  }
}

// 文本校对功能
async function handleProofreadText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 检查是否有选中文本
  const selectedText = getSelectedText()
  if (!selectedText) {
    // 如果没有选中文本，使用光标所在段落
    const paragraph = getCurrentParagraph()
    if (!paragraph) {
      window.Application.Alert('请先选择文本或将光标放置在段落中')
      return
    }
    
    // 校对段落
    processParagraph('proofread', paragraph)
  } else {
    // 校对选中文本
    processSelection('proofread', selectedText)
  }
}

// 文本润色功能
async function handlePolishText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 检查是否有选中文本
  const selectedText = getSelectedText()
  if (!selectedText) {
    // 如果没有选中文本，使用光标所在段落
    const paragraph = getCurrentParagraph()
    if (!paragraph) {
      window.Application.Alert('请先选择文本或将光标放置在段落中')
      return
    }
    
    // 润色段落
    processParagraph('polish', paragraph)
  } else {
    // 润色选中文本
    processSelection('polish', selectedText)
  }
}

// 处理选中文本的通用方法
async function processSelection(action, text) {
  const loadingDialog = showLoadingDialog(`WPS AI助手 - 正在${getActionName(action)}`)
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    let result = ''
    
    // 根据动作调用不同API
    switch (action) {
      case 'continue':
        result = await apiClient.continueText(text)
        // 续写是在原文后添加内容
        insertTextAtCursor(result)
        break
      case 'proofread':
        result = await apiClient.proofreadText(text)
        // 校对是替换原文
        insertTextAtCursor('\n' + result)
        break
      case 'polish':
        result = await apiClient.polishText(text)
        // 润色是替换原文
        insertTextAtCursor('\n' + result)
        break
    }
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 显示提示消息
    window.Application.Alert(`${getActionName(action)}完成！请按Enter接受修改。`)
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert(`${getActionName(action)}失败: ${e.message}`)
  }
}

// 处理段落的通用方法
async function processParagraph(action, text) {
  const loadingDialog = showLoadingDialog(`WPS AI助手 - 正在${getActionName(action)}`)
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    let result = ''
    
    // 根据动作调用不同API
    switch (action) {
      case 'continue':
        result = await apiClient.continueText(text)
        // 续写是在原文后添加内容
        insertTextAtCursor(result)
        break
      case 'proofread':
        result = await apiClient.proofreadText(text)
        // 校对是替换原文
        insertTextAtCursor('\n' + result)
        break
      case 'polish':
        result = await apiClient.polishText(text)
        // 润色是替换原文
        insertTextAtCursor('\n' + result)
        break
    }
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 显示提示消息
    window.Application.Alert(`${getActionName(action)}完成！请按Enter接受修改。`)
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert(`${getActionName(action)}失败: ${e.message}`)
  }
}

// 获取操作名称
function getActionName(action) {
  switch (action) {
    case 'continue':
      return '文本续写'
    case 'proofread':
      return '文本校对'
    case 'polish':
      return '文本润色'
    default:
      return '处理'
  }
}

// 文档问答功能
function handleDocumentQA() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 创建侧边栏并导航到文档问答页面
  const taskpaneUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/qa'
  const taskpane = createTaskpane(taskpaneUrl)
  
  if (taskpane) {
    console.log('文档问答侧边栏已创建')
  }
}

// 全文总结功能
function handleSummarizeDoc() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 创建侧边栏并导航到全文总结页面
  const taskpaneUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/summary'
  const taskpane = createTaskpane(taskpaneUrl)
  
  if (taskpane) {
    console.log('全文总结侧边栏已创建')
  }
}

// 设置对话框
function handleSettings() {
  window.Application.ShowDialog(
    Util.GetUrlPath() + Util.GetRouterHash() + '/dialog',
    'WPS AI助手 - 设置',
    450,
    600,
    false
  )
}

// 帮助信息
function handleHelp() {
  window.Application.Alert('WPS AI助手\n版本: 1.0.0\n作者: AI助手开发团队\n\n如需帮助，请联系客服。')
}

function GetImage(control) {
  const eleId = control.Id
  switch (eleId) {
    case 'btnContinueText':
      return 'images/text_continue.svg'
    case 'btnProofreadText':
      return 'images/text_proofread.svg'
    case 'btnPolishText':
      return 'images/text_polish.svg'
    case 'btnDocumentQA':
      return 'images/qa.svg'
    case 'btnSummarizeDoc':
      return 'images/doc_summarize.svg'
    case 'btnSettings':
      return 'images/settings.svg'
    case 'btnHelp':
      return 'images/help.svg'
    default:
      return 'images/icon.svg'
  }
}

function OnGetEnabled(control) {
  return true
}

function OnGetVisible(control) {
  return true
}

function OnGetLabel(control) {
  return ''
}

// 这些函数是给wps客户端调用的
export default {
  OnAddinLoad,
  OnAction,
  GetImage,
  OnGetEnabled,
  OnGetVisible,
  OnGetLabel
} 