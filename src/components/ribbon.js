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
  
  // 初始化调试控制台 (在开发模式下)
  const isDebugMode = true; // 可以根据环境变量或配置设置
  if (isDebugMode) {
    console.log('初始化WPS AI助手 - 调试模式');
    try {
      setTimeout(() => {
        Util.showDebugConsole();
      }, 2000); // 延迟2秒启动控制台，确保DOM已加载
    } catch (e) {
      console.error('初始化调试控制台失败:', e);
    }
  }
  
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
  console.log('尝试读取API配置...');
  
  if (!window.Application || !window.Application.PluginStorage) {
    console.error('PluginStorage不可用');
    return null;
  }
  
  const configStr = window.Application.PluginStorage.getItem('aiConfig')
  if (!configStr) {
    console.warn('未找到保存的配置');
    return null;
  }
  
  try {
    const config = JSON.parse(configStr);
    console.log('成功加载配置', { 
      apiUrl: config.apiUrl || '未设置', 
      model: config.models?.defaultModel || '未设置'
    });
    return config;
  } catch (e) {
    console.error('配置解析失败', e);
    return null;
  }
}

// 检查配置是否有效
function checkConfigured() {
  console.log('检查API配置...');
  
  const config = getConfig()
  if (!config) {
    console.error('未找到API配置');
    window.Application.Alert('请先配置API设置')
    handleSettings()
    return false
  }
  
  if (!config.apiUrl) {
    console.error('API URL未配置');
    window.Application.Alert('API地址未配置，请在设置中完成配置')
    handleSettings()
    return false
  }
  
  const defaultModel = config.models?.defaultModel;
  console.log('配置检查通过', { 
    apiUrl: config.apiUrl, 
    model: defaultModel || '未指定'
  });
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
  console.log(`开始处理选中文本: ${action}, 文本长度: ${text.length}`);
  const loadingDialog = showLoadingDialog(`WPS AI助手 - 正在${getActionName(action)}`)
  
  try {
    // 更新API客户端配置
    console.log('加载API配置');
    const config = getConfig()
    apiClient.updateConfig(config)
    console.log('API配置已更新', {
      apiUrl: config.apiUrl,
      model: config.models?.defaultModel || '未指定'
    });
    
    let result = ''
    
    // 根据动作调用不同API
    console.log(`调用API: ${action}`);
    switch (action) {
      case 'continue':
        result = await apiClient.continueText(text)
        console.log('文本续写完成，结果长度:', result.length);
        // 续写是在原文后添加内容
        insertTextAtCursor(result)
        break
      case 'proofread':
        result = await apiClient.proofreadText(text)
        console.log('文本校对完成，结果长度:', result.length);
        // 校对是替换原文
        insertTextAtCursor('\n' + result)
        break
      case 'polish':
        result = await apiClient.polishText(text)
        console.log('文本润色完成，结果长度:', result.length);
        // 润色是替换原文
        insertTextAtCursor('\n' + result)
        break
    }
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 显示提示消息
    window.Application.Alert(`${getActionName(action)}完成！请按Enter接受修改。`)
  } catch (e) {
    console.error(`${action}处理出错:`, e);
    // 关闭加载对话框
    closeDialog(loadingDialog)
    window.Application.Alert(`${getActionName(action)}失败: ${e.message}`)
  }
}

// 处理段落的通用方法
async function processParagraph(action, text) {
  console.log(`开始处理段落: ${action}, 文本长度: ${text.length}`);
  const loadingDialog = showLoadingDialog(`WPS AI助手 - 正在${getActionName(action)}`)
  
  try {
    // 更新API客户端配置
    console.log('加载API配置');
    const config = getConfig()
    apiClient.updateConfig(config)
    console.log('API配置已更新', {
      apiUrl: config.apiUrl,
      model: config.models?.defaultModel || '未指定'
    });
    
    let result = ''
    
    // 根据动作调用不同API
    console.log(`调用API: ${action}`);
    switch (action) {
      case 'continue':
        result = await apiClient.continueText(text)
        console.log('文本续写完成，结果长度:', result.length);
        // 续写是在原文后添加内容
        insertTextAtCursor(result)
        break
      case 'proofread':
        result = await apiClient.proofreadText(text)
        console.log('文本校对完成，结果长度:', result.length);
        // 校对是替换原文
        insertTextAtCursor('\n' + result)
        break
      case 'polish':
        result = await apiClient.polishText(text)
        console.log('文本润色完成，结果长度:', result.length);
        // 润色是替换原文
        insertTextAtCursor('\n' + result)
        break
    }
    
    // 关闭加载对话框
    closeDialog(loadingDialog)
    
    // 显示提示消息
    window.Application.Alert(`${getActionName(action)}完成！请按Enter接受修改。`)
  } catch (e) {
    console.error(`${action}处理出错:`, e);
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
  console.log('文档问答功能被触发');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开文档');
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法使用文档问答功能');
    return
  }
  
  try {
    // 创建侧边栏并导航到文档问答页面
    console.log('尝试创建文档问答侧边栏');
    const taskpaneUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/qa'
    console.log('侧边栏URL:', taskpaneUrl);
    
    const taskpane = createTaskpane(taskpaneUrl)
    
    if (taskpane) {
      console.log('文档问答侧边栏已创建成功');
    } else {
      console.error('创建文档问答侧边栏失败');
    }
  } catch (e) {
    console.error('文档问答功能出错:', e);
    window.Application.Alert('启动文档问答功能失败: ' + e.message);
  }
}

// 全文总结功能
function handleSummarizeDoc() {
  console.log('全文总结功能被触发');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开文档');
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法使用全文总结功能');
    return
  }
  
  try {
    // 创建侧边栏并导航到全文总结页面
    console.log('尝试创建全文总结侧边栏');
    const taskpaneUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/summary'
    console.log('侧边栏URL:', taskpaneUrl);
    
    const taskpane = createTaskpane(taskpaneUrl)
    
    if (taskpane) {
      console.log('全文总结侧边栏已创建成功');
    } else {
      console.error('创建全文总结侧边栏失败');
    }
  } catch (e) {
    console.error('全文总结功能出错:', e);
    window.Application.Alert('启动全文总结功能失败: ' + e.message);
  }
}

// 设置对话框
function handleSettings() {
  console.log('打开设置对话框');
  
  try {
    window.Application.ShowDialog(
      Util.GetUrlPath() + Util.GetRouterHash() + '/settings', // 修正路径从/dialog到/settings
      'WPS AI助手 - 设置',
      550,
      650,
      false
    )
    console.log('设置对话框已创建');
  } catch (e) {
    console.error('创建设置对话框失败:', e);
    window.Application.Alert('无法打开设置: ' + e.message);
  }
}

// 帮助信息
function handleHelp() {
  console.log('打开帮助对话框');
  
  try {
    window.Application.ShowDialog(
      Util.GetUrlPath() + Util.GetRouterHash() + '/help',
      'WPS AI助手 - 帮助',
      500,
      400,
      false
    )
    console.log('帮助对话框已创建');
  } catch (e) {
    console.error('创建帮助对话框失败:', e);
    window.Application.Alert('无法打开帮助: ' + e.message);
  }
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