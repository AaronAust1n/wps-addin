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
    case 'btnSummarizeText':
      handleSummarizeText()
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

// 替换选中文本
function replaceSelectedText(newText) {
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection) {
      selection.Text = newText
      return true
    }
    return false
  } catch (e) {
    console.error('替换文本失败:', e)
    window.Application.Alert('替换文本失败: ' + e.message)
    return false
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
  
  const selectedText = getSelectedText()
  if (!selectedText) return
  
  const loadingDialog = showLoadingDialog('WPS AI助手 - 正在续写文本')
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    // 调用API续写文本
    const result = await apiClient.continueText(selectedText)
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 将结果替换选中文本
    if (result) {
      const combinedText = selectedText + result
      replaceSelectedText(combinedText)
      window.Application.Alert('文本续写完成！')
    }
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert('文本续写失败: ' + e.message)
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
  
  const selectedText = getSelectedText()
  if (!selectedText) return
  
  const loadingDialog = showLoadingDialog('WPS AI助手 - 正在校对文本')
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    // 调用API校对文本
    const result = await apiClient.proofreadText(selectedText)
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 将结果替换选中文本
    if (result) {
      replaceSelectedText(result)
      window.Application.Alert('文本校对完成！')
    }
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert('文本校对失败: ' + e.message)
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
  
  const selectedText = getSelectedText()
  if (!selectedText) return
  
  const loadingDialog = showLoadingDialog('WPS AI助手 - 正在润色文本')
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    // 调用API润色文本
    const result = await apiClient.polishText(selectedText)
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 将结果替换选中文本
    if (result) {
      replaceSelectedText(result)
      window.Application.Alert('文本润色完成！')
    }
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert('文本润色失败: ' + e.message)
  }
}

// 文本摘要功能
async function handleSummarizeText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  const selectedText = getSelectedText()
  if (!selectedText) return
  
  const loadingDialog = showLoadingDialog('WPS AI助手 - 正在生成摘要')
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    // 调用API生成摘要
    const result = await apiClient.summarizeText(selectedText)
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 询问用户是否替换选中文本
    if (result) {
      if (window.Application.Confirm('摘要生成成功，是否替换选中文本？\n\n' + result)) {
        replaceSelectedText(result)
      }
    }
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert('生成摘要失败: ' + e.message)
  }
}

// 全文总结功能
async function handleSummarizeDoc() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  const docText = getDocumentText()
  if (!docText) return
  
  const loadingDialog = showLoadingDialog('WPS AI助手 - 正在生成全文总结')
  
  try {
    // 更新API客户端配置
    const config = getConfig()
    apiClient.updateConfig(config)
    
    // 调用API生成全文总结
    const result = await apiClient.summarizeDocument(docText)
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 询问用户是如何处理结果
    if (result) {
      if (window.Application.Confirm('全文总结生成成功，是否插入到文档末尾？\n\n' + result)) {
        // 插入到文档末尾
        const selection = window.Application.ActiveDocument.Range
        selection.Collapse(false) // 折叠到末尾
        selection.InsertBefore('\n\n## 文档总结\n\n' + result + '\n')
      }
    }
  } catch (e) {
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert('生成全文总结失败: ' + e.message)
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
    case 'btnSummarizeText':
      return 'images/text_summarize.svg'
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