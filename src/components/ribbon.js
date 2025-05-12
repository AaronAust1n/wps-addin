import Util from './js/util.js'
import apiClient from './js/api.js'

// 这个函数在整个wps加载项中是第一个执行的
function OnAddinLoad(ribbonUI) {
  console.log('WPS AI助手加载项正在加载...')
  try {
    if (typeof window.Application.ribbonUI != 'object') {
      window.Application.ribbonUI = ribbonUI
    }

    if (typeof window.Application.Enum != 'object') {
      // 如果没有内置枚举值
      window.Application.Enum = Util.WPS_Enum
    }

    window.Util = Util
    window.Application.PluginStorage.setItem('EnableFlag', true) // 设置插件启用标记
    console.log('WPS AI助手加载项已加载成功')
    return true
  } catch (e) {
    console.error('加载项初始化失败:', e)
    return false
  }
}

function OnAction(control) {
  console.log('接收到按钮点击事件:', control.Id)
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
      console.warn('未处理的按钮ID:', eleId)
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
    if (selection && selection.Text.trim()) {
      return selection.Text
    } else {
      window.Application.Alert('请先选择要处理的文本')
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

// 插入文本到光标位置
function insertTextAtCursor(text) {
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection) {
      selection.InsertAfter(text)
      return true
    }
    return false
  } catch (e) {
    console.error('插入文本失败:', e)
    window.Application.Alert('插入文本失败: ' + e.message)
    return false
  }
}

// 显示Copilot风格的侧边栏
function showCopilotPanel(title, prompt, operation, selectedText = '') {
  if (!window.Application) {
    console.error('无法访问WPS Application对象')
    return
  }

  // 确保数据不为空
  if (!selectedText || selectedText.trim() === '') {
    window.Application.Alert('无法获取文本内容')
    return
  }

  console.log('显示侧边栏', title, operation, selectedText.substring(0, 50) + '...')

  // 创建一个唯一的数据ID
  const tempDataId = 'ai_copilot_temp_data_' + Date.now()
  
  // 准备数据
  const tempData = {
    title: title,
    prompt: prompt,
    operation: operation,
    selectedText: selectedText,
    config: getConfig(),
    initial: false  // 确保初始化标记正确设置
  }

  // 保存临时数据到浏览器存储
  sessionStorage.setItem(tempDataId, JSON.stringify(tempData))
  
  // 构建侧边栏URL
  const copilotUrl = `${Util.GetUrlPath()}${Util.GetRouterHash()}/copilot?id=${tempDataId}`
  
  // 打开Copilot侧边栏
  try {
    // 尝试获取现有侧边栏ID
    let tsId = window.Application.PluginStorage.getItem('copilot_panel_id')
    
    if (!tsId) {
      // 如果没有现有ID，创建新的任务窗格
      let tskpane = window.Application.CreateTaskPane(copilotUrl)
      if (tskpane) {
        let id = tskpane.ID
        window.Application.PluginStorage.setItem('copilot_panel_id', id)
        tskpane.Visible = true
        console.log('创建新的侧边栏成功, ID:', id)
      } else {
        throw new Error('无法创建任务面板')
      }
    } else {
      // 如果有现有ID，尝试重用
      try {
        let tskpane = window.Application.GetTaskPane(tsId)
        if (tskpane) {
          tskpane.Navigate(copilotUrl)
          tskpane.Visible = true
          console.log('导航到现有侧边栏成功')
        } else {
          throw new Error('无法获取现有任务面板')
        }
      } catch (e) {
        console.error('导航到现有侧边栏失败:', e)
        // 如果重用失败，创建新的窗格
        let tskpane = window.Application.CreateTaskPane(copilotUrl)
        if (tskpane) {
          let id = tskpane.ID
          window.Application.PluginStorage.setItem('copilot_panel_id', id)
          tskpane.Visible = true
          console.log('创建新的侧边栏成功(备选), ID:', id)
        } else {
          throw new Error('无法创建任务面板(备选)')
        }
      }
    }
  } catch (e) {
    console.error('侧边栏创建失败:', e)
    window.Application.Alert('侧边栏创建失败: ' + e.message)
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
function handleContinueText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  let selectedText = '';
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection && selection.Text.trim()) {
      // 有选中文本
      selectedText = selection.Text
    } else {
      // 没有选中文本，获取光标所在段落
      const currentParagraph = window.Application.ActiveDocument.Range.Paragraphs.Item(1);
      if (currentParagraph) {
        selectedText = currentParagraph.Range.Text;
      } else {
        window.Application.Alert('无法获取当前段落文本')
        return
      }
    }
  } catch (e) {
    console.error('获取文本失败:', e)
    window.Application.Alert('获取文本失败: ' + e.message)
    return
  }
  
  // 显示加载对话框
  const loadingId = showLoadingDialog('正在续写文本...')
  
  // 更新API客户端配置
  const config = getConfig()
  if (!config) {
    closeDialog(loadingId)
    window.Application.Alert('无法获取API配置')
    return
  }
  
  apiClient.updateConfig(config)
  
  // 调用API续写文本
  apiClient.continueText(selectedText)
    .then(result => {
      closeDialog(loadingId)
      if (result) {
        try {
          const selection = window.Application.ActiveDocument.Range
          // 记录原始文本位置
          const originalStartPosition = selection.Start
          const originalEndPosition = selection.End
          
          // 在光标位置插入修改后内容
          selection.InsertAfter('\n' + result)
          
          // 显示提示
          window.Application.Alert('续写完成，按Enter键确认接受修改')
          
          // 使用WPS ApiEvent
          if (window.Application.ApiEvent) {
            const enterHandler = function(param) {
              // 如果按下的是Enter键
              if (param.KeyCode === 13) {
                try {
                  // 获取原始文本范围
                  const originalRange = window.Application.ActiveDocument.Range(originalStartPosition, originalEndPosition)
                  // 删除原始文本
                  originalRange.Delete()
                  
                  // 移除事件监听
                  window.Application.ApiEvent.RemoveApiEventListener('KeyDown', enterHandler)
                  
                  // 返回true表示已处理该事件
                  return true
                } catch (e) {
                  console.error('删除原始文本失败:', e)
                  window.Application.Alert('删除原始文本失败: ' + e.message)
                }
              }
              return false
            }
            
            // 添加键盘事件监听
            window.Application.ApiEvent.AddApiEventListener('KeyDown', enterHandler)
          } else {
            console.warn('ApiEvent不可用，无法添加键盘事件监听')
          }
          
        } catch (e) {
          console.error('应用结果失败:', e)
          window.Application.Alert('应用结果失败: ' + e.message)
        }
      }
    })
    .catch(e => {
      closeDialog(loadingId)
      console.error('续写请求失败:', e)
      window.Application.Alert('续写请求失败: ' + e.message)
    })
}

