import Util from './js/util.js'

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

// 显示任务窗格
function showTaskPane() {
  let tsId = window.Application.PluginStorage.getItem('taskpane_id')
  if (!tsId) {
    let tskpane = window.Application.CreateTaskPane(Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane')
    let id = tskpane.ID
    window.Application.PluginStorage.setItem('taskpane_id', id)
    tskpane.Visible = true
  } else {
    let tskpane = window.Application.GetTaskPane(tsId)
    tskpane.Visible = true
  }
}

// 文本续写功能
function handleContinueText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  showTaskPane()
}

// 文本校对功能
function handleProofreadText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  showTaskPane()
}

// 文本润色功能
function handlePolishText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  showTaskPane()
}

// 文本摘要功能
function handleSummarizeText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  showTaskPane()
}

// 全文总结功能
function handleSummarizeDoc() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  showTaskPane()
}

// 设置对话框
function handleSettings() {
  window.Application.ShowDialog(
    Util.GetUrlPath() + Util.GetRouterHash() + '/dialog',
    'WPS AI助手 - 设置',
    450,
    400,
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