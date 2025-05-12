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

  // 添加自定义Alert函数
  if (typeof window.Application.Alert != 'function') {
    window.Application.Alert = function(message) {
      console.log('Alert:', message);
      // 使用原生alert或其他可用的提示方法
      alert(message);
    }
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
  console.log(`按钮点击: ${eleId}`);
  
  switch (eleId) {
    case 'btnContinueText':
      console.log('准备处理文本续写功能...');
      handleContinueText()
      break
    case 'btnProofreadText':
      console.log('准备处理文本校对功能...');
      handleProofreadText()
      break
    case 'btnPolishText':
      console.log('准备处理文本润色功能...');
      handlePolishText()
      break
    case 'btnDocumentQA':
      console.log('准备处理文档问答功能...');
      handleDocumentQA()
      break
    case 'btnSummarizeDoc':
      console.log('准备处理全文总结功能...');
      handleSummarizeDoc()
      break
    case 'btnSettings':
      console.log('准备打开设置对话框...');
      handleSettings()
      break
    case 'btnHelp':
      console.log('准备打开帮助对话框...');
      handleHelp()
      break
    default:
      console.warn(`未知按钮ID: ${eleId}`);
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
      const text = selection.Text;
      
      // 检查是否有实际内容
      if (text && text.trim().length > 0) {
        console.log('成功获取选中文本，长度:', text.length);
        return text;
      } else {
        console.log('选中文本为空或仅包含空白字符');
        return null;
      }
    } else {
      console.warn('未获取到选择范围');
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
      // 获取光标所在段落的替代方法
      try {
        // 尝试直接获取段落文本
        const paragraph = selection.Paragraphs(1);
        if (paragraph) {
          const text = paragraph.Range.Text;
          console.log('成功通过Paragraphs获取段落文本');
          return text;
        }
      } catch (err) {
        console.warn('无法通过Paragraphs获取段落，尝试替代方法:', err);
        
        // 替代方法：扩展选区到当前段落边界
        const doc = window.Application.ActiveDocument;
        const currentPosition = selection.Start;
        
        // 创建一个新的范围对象，从当前位置开始
        const range = doc.Range(currentPosition, currentPosition);
        
        // 扩展到段落开始和结束
        range.StartOf(5, 1); // 5表示段落单位, 1表示扩展选区
        range.EndOf(5, 1);   // 扩展到段落结尾
        
        const text = range.Text;
        console.log('通过替代方法获取段落文本');
        return text;
      }
    } else {
      console.warn('未获取到选择范围');
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
    // 检查API是否可用
    if (typeof window.Application.CreateTaskPane !== 'function') {
      console.error('CreateTaskPane API不可用，尝试替代方法');
      // 可以使用替代方法，比如打开一个对话框
      window.open(url, '_blank', `width=${width},height=600`);
      return { success: true, method: 'window.open' };
    }
    
    const taskpane = window.Application.CreateTaskPane();
    taskpane.DockPosition = window.Application.Enum.msoCTPDockPositionRight;
    taskpane.Width = width;
    taskpane.Visible = true;
    taskpane.Navigate(url);
    return taskpane;
  } catch (e) {
    console.error('创建侧边栏失败:', e);
    // 尝试回退到window.open
    try {
      window.open(url, '_blank', `width=${width},height=600`);
      console.log('已使用window.open作为替代方法');
      return { success: true, method: 'window.open' };
    } catch (err) {
      console.error('所有创建侧边栏方法都失败:', err);
      window.Application.Alert('无法创建侧边栏: ' + e.message);
      return null;
    }
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

// 错误类型常量
const ERROR_TYPES = {
  NETWORK: 'network_error',
  API: 'api_error',
  DOCUMENT: 'document_error',
  CONFIG: 'config_error',
  GENERAL: 'general_error'
};

// 处理文本的通用方法 (整合了processSelection和processParagraph)
async function processText(action, text, actionSource = 'selection') {
  console.log(`开始处理${actionSource === 'selection' ? '选中文本' : '段落'}: ${action}, 文本长度: ${text.length}`);
  let loadingDialog = null;
  
  try {
    // 1. 显示加载对话框
    loadingDialog = showLoadingDialog(`WPS AI助手 - 正在${getActionName(action)}`);
    console.log('加载对话框已显示', loadingDialog ? '成功' : '失败');
    
    // 2. 获取并验证API配置
    console.log('加载API配置');
    const config = getConfig();
    if (!config) {
      throw {
        type: ERROR_TYPES.CONFIG,
        message: '无法获取API配置',
        details: '请检查是否已正确设置API'
      };
    }
    
    apiClient.updateConfig(config);
    console.log('API配置已更新', {
      apiUrl: config.apiUrl,
      model: config.models?.defaultModel || '未指定',
      specificModel: config.models?.[`${action}Model`] || '未指定'
    });
    
    // 3. 调用相应的API处理文本
    let result = '';
    console.log(`调用API: ${action}, 开始时间:`, new Date().toISOString());
    
    try {
      switch (action) {
        case 'continue':
          result = await apiClient.continueText(text);
          console.log('文本续写API调用完成，结果长度:', result.length);
          break;
        case 'proofread':
          result = await apiClient.proofreadText(text);
          console.log('文本校对API调用完成，结果长度:', result.length);
          break;
        case 'polish':
          result = await apiClient.polishText(text);
          console.log('文本润色API调用完成，结果长度:', result.length);
          break;
        default:
          throw {
            type: ERROR_TYPES.GENERAL,
            message: `未知的处理类型: ${action}`,
            details: '请选择有效的文本处理类型'
          };
      }
    } catch (apiError) {
      // 处理API调用错误
      console.error(`API调用失败: ${action}`, apiError);
      
      // 区分网络错误和API响应错误
      if (apiError.request && !apiError.response) {
        throw {
          type: ERROR_TYPES.NETWORK,
          message: '网络连接失败，无法连接到API服务器',
          details: apiError.message,
          originalError: apiError
        };
      } else if (apiError.response) {
        throw {
          type: ERROR_TYPES.API,
          message: `API服务器返回错误 (${apiError.response.status})`,
          details: apiError.response.data?.error?.message || JSON.stringify(apiError.response.data),
          originalError: apiError
        };
      } else {
        throw {
          type: ERROR_TYPES.API,
          message: '调用API时出错',
          details: apiError.message,
          originalError: apiError
        };
      }
    }
    
    // 4. 插入处理结果到文档
    let insertSuccess = false;
    try {
      if (action === 'continue') {
        // 续写是在原文后添加内容
        insertSuccess = insertTextAtCursor(result);
      } else {
        // 校对和润色是替换原文或添加新行
        insertSuccess = insertTextAtCursor('\n' + result);
      }
      console.log('插入处理结果:', insertSuccess ? '成功' : '失败');
      
      if (!insertSuccess) {
        throw {
          type: ERROR_TYPES.DOCUMENT,
          message: '无法将处理结果插入文档',
          details: '请检查文档是否可编辑或者是否有足够权限'
        };
      }
    } catch (docError) {
      // 文档操作错误处理
      if (docError.type === ERROR_TYPES.DOCUMENT) {
        throw docError; // 如果已经是格式化的错误对象，直接抛出
      } else {
        throw {
          type: ERROR_TYPES.DOCUMENT,
          message: '文档操作失败',
          details: docError.message,
          originalError: docError
        };
      }
    }
    
    // 5. 关闭加载对话框并显示成功消息
    if (loadingDialog) {
      closeDialog(loadingDialog);
      console.log('加载对话框已关闭');
    }
    
    window.Application.Alert(`${getActionName(action)}完成！请按Enter接受修改。`);
    console.log(`${action}处理完成, 结束时间:`, new Date().toISOString());
    
    return true; // 处理成功
  } catch (e) {
    // 6. 错误处理：区分不同类型的错误
    console.error(`${action}处理出错:`, e);
    
    // 关闭加载对话框
    if (loadingDialog) {
      closeDialog(loadingDialog);
      console.log('出错后加载对话框已关闭');
    }
    
    // 根据错误类型显示不同的错误消息
    let errorTitle = `${getActionName(action)}失败`;
    let errorMessage = '';
    let errorDetails = '';
    
    // 格式化错误信息
    if (e.type) {
      // 已分类的错误
      switch (e.type) {
        case ERROR_TYPES.NETWORK:
          errorTitle = '网络连接错误';
          errorMessage = e.message;
          errorDetails = e.details;
          break;
        case ERROR_TYPES.API:
          errorTitle = 'API服务错误';
          errorMessage = e.message;
          errorDetails = e.details;
          break;
        case ERROR_TYPES.DOCUMENT:
          errorTitle = '文档操作错误';
          errorMessage = e.message;
          errorDetails = e.details;
          break;
        case ERROR_TYPES.CONFIG:
          errorTitle = '配置错误';
          errorMessage = e.message;
          errorDetails = e.details;
          break;
        default:
          errorMessage = e.message;
          errorDetails = e.details || '';
      }
    } else {
      // 未分类的错误
      errorMessage = e.message || '未知错误';
      
      // 尝试分析错误类型
      if (e.name === 'NetworkError' || (e.message && e.message.includes('network'))) {
        errorTitle = '网络连接错误';
      } else if (e.response || (e.message && e.message.includes('API'))) {
        errorTitle = 'API服务错误';
      }
    }
    
    // 显示错误信息给用户
    const fullErrorMessage = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;
    window.Application.Alert(`${errorTitle}: ${fullErrorMessage}`);
    
    return false; // 处理失败
  }
}

// 处理选中文本的方法 (简化后的版本，调用通用处理函数)
async function processSelection(action, text) {
  return await processText(action, text, 'selection');
}

// 处理段落的方法 (简化后的版本，调用通用处理函数)
async function processParagraph(action, text) {
  return await processText(action, text, 'paragraph');
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

// 文本续写功能
async function handleContinueText() {
  console.log('文本续写功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法执行文本续写');
    return
  }
  
  try {
    // 检查是否有选中文本
  const selectedText = getSelectedText()
    console.log(`选中文本检查: ${selectedText ? '有选中文本' : '无选中文本'}`);
    
    if (!selectedText || selectedText.trim() === '') {
      // 如果没有选中文本，使用光标所在段落
      const paragraph = getCurrentParagraph()
      console.log(`获取段落: ${paragraph ? '成功' : '失败'}`);
      
      if (!paragraph || paragraph.trim() === '') {
        console.warn('没有选中文本也没有段落内容');
        window.Application.Alert('请先选择文本或将光标放置在段落中')
        return
      }
      
      // 使用段落进行续写
      console.log('使用段落进行续写，长度:', paragraph.length);
      await processText('continue', paragraph, 'paragraph');
    } else {
      // 使用选中文本进行续写
      console.log('使用选中文本进行续写，长度:', selectedText.length);
      await processText('continue', selectedText, 'selection');
    }
  } catch (e) {
    console.error('文本续写功能异常:', e);
    window.Application.Alert(`执行文本续写时出错: ${e.message}`);
  }
}

// 文本校对功能
async function handleProofreadText() {
  console.log('文本校对功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法执行文本校对');
    return
  }
  
  try {
    // 检查是否有选中文本
  const selectedText = getSelectedText()
    console.log(`选中文本检查: ${selectedText ? '有选中文本' : '无选中文本'}`);
    
    if (!selectedText || selectedText.trim() === '') {
      // 如果没有选中文本，使用光标所在段落
      const paragraph = getCurrentParagraph()
      console.log(`获取段落: ${paragraph ? '成功' : '失败'}`);
      
      if (!paragraph || paragraph.trim() === '') {
        console.warn('没有选中文本也没有段落内容');
        window.Application.Alert('请先选择文本或将光标放置在段落中')
        return
      }
      
      // 校对段落
      console.log('使用段落进行校对，长度:', paragraph.length);
      await processText('proofread', paragraph, 'paragraph');
    } else {
      // 校对选中文本
      console.log('使用选中文本进行校对，长度:', selectedText.length);
      await processText('proofread', selectedText, 'selection');
    }
  } catch (e) {
    console.error('文本校对功能异常:', e);
    window.Application.Alert(`执行文本校对时出错: ${e.message}`);
  }
}

// 文本润色功能
async function handlePolishText() {
  console.log('文本润色功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    window.Application.Alert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法执行文本润色');
    return
  }
  
  try {
    // 检查是否有选中文本
    const selectedText = getSelectedText()
    console.log(`选中文本检查: ${selectedText ? '有选中文本' : '无选中文本'}`);
    
    if (!selectedText || selectedText.trim() === '') {
      // 如果没有选中文本，使用光标所在段落
      const paragraph = getCurrentParagraph()
      console.log(`获取段落: ${paragraph ? '成功' : '失败'}`);
      
      if (!paragraph || paragraph.trim() === '') {
        console.warn('没有选中文本也没有段落内容');
        window.Application.Alert('请先选择文本或将光标放置在段落中')
        return
      }
      
      // 润色段落
      console.log('使用段落进行润色，长度:', paragraph.length);
      await processText('polish', paragraph, 'paragraph');
    } else {
      // 润色选中文本
      console.log('使用选中文本进行润色，长度:', selectedText.length);
      await processText('polish', selectedText, 'selection');
    }
  } catch (e) {
    console.error('文本润色功能异常:', e);
    window.Application.Alert(`执行文本润色时出错: ${e.message}`);
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