// 文本校对功能
function handleProofreadText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  let selectedText = '';
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection && selection.Text.trim()) {
      // 有选中文本
      selectedText = selection.Text
    } else {
      // 没有选中文本，获取光标所在段落
      const currentParagraph = window.Application.ActiveDocument.Range.Paragraphs.Item(1);
      if (currentParagraph) {
        selectedText = currentParagraph.Range.Text;
      } else {
        window.Application.Alert('无法获取当前段落文本')
        return
      }
    }
  } catch (e) {
    console.error('获取文本失败:', e)
    window.Application.Alert('获取文本失败: ' + e.message)
    return
  }
  
  // 显示加载对话框
  const loadingId = showLoadingDialog('正在校对文本...')
  
  // 更新API客户端配置
  const config = getConfig()
  if (!config) {
    closeDialog(loadingId)
    window.Application.Alert('无法获取API配置')
    return
  }
  
  apiClient.updateConfig(config)
  
  // 调用API校对文本
  apiClient.proofreadText(selectedText)
    .then(result => {
      closeDialog(loadingId)
      if (result) {
        try {
          const selection = window.Application.ActiveDocument.Range
          // 记录原始文本位置
          const originalStartPosition = selection.Start
          const originalEndPosition = selection.End
          
          // 在光标位置插入修改后内容
          selection.InsertAfter('\n' + result)
          
          // 显示提示
          window.Application.Alert('校对完成，按Enter键确认接受修改')
          
          // 使用WPS ApiEvent
          if (window.Application.ApiEvent) {
            const enterHandler = function(param) {
              // 如果按下的是Enter键
              if (param.KeyCode === 13) {
                try {
                  // 获取原始文本范围
                  const originalRange = window.Application.ActiveDocument.Range(originalStartPosition, originalEndPosition)
                  // 删除原始文本
                  originalRange.Delete()
                  
                  // 移除事件监听
                  window.Application.ApiEvent.RemoveApiEventListener('KeyDown', enterHandler)
                  
                  // 返回true表示已处理该事件
                  return true
                } catch (e) {
                  console.error('删除原始文本失败:', e)
                  window.Application.Alert('删除原始文本失败: ' + e.message)
                }
              }
              return false
            }
            
            // 添加键盘事件监听
            window.Application.ApiEvent.AddApiEventListener('KeyDown', enterHandler)
          } else {
            console.warn('ApiEvent不可用，无法添加键盘事件监听')
          }
          
        } catch (e) {
          console.error('应用结果失败:', e)
          window.Application.Alert('应用结果失败: ' + e.message)
        }
      }
    })
    .catch(e => {
      closeDialog(loadingId)
      console.error('校对请求失败:', e)
      window.Application.Alert('校对请求失败: ' + e.message)
    })
}

