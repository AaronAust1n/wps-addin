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
    
    // 检查Collapse方法是否存在
    if (typeof selection.Collapse === 'function') {
      selection.Collapse() // 确保光标折叠（不是选区）
    } else {
      console.warn('Selection.Collapse方法不可用，尝试替代方法');
    }
    
    // 检查InsertAfter方法是否存在
    if (typeof selection.InsertAfter === 'function') {
      selection.InsertAfter(text)
    } else {
      console.warn('Selection.InsertAfter方法不可用，尝试替代方法');
      
      // 尝试TypeText方法
      if (window.Application.ActiveDocument.Application && 
          window.Application.ActiveDocument.Application.Selection &&
          typeof window.Application.ActiveDocument.Application.Selection.TypeText === 'function') {
        window.Application.ActiveDocument.Application.Selection.TypeText(text);
        console.log('使用TypeText方法插入文本');
      } else {
        // 尝试直接设置Text属性
        try {
          selection.Text = selection.Text + text;
          console.log('使用Text属性设置文本');
        } catch (textError) {
          throw new Error('所有文本插入方法都失败: ' + textError.message);
        }
      }
    }
    
    return true
  } catch (e) {
    console.error('插入文本失败:', e)
    
    // 不要使用Alert，它可能已经出错
    console.error('插入文本失败: ' + e.message)
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
  try {
    if (window.Application) {
      // 检查ShowDialog方法是否可用
      if (typeof window.Application.ShowDialog === 'function') {
        const dialogId = window.Application.ShowDialog(
          Util.GetUrlPath() + Util.GetRouterHash() + '/loading',
          message || 'WPS AI助手 - 正在处理',
          300,
          150,
          false
        );
        console.log('加载对话框已创建，ID:', dialogId);
        return dialogId;
      } else {
        console.warn('ShowDialog方法不可用，尝试替代方法');
        
        // 使用DOM创建一个模拟对话框
        const dialogDiv = document.createElement('div');
        dialogDiv.id = 'wps-loading-dialog-' + new Date().getTime();
        dialogDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 1px solid #ccc;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          z-index: 10000;
          border-radius: 4px;
          min-width: 250px;
          text-align: center;
        `;
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = message || 'WPS AI助手 - 正在处理';
        titleElement.style.margin = '0 0 15px 0';
        
        const loadingElement = document.createElement('div');
        loadingElement.innerHTML = '<div style="width: 40px; height: 40px; margin: 0 auto; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
        loadingElement.style.margin = '10px 0';
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        dialogDiv.appendChild(titleElement);
        dialogDiv.appendChild(loadingElement);
        document.body.appendChild(dialogDiv);
        
        console.log('已创建DOM模拟对话框');
        return dialogDiv.id;
      }
    }
    console.warn('window.Application不可用，无法创建对话框');
    return null;
  } catch (e) {
    console.error('创建加载对话框失败:', e);
    return null;
  }
}

// 关闭对话框
function closeDialog(dialogId) {
  try {
    if (!dialogId) {
      console.warn('未提供对话框ID，无法关闭');
      return;
    }
    
    if (window.Application && dialogId) {
      // 检查CloseDialog方法是否存在
      if (typeof window.Application.CloseDialog === 'function') {
        window.Application.CloseDialog(dialogId);
        console.log('对话框已通过CloseDialog关闭');
      } else {
        console.warn('CloseDialog方法不可用，尝试DOM移除方法');
        
        // 检查是否是DOM元素ID
        if (typeof dialogId === 'string' && dialogId.startsWith('wps-loading-dialog-')) {
          const dialogElement = document.getElementById(dialogId);
          if (dialogElement) {
            dialogElement.remove();
            console.log('已移除DOM模拟对话框');
          } else {
            console.warn('未找到ID为', dialogId, '的DOM对话框');
          }
        } else {
          console.warn('无法识别的对话框ID类型:', dialogId);
        }
      }
    }
  } catch (e) {
    console.error('关闭对话框失败:', e);
    // 尝试DOM方法关闭
    try {
      if (typeof dialogId === 'string') {
        const element = document.getElementById(dialogId);
        if (element) {
          element.remove();
          console.log('通过DOM方法关闭对话框');
        }
      }
    } catch (domError) {
      console.error('所有关闭对话框方法都失败:', domError);
    }
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

// 新增悬浮框和流式展示辅助函数
function showFloatingOverlay(message) {
  const overlay = document.createElement('div');
  overlay.id = 'floating-overlay-' + new Date().getTime();
  overlay.style.position = 'fixed';
  overlay.style.top = '10px';
  overlay.style.right = '10px';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  overlay.style.color = '#fff';
  overlay.style.padding = '10px';
  overlay.style.borderRadius = '5px';
  overlay.style.zIndex = 10000;
  overlay.style.maxWidth = '40%';
  overlay.style.fontSize = '14px';
  overlay.innerHTML = message;
  document.body.appendChild(overlay);
  return overlay.id;
}

function updateFloatingOverlay(overlayId, content) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.innerHTML = content;
  }
}

function removeFloatingOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.remove();
  }
}

function streamText(overlayId, fullText, callback) {
  let i = 0;
  const interval = setInterval(() => {
    i += 50;
    if (i >= fullText.length) {
      updateFloatingOverlay(overlayId, fullText);
      clearInterval(interval);
      if (callback) callback();
    } else {
      updateFloatingOverlay(overlayId, fullText.substring(0, i) + '...');
    }
  }, 50);
}

// 修改 processText 函数，使用悬浮框及流式展示
async function processText(action, text, actionSource = 'selection') {
  console.log(`开始处理${actionSource === 'selection' ? '选中文本' : '段落'}: ${action}, 文本长度: ${text.length}`);
  
  // 1. 显示悬浮框而非模态加载对话框
  let overlayId = showFloatingOverlay(`正在${getActionName(action)}...`);
  
  // 2. 获取并验证API配置
  console.log('加载API配置');
  const config = getConfig();
  if (!config) {
    removeFloatingOverlay(overlayId);
    throw { type: ERROR_TYPES.CONFIG, message: '无法获取API配置', details: '请检查是否已正确设置API' };
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
      case 'summarize':
        result = await apiClient.summarizeText(text);
        console.log('文本摘要API调用完成，结果长度:', result.length);
        break;
      case 'summarizeDocument':
        result = await apiClient.summarizeDocument(text);
        console.log('全文总结API调用完成，结果长度:', result.length);
        break;
      default:
        throw { type: ERROR_TYPES.GENERAL, message: `未知的处理类型: ${action}`, details: '请选择有效的文本处理类型' };
    }
  } catch (apiError) {
    removeFloatingOverlay(overlayId);
    console.error(`API调用失败: ${action}`, apiError);
    if (apiError.request && !apiError.response) {
      throw { type: ERROR_TYPES.NETWORK, message: '网络连接失败，无法连接到API服务器', details: apiError.message, originalError: apiError };
    } else if (apiError.response) {
      throw { type: ERROR_TYPES.API, message: `API服务器返回错误 (${apiError.response.status})`, details: apiError.response.data?.error?.message || JSON.stringify(apiError.response.data), originalError: apiError };
    } else {
      throw { type: ERROR_TYPES.API, message: '调用API时出错', details: apiError.message, originalError: apiError };
    }
  }
  
  // 4. 成功获取结果后，移除原悬浮框并启动流式展示新内容
  removeFloatingOverlay(overlayId);
  const streamOverlayId = showFloatingOverlay(getActionName(action) + '中...');
  streamText(streamOverlayId, result, () => {
    let insertSuccess = false;
    if (action === 'continue') {
      insertSuccess = insertTextAtCursor(result);
    } else {
      insertSuccess = insertTextAtCursor('\n' + result);
    }
    console.log('插入处理结果:', insertSuccess ? '成功' : '失败');
    removeFloatingOverlay(streamOverlayId);
  });
  
  console.log(`${action}处理完成, 结束时间:`, new Date().toISOString());
  return true;
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
    case 'summarize':
      return '文本摘要'
    case 'summarizeDocument':
      return '全文总结'
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
  const doc = window.Application.ActiveDocument;
  if (!doc) {
    console.error('没有打开文档');
    window.Application.Alert('当前没有打开任何文档');
    return;
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法使用全文总结功能');
    return;
  }
  
  const selectedText = getSelectedText();
  if (selectedText && selectedText.trim() !== '') {
    console.log('检测到选中文本，将对选中部分进行摘要');
    processText('summarize', selectedText, 'selection');
  } else {
    console.log('未选中文本，将对全文进行总结');
    const fullText = getDocumentText();
    processText('summarizeDocument', fullText, 'document');
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