// 文本润色功能
function handlePolishText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  let selectedText = '';
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection && selection.Text.trim()) {
      // 有选中文本
      selectedText = selection.Text
    } else {
      // 没有选中文本，获取光标所在段落
      const currentParagraph = window.Application.ActiveDocument.Range.Paragraphs.Item(1);
      if (currentParagraph) {
        selectedText = currentParagraph.Range.Text;
      } else {
        window.Application.Alert('无法获取当前段落文本')
        return
      }
    }
  } catch (e) {
    console.error('获取文本失败:', e)
    window.Application.Alert('获取文本失败: ' + e.message)
    return
  }
  
  // 显示加载对话框
  const loadingId = showLoadingDialog('正在润色文本...')
  
  // 更新API客户端配置
  const config = getConfig()
  if (!config) {
    closeDialog(loadingId)
    window.Application.Alert('无法获取API配置')
    return
  }
  
  apiClient.updateConfig(config)
  
  // 调用API润色文本
  apiClient.polishText(selectedText)
    .then(result => {
      closeDialog(loadingId)
      if (result) {
        try {
          const selection = window.Application.ActiveDocument.Range
          // 记录原始文本位置
          const originalStartPosition = selection.Start
          const originalEndPosition = selection.End
          
          // 在光标位置插入修改后内容
          selection.InsertAfter('\n' + result)
          
          // 显示提示
          window.Application.Alert('润色完成，按Enter键确认接受修改')
          
          // 使用WPS ApiEvent
          if (window.Application.ApiEvent) {
            const enterHandler = function(param) {
              // 如果按下的是Enter键
              if (param.KeyCode === 13) {
                try {
                  // 获取原始文本范围
                  const originalRange = window.Application.ActiveDocument.Range(originalStartPosition, originalEndPosition)
                  // 删除原始文本
                  originalRange.Delete()
                  
                  // 移除事件监听
                  window.Application.ApiEvent.RemoveApiEventListener('KeyDown', enterHandler)
                  
                  // 返回true表示已处理该事件
                  return true
                } catch (e) {
                  console.error('删除原始文本失败:', e)
                  window.Application.Alert('删除原始文本失败: ' + e.message)
                }
              }
              return false
            }
            
            // 添加键盘事件监听
            window.Application.ApiEvent.AddApiEventListener('KeyDown', enterHandler)
          } else {
            console.warn('ApiEvent不可用，无法添加键盘事件监听')
          }
          
        } catch (e) {
          console.error('应用结果失败:', e)
          window.Application.Alert('应用结果失败: ' + e.message)
        }
      }
    })
    .catch(e => {
      closeDialog(loadingId)
      console.error('润色请求失败:', e)
      window.Application.Alert('润色请求失败: ' + e.message)
    })
}

// 文本摘要功能
function handleSummarizeText() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 获取文档文本，如果有选中文本则使用选中文本
  let docText = '';
  let selectedText = '';
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection && selection.Text.trim()) {
      selectedText = selection.Text;
    }
    docText = selectedText || getDocumentText();
  } catch (e) {
    console.error('获取文本失败:', e)
    window.Application.Alert('获取文本失败: ' + e.message)
    return
  }
  
  if (!docText) {
    window.Application.Alert('无法获取文档内容')
    return
  }
  
  // 创建一个任务面板来显示文档问答界面
  showCopilotPanel(
    '文档问答', 
    '我可以回答关于此文档的问题。请在下方输入您的问题：',
    'docQA',
    docText
  )
}

// 全文总结功能
function handleSummarizeDoc() {
  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) return
  
  // 获取文档文本，如果有选中文本则使用选中文本
  let docText = '';
  let selectedText = '';
  let title = '全文总结';
  let prompt = '我将为整个文档生成全面、结构化的总结，包括主要观点、论据和结论。';
  
  try {
    const selection = window.Application.ActiveDocument.Range
    if (selection && selection.Text.trim()) {
      selectedText = selection.Text;
      title = '文本摘要';
      prompt = '我将为您选中的文本生成简洁、准确的摘要，突出核心内容和关键点。';
    }
    docText = selectedText || getDocumentText();
  } catch (e) {
    console.error('获取文本失败:', e)
    window.Application.Alert('获取文本失败: ' + e.message)
    return
  }
  
  if (!docText) {
    window.Application.Alert('无法获取文档内容')
    return
  }
  
  // 初始化侧边栏面板
  showCopilotPanel(
    title, 
    prompt,
    'documentSummarization',
    docText
  )
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
      return 'images/docqa.svg'
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
window.ribbon = {
  OnAddinLoad,
  OnAction,
  GetImage,
  OnGetEnabled,
  OnGetVisible,
  OnGetLabel
}

// 这些函数是给wps客户端调用的
export default window.ribbon 