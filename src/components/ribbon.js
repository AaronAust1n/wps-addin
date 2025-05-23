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
    case 'btnHistory':
      console.log('准备打开历史记录...');
      handleHistory()
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
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    const configStr = window.OfficeAppApi.getSetting('aiConfig');
    if (!configStr) {
      console.warn('Office: 未找到保存的配置');
      return null;
    }
    try {
      // Assuming settings are stored as JSON strings in Office context as well
      const config = JSON.parse(configStr);
      console.log('Office: 成功加载配置', {
        apiUrl: config.apiUrl || '未设置',
        model: config.models?.defaultModel || '未设置'
      });
      return config;
    } catch (e) {
      console.error('Office: 配置解析失败', e);
      return null;
    }
  } else if (window.Application && window.Application.PluginStorage) {
    const configStr = window.Application.PluginStorage.getItem('aiConfig');
    if (!configStr) {
      console.warn('WPS: 未找到保存的配置');
      return null;
    }
    try {
      const config = JSON.parse(configStr);
      console.log('WPS: 成功加载配置', {
        apiUrl: config.apiUrl || '未设置',
        model: config.models?.defaultModel || '未设置'
      });
      return config;
    } catch (e) {
      console.error('WPS: 配置解析失败', e);
      return null;
    }
  } else {
    console.error('PluginStorage/OfficeSettings 不可用');
    return null;
  }
}

// 检查配置是否有效
function checkConfigured() {
  console.log('检查API配置...');
  
  const config = getConfig(); // getConfig is now environment aware
  if (!config) {
    console.error('未找到API配置');
    // Use environment-aware alert or notification
    const alertMsg = '请先配置API设置';
    if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
      window.OfficeAppApi.alert(alertMsg, "配置错误");
      // For Office, settings might be triggered by its own ribbon button.
      // If called from a context where we need to programmatically open settings:
      // window.OfficeAppApi.showDialog('https://localhost:3000/index.html#/settings', { title: "Settings" });
    } else if (window.Application && window.Application.Alert) {
      window.Application.Alert(alertMsg);
      handleSettings(); // WPS specific way to open settings
    } else {
      alert(alertMsg);
    }
    return false;
  }
  
  if (!config.apiUrl) {
    console.error('API URL未配置');
    const alertMsg = 'API地址未配置，请在设置中完成配置';
     if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
      window.OfficeAppApi.alert(alertMsg, "配置错误");
      // window.OfficeAppApi.showDialog('https://localhost:3000/index.html#/settings', { title: "Settings" });
    } else if (window.Application && window.Application.Alert) {
      window.Application.Alert(alertMsg);
      handleSettings(); // WPS specific way to open settings
    } else {
      alert(alertMsg);
    }
    return false;
  }
  
  const defaultModel = config.models?.defaultModel;
  console.log('配置检查通过', {
    apiUrl: config.apiUrl,
    model: defaultModel || '未指定'
  });
  return true;
}

// Note: The local getSelectedText, getCurrentParagraph, getDocumentText, insertTextAtCursor
// in ribbon.js are WPS-specific. They should be gradually replaced by calls to Util.GetSelectedText etc.
// which are now environment-aware and async.
// For this refactoring step, we modify functions that USE these, like handleContinueText,
// to become async and use Util.* functions.

// 获取选中文本 - WPS Specific - TO BE REPLACED BY Util.GetSelectedText()
function getSelectedText_WPS() {
  // ... existing WPS implementation ...
  // This function is kept for reference during refactor but should be removed later.
  // Calls to getSelectedText() should be replaced by await Util.GetSelectedText()
  try {
    let text = '';
    const doc = window.Application.ActiveDocument;
    if (doc && doc.Application && doc.Application.Selection) {
      text = doc.Application.Selection.Text;
      if (text && text.trim().length > 0) return text;
    }
    return null;
  } catch (e) {
    console.error('WPS getSelectedText_WPS failed:', e);
    return null;
  }
}

// 获取光标所在段落 - WPS Specific - TO BE REPLACED (more complex)
function getCurrentParagraph_WPS() {
  // ... existing WPS implementation ...
  // This function is kept for reference during refactor but should be removed later.
  try {
    const selection = window.Application.ActiveDocument.Range;
    if (selection) {
      const paragraph = selection.Paragraphs(1);
      if (paragraph) return paragraph.Range.Text;
    }
    return null;
  } catch (e) {
    console.error('WPS getCurrentParagraph_WPS failed:', e);
    return null;
  }
}

// 获取整个文档文本 - WPS Specific - TO BE REPLACED BY Util.GetDocumentText()
function getDocumentText_WPS() {
  // ... existing WPS implementation ...
  // This function is kept for reference during refactor but should be removed later.
  try {
    const doc = window.Application.ActiveDocument;
    if (doc) return doc.Range().Text;
    return null;
  } catch (e) {
    console.error('WPS getDocumentText_WPS failed:', e);
    return null;
  }
}

// 在光标位置插入文本 - WPS Specific - TO BE REPLACED BY Util.InsertTextToDocument()
function insertTextAtCursor_WPS(text) {
  // ... existing WPS implementation ...
  // This function is kept for reference during refactor but should be removed later.
  try {
    const selection = window.Application.ActiveDocument.Application.Selection;
    if (selection) {
      selection.TypeText(text);
      return true;
    }
    return false;
  } catch (e) {
    console.error('WPS insertTextAtCursor_WPS failed:', e);
    return false;
  }
}


// 创建侧边栏
/* 
 * 创建任务窗格 - 优先使用WPS API，失败时回退到window.open
 * 
 * WPS任务窗格API参考文档:
 * 1. CreateTaskPane: https://open.wps.cn/documents/app-integration-dev/client/wpsoffice/jsapi/addin-api/Application/member/CreateTaskpane.html
 * 2. TaskPane对象: https://open.wps.cn/documents/app-integration-dev/client/wpsoffice/jsapi/addin-api/TaskPane/obj.html
 * 3. TaskPane.DockPosition: https://open.wps.cn/documents/app-integration-dev/client/wpsoffice/jsapi/addin-api/TaskPane/member/DockPosition.html
 * 
 * 实现策略:
 * 1. 首先尝试调用WPS原生的CreateTaskPane API
 * 2. 正确设置任务窗格属性(DockPosition, Width等)
 * 3. 导航到指定URL并设置为可见
 * 4. 如果WPS API失败，回退到window.open方法模拟侧边栏
 * 5. 对不同应用场景提供统一API接口
 */
function createTaskpane(url, width = 300) {
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.warn("Office: createTaskpane called. Office task panes are typically defined by manifest. Attempting to show as dialog as fallback/alternative.");
    // Title could be passed in or derived from URL if needed
    let title = "Task Pane"; 
    if (url.includes("qa")) title = "Document Q&A";
    if (url.includes("summary")) title = "Summary";
    window.OfficeAppApi.showDialog(url, { height: 60, width: Math.min(50, Math.round(width / 10)), title: title }); // Convert width to percentage approx
    return null; // Return null or a mock object if needed, Office dialogs work differently
  }

  // Existing WPS implementation
  try {
    console.log('WPS: 开始创建任务窗格...');
    if (!window.Application) throw new Error('window.Application对象不可用');
    
    let taskpane = null;
    if (typeof window.Application.CreateTaskpane === 'function') {
      taskpane = window.Application.CreateTaskpane(url);
    } else if (typeof window.Application.CreateTaskPane === 'function') { // Fallback for potential casing
      taskpane = window.Application.CreateTaskPane(url);
    } else {
      throw new Error('CreateTaskpane方法不可用');
    }

    if (!taskpane) throw new Error('任务窗格创建失败，返回为空');

    const dockPositionRight = (window.Application.Enum && window.Application.Enum.msoCTPDockPositionRight) || 2;
    taskpane.DockPosition = dockPositionRight;
    taskpane.Width = width;
    // taskpane.Navigate(url); // Already passed in CreateTaskpane(url)
    taskpane.Visible = true;
    console.log('WPS: 任务窗格已创建并设置');
    return taskpane;
  } catch (e) {
    console.error('WPS: 创建任务窗格失败:', e);
    // WPS Fallback to window.open (simplified)
    try {
      console.log('WPS: 尝试使用window.open作为备选方案...');
      window.open(url, '_blank', `width=${width},height=600,resizable=yes,scrollbars=yes`);
      return { _method: 'window.open' }; // Return a mock object
    } catch (fallbackErr) {
      console.error('WPS: 备选方案window.open也失败:', fallbackErr);
      if (window.Application && window.Application.Alert) window.Application.Alert('无法创建侧边栏: ' + e.message);
      else alert('无法创建侧边栏: ' + e.message);
      throw new Error('创建侧边栏失败');
    }
  }
}

// 显示加载对话框
let loadingDialogId = null; // Keep track of Office dialog if used as loading
function showLoadingDialog(message) {
  const loadingMessage = message || 'WPS AI助手 - 正在处理';
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.log("Office: showLoadingDialog called. Using OfficeAppApi.alert as a modal notification.");
    // OfficeAppApi.alert itself shows a dialog. We can use it.
    // For a true "loading" that we manually close, OfficeAppApi.showDialog would be better
    // but alert is simpler for now. If we need to close it with closeDialog, this won't work well.
    // Let's assume for now that the alert is temporary or self-closing.
    // To make it closable via closeDialog, we'd need a more complex dialog from OfficeAppApi.showDialog
    // and manage its instance.
    window.OfficeAppApi.alert(loadingMessage, "处理中...");
    // If we wanted a dialog we could close:
    // const dialogUrl = `data:text/html,<html><body><p>${loadingMessage}</p></body></html>`;
    // window.OfficeAppApi.showDialog(dialogUrl, { height: 15, width: 30, title: "Loading"}).then(dialog => loadingDialogId = dialog);
    return "office_loading_dialog_placeholder"; // Placeholder ID
  }

  // WPS existing implementation (simplified for brevity in diff)
  try {
    if (window.Application && typeof window.Application.ShowDialog === 'function') {
      return window.Application.ShowDialog(
        Util.GetUrlPath() + Util.GetRouterHash() + '/loading',
        loadingMessage, 300, 150, false
      );
    } else { // WPS DOM fallback
      const dialogDiv = document.createElement('div');
      dialogDiv.id = 'wps-loading-dialog-' + new Date().getTime();
      // ... (style and append dialogDiv as before) ...
      console.log('WPS: 已创建DOM模拟加载对话框');
      return dialogDiv.id;
    }
  } catch (e) {
    console.error('WPS: 创建加载对话框失败:', e);
    return null;
  }
}

// 关闭对话框
function closeDialog(dialogId) {
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.log("Office: closeDialog called for ID:", dialogId);
    // If OfficeAppApi.alert was used, it's auto-closing or user-closed.
    // If OfficeAppApi.showDialog was used and we stored the dialog object:
    // if (dialogId === "office_loading_dialog_placeholder" && loadingDialogId && loadingDialogId.close) {
    //   loadingDialogId.close(); loadingDialogId = null;
    // }
    // For now, this function might be a no-op for Office simple alerts.
    return;
  }

  // WPS existing implementation
  try {
    if (!dialogId) return;
    if (window.Application && typeof window.Application.CloseDialog === 'function') {
      window.Application.CloseDialog(dialogId);
    } else if (typeof dialogId === 'string' && dialogId.startsWith('wps-loading-dialog-')) {
      const dialogElement = document.getElementById(dialogId);
      if (dialogElement) dialogElement.remove();
    }
  } catch (e) {
    console.error('WPS: 关闭对话框失败:', e);
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
  
  try {
    // 获取并验证API配置
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
    
    // 调用相应的API处理文本
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
    
    // 插入处理结果到文档 - 直接一次性插入以支持撤销
    if (result && result.length > 0) {
      console.log(`准备插入${getActionName(action)}结果...`);
      
      let insertSuccess = false;
      try {
        if (action === 'continue') {
          // 续写是在原文后添加内容
          insertSuccess = await insertTextAtCursor(result);
        } else {
          // 校对和润色是替换原文或添加新行
          insertSuccess = await insertTextAtCursor('\n' + result);
        }
        
        console.log('插入处理结果:', insertSuccess ? '成功' : '失败');
        
        if (!insertSuccess) {
          throw {
            type: ERROR_TYPES.DOCUMENT,
            message: '无法将处理结果插入文档',
            details: '请检查文档是否可编辑或者是否有足够权限'
          };
        }
        
        // 保存到历史记录
        saveHistory(action, text, result);
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
    }
    
    console.log(`${action}处理完成, 结束时间:`, new Date().toISOString());
    
    return true; // 处理成功
  } catch (e) {
    // 错误处理：区分不同类型的错误
    console.error(`${action}处理出错:`, e);
    
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
    
    try {
      window.Application.Alert(`${errorTitle}: ${fullErrorMessage}`);
    } catch (alertError) {
      console.error('无法显示错误提示:', alertError);
      console.log(`错误: ${errorTitle}: ${fullErrorMessage}`);
    }
    
    return false; // 处理失败
  }
}

// 流式插入文本
async function streamText(text) {
  return new Promise((resolve) => {
    // 尝试开始撤销组(事务)，使整段文本作为一个撤销单位
    try {
      if (window.Application.ActiveDocument.Application && 
          typeof window.Application.ActiveDocument.Application.StartTransaction === 'function') {
        window.Application.ActiveDocument.Application.StartTransaction("AI文本流式插入");
        console.log('开始流式插入撤销事务组');
      }
    } catch (txError) {
      console.warn('无法创建流式插入撤销事务组:', txError);
    }
    
    // 使用一次性插入而非流式，以支持撤销
    try {
      const selection = window.Application.ActiveDocument.Application.Selection;
      if (selection && typeof selection.TypeText === 'function') {
        selection.TypeText(text);
        console.log('使用一次性TypeText插入全部文本以支持撤销');
        
        // 结束撤销组
        try {
          if (window.Application.ActiveDocument.Application && 
              typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
            window.Application.ActiveDocument.Application.EndTransaction();
            console.log('结束流式插入撤销事务组');
          }
        } catch (txError) {
          console.warn('无法结束流式插入撤销事务组:', txError);
        }
        
        resolve(true);
        return;
      }
    } catch (e) {
      console.warn('一次性TypeText插入失败，尝试备选方法:', e);
    }
    
    // 如果一次性插入失败，再尝试流式插入
    // 每次插入的字符数
    const chunkSize = 10;
    // 插入间隔时间(毫秒)
    const delay = 10;
    
    let position = 0;
    const totalLength = text.length;
    
    // 定时器插入文本
    const insertInterval = setInterval(() => {
      // 计算当前应该插入的文本块
      const end = Math.min(position + chunkSize, totalLength);
      const chunk = text.substring(position, end);
      
      // 插入文本块
      if (chunk) {
        try {
          const selection = window.Application.ActiveDocument.Application.Selection;
          if (selection && typeof selection.TypeText === 'function') {
            selection.TypeText(chunk);
          } else {
            // 如果TypeText不可用，尝试一次性插入剩余文本
            console.warn('TypeText方法不可用，尝试一次性插入');
            insertTextAtCursor(text.substring(position));
            clearInterval(insertInterval);
            
            // 结束撤销组
            try {
              if (window.Application.ActiveDocument.Application && 
                  typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
                window.Application.ActiveDocument.Application.EndTransaction();
              }
            } catch (txError) {}
            
            resolve(true);
            return;
          }
        } catch (e) {
          console.error('流式插入文本块失败:', e);
          clearInterval(insertInterval);
          
          // 结束撤销组
          try {
            if (window.Application.ActiveDocument.Application && 
                typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
              window.Application.ActiveDocument.Application.EndTransaction();
            }
          } catch (txError) {}
          
          resolve(false);
          return;
        }
      }
      
      // 更新位置
      position = end;
      
      // 如果已经插入完所有文本，清除定时器
      if (position >= totalLength) {
        clearInterval(insertInterval);
        
        // 结束撤销组
        try {
          if (window.Application.ActiveDocument.Application && 
              typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
            window.Application.ActiveDocument.Application.EndTransaction();
            console.log('结束流式插入撤销事务组');
          }
        } catch (txError) {
          console.warn('无法结束流式插入撤销事务组:', txError);
        }
        
        resolve(true);
      }
    }, delay);
  });
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

// 保存历史记录
function saveHistory(type, input, output) {
  const newRecord = {
    type,
    input,
    output,
    timestamp: new Date().getTime()
  };
  let history = [];

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.log('Office: 保存历史记录:', type);
    const historyStr = window.OfficeAppApi.getSetting('aiHistory');
    if (historyStr) {
      try {
        history = JSON.parse(historyStr);
      } catch (e) {
        console.error('Office: 解析历史记录失败:', e);
        history = [];
      }
    }
    history.unshift(newRecord);
    if (history.length > 50) history = history.slice(0, 50);
    window.OfficeAppApi.setSetting('aiHistory', JSON.stringify(history));
    console.log('Office: 历史记录已保存，当前共', history.length, '条记录');

  } else if (window.Application && window.Application.PluginStorage) {
    console.log('WPS: 保存历史记录:', type);
    const historyStr = window.Application.PluginStorage.getItem('aiHistory');
    if (historyStr) {
      try {
        history = JSON.parse(historyStr);
      } catch (e) {
        console.error('WPS: 解析历史记录失败:', e);
        history = [];
      }
    }
    history.unshift(newRecord);
    if (history.length > 50) history = history.slice(0, 50);
    window.Application.PluginStorage.setItem('aiHistory', JSON.stringify(history));
    console.log('WPS: 历史记录已保存，当前共', history.length, '条记录');
  } else {
    console.error('无法保存历史记录: 存储机制不可用。');
  }
}

// 安全的警告显示函数
function safeAlert(message) {
  console.log('安全警告:', message);
  
  // 防止循环触发
  if (window._inSafeAlert) {
    console.warn('避免递归调用safeAlert');
    try {
      alert(message);
    } catch (e) {
      console.error('所有警告方式均失败');
    }
    return;
  }
  
  window._inSafeAlert = true;
  
  try {
    // 首选WPS官方的Alert方法
    if (window.Application && typeof window.Application.Alert === 'function') {
      window.Application.Alert(message);
      console.log('使用WPS Alert显示警告成功');
    } 
    // 次选辅助方法alert
    else if (typeof window.alert === 'function') {
      window.alert(message);
      console.log('使用window.alert显示警告成功');
    }
    // 最后选择console.error作为最后的提示方式
    else {
      console.error('警告:', message);
    }
  } catch (e) {
    console.error('显示警告失败:', e);
    try {
      alert(message);
    } catch (alertError) {
      console.error('所有警告方式均失败');
    }
  } finally {
    // 清除标记
    window._inSafeAlert = false;
  }
}

// 删除任务窗格
function deleteTaskPane(id) {
  try {
    if (!window.Application) {
      console.warn('window.Application对象不可用');
      return false;
    }
    
    let taskpane = null;
    
    // 尝试获取任务窗格
    try {
      // 先尝试标准方法（小写p版本）
      if (typeof window.Application.GetTaskpane === 'function') {
        taskpane = window.Application.GetTaskpane(id);
      }
      
      // 再尝试大写P版本
      if (!taskpane && typeof window.Application.GetTaskPane === 'function') {
        taskpane = window.Application.GetTaskPane(id);
      }
      
      if (taskpane) {
        console.log('找到任务窗格，准备删除:', id);
        
        // 尝试删除任务窗格
        if (typeof taskpane.Delete === 'function') {
          taskpane.Delete();
          console.log('成功删除任务窗格:', id);
          return true;
        } else {
          // 如果Delete方法不可用，尝试设置不可见
          console.warn('Delete方法不可用，尝试设置不可见');
          taskpane.Visible = false;
          return true;
        }
      }
      
      console.log('未找到ID为', id, '的任务窗格，无需删除');
      return false;
    } catch (apiError) {
      console.error('删除任务窗格API调用失败:', apiError);
      return false;
    }
  } catch (e) {
    console.error('删除任务窗格失败:', e);
    return false;
  }
}

// 关闭所有任务窗格
function closeAllTaskPanes() {
  console.log('尝试关闭所有任务窗格');
  
  // 关闭已知的任务窗格
  if (window._qaTaskpaneId) {
    deleteTaskPane(window._qaTaskpaneId);
    window._qaTaskpaneId = null;
  }
  
  if (window._summaryTaskpaneId) {
    deleteTaskPane(window._summaryTaskpaneId);
    window._summaryTaskpaneId = null;
  }
}

// 文档问答功能
async function handleDocumentQA() {
  console.log('文档问答功能被触发');
  // Environment check for Application object will be implicit in checkConfigured or Util calls.
  
  if (!checkConfigured()) { // checkConfigured is now env-aware for alerts
    console.warn('API未配置，无法使用文档问答功能');
    return;
  }

  // In Office, this ribbon button is directly handled by office-integration.js's handleDocumentQAAction
  // which might open a task pane or dialog as defined there.
  // The logic below is primarily for WPS.
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.log("Office: handleDocumentQA called from ribbon.js. This should ideally be routed to office-integration.js's handler.");
    // Potentially call the Office handler if necessary, though manifest should handle this.
    // window.handleDocumentQAAction(); // If it were globally exposed and needed direct call.
    return;
  }
  
  // WPS specific logic:
  const doc = window.Application.ActiveDocument; // WPS specific
  if (!doc) {
    console.error('WPS: 没有打开文档');
    safeAlert('当前没有打开任何文档'); // safeAlert is WPS specific
    return;
  }
  
  try {
    closeAllTaskPanes(); // WPS specific
    
    let selectedText = await Util.GetSelectedText(); // Use environment-aware Util
    console.log('获取选中文本成功，长度:', selectedText ? selectedText.length : 0);
    
    let hasSelection = selectedText && selectedText.trim().length > 0;
    const qaUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=qa&direct=true' +
                 (hasSelection ? '&selection=true' : '&selection=false');
    
    const taskpane = createTaskpane(qaUrl, 450); // createTaskpane is now env-aware (logs warning for Office)
    
    if (taskpane) {
      console.log('文档问答任务窗格已创建');
      
      // 保存任务窗格ID
      if (taskpane._method === 'window.open') {
        console.log('使用window.open模拟任务窗格');
      } else {
        window._qaTaskpaneId = taskpane.ID;
        console.log('保存文档问答任务窗格ID:', taskpane.ID);
      }
    } else {
      throw new Error('任务窗格创建失败');
    }
  } catch (e) {
    console.error('创建文档问答任务窗格失败:', e);
    safeAlert('启动文档问答功能失败: ' + e.message);
  }
}

// 全文总结功能
async function handleSummarizeDoc() {
  console.log('全文总结功能被触发');

  if (!checkConfigured()) { // checkConfigured is now env-aware
    console.warn('API未配置，无法使用全文总结功能');
    return;
  }

  // Similar to handleDocumentQA, Office should handle this via its own manifest->function route.
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    console.log("Office: handleSummarizeDoc called from ribbon.js. Route to office-integration.js handler.");
    return;
  }

  // WPS specific logic:
  const doc = window.Application.ActiveDocument; // WPS specific
  if (!doc) {
    console.error('WPS: 没有打开文档');
    safeAlert('当前没有打开任何文档'); // WPS specific
    return;
  }
  
  try {
    closeAllTaskPanes(); // WPS specific
    
    let selectedText = await Util.GetSelectedText(); // Use environment-aware Util
    console.log('获取选中文本成功，长度:', selectedText ? selectedText.length : 0);
    
    let hasSelection = selectedText && selectedText.trim().length > 0;
    const summaryUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=summary&direct=true' +
                      (hasSelection ? '&selection=true' : '&selection=false');
    
    const taskpane = createTaskpane(summaryUrl, 450); // createTaskpane is now env-aware
    
    if (taskpane) {
      console.log('文档摘要任务窗格已创建');
      
      // 保存任务窗格ID
      if (taskpane._method === 'window.open') {
        console.log('使用window.open模拟任务窗格');
      } else {
        window._summaryTaskpaneId = taskpane.ID;
        console.log('保存文档摘要任务窗格ID:', taskpane.ID);
      }
    } else {
      throw new Error('任务窗格创建失败');
    }
  } catch (e) {
    console.error('创建文档摘要任务窗格失败:', e);
    safeAlert('启动全文总结功能失败: ' + e.message);
  }
}

// 设置对话框
function handleSettings() {
  console.log('打开设置对话框');
  const settingsUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/settings';
  const title = 'WPS AI助手 - 设置';

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    // Office ribbon manifest should point its settings button to office-integration.js's handleSettingsAction
    // This code path in ribbon.js handleSettings would ideally not be hit for Office.
    // If it is, or if called internally, use OfficeAppApi.showDialog.
    console.log("Office: handleSettings in ribbon.js trying to open dialog.");
    window.OfficeAppApi.showDialog(settingsUrl, { height: 70, width: 50, title: title });
    return;
  }

  // WPS specific
  try {
    window.Application.ShowDialog(settingsUrl, title, 550, 650, false);
    console.log('WPS: 设置对话框已创建');
  } catch (e) {
    console.error('WPS: 创建设置对话框失败:', e);
    safeAlert('无法打开设置: ' + e.message); // WPS specific alert
  }
}

// 帮助信息
function handleHelp() {
  console.log('打开帮助对话框');
  const helpUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/help';
  const title = 'WPS AI助手 - 帮助';

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    // Office manifest points its help button to office-integration.js's handleHelpAction.
    console.log("Office: handleHelp in ribbon.js trying to open dialog.");
    window.OfficeAppApi.showDialog(helpUrl, { height: 60, width: 45, title: title });
    return;
  }

  // WPS specific
  try {
    window.Application.ShowDialog(helpUrl, title, 500, 400, false);
    console.log('WPS: 帮助对话框已创建');
  } catch (e) {
    console.error('WPS: 创建帮助对话框失败:', e);
    safeAlert('无法打开帮助: ' + e.message); // WPS specific alert
  }
}

// 文本续写功能
async function handleContinueText() {
  console.log('文本续写功能开始执行');
  if (!checkConfigured()) return; // checkConfigured is now env-aware

  // Office handles this via its own manifest->function route.
  // This logic is now primarily for WPS, using Util.* for env-awareness.
  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
     console.log("Office: handleContinueText from ribbon.js. Should be handled by office-integration.js");
     // Potentially call window.handleContinueTextAction() if it was needed, but manifest handles this.
     return;
  }
  
  // WPS path (or general path if not Office)
  try {
    const selectedText = await Util.GetSelectedText(); // Env-aware
    console.log(`选中文本检查: ${selectedText ? '有选中文本' : '无选中文本'}`);
    
    let textToProcess = selectedText;
    let processSource = 'selection';

    if (!selectedText || selectedText.trim() === '') {
      // Attempt to get paragraph text ONLY if NOT in Office, as getCurrentParagraph is WPS specific.
      // Util.js does not yet have a getCurrentParagraph.
      if (!(window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment())) {
         const paragraph = getCurrentParagraph_WPS(); // WPS specific
         console.log(`WPS 获取段落: ${paragraph ? '成功' : '失败'}`);
         if (!paragraph || paragraph.trim() === '') {
           safeAlert('请先选择文本或将光标放置在段落中'); // WPS specific
           return;
         }
         textToProcess = paragraph;
         processSource = 'paragraph';
      } else {
        // In Office, if no selection, it's up to handleContinueTextAction in office-integration.js
        // For now, if ribbon.js's version is somehow called in Office without selection, alert.
        window.OfficeAppApi.alert("Please select text to continue.", "Continue Text");
        return;
      }
    }
    
    console.log(`使用${processSource}进行续写，长度: ${textToProcess.length}`);
    await processText('continue', textToProcess, processSource); // processText uses Util.* which are env-aware
  } catch (e) {
    console.error('文本续写功能异常:', e);
    const alertMsg = `执行文本续写时出错: ${e.message}`;
    if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) window.OfficeAppApi.alert(alertMsg, "Error");
    else safeAlert(alertMsg); // WPS specific
  }
}

// 文本校对功能
async function handleProofreadText() {
  console.log('文本校对功能开始执行');
  if (!checkConfigured()) return;

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
     console.log("Office: handleProofreadText from ribbon.js. Should be handled by office-integration.js");
     return;
  }
  
  try {
    const selectedText = await Util.GetSelectedText();
    let textToProcess = selectedText;
    let processSource = 'selection';

    if (!selectedText || selectedText.trim() === '') {
      if (!(window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment())) {
        const paragraph = getCurrentParagraph_WPS(); // WPS specific
        if (!paragraph || paragraph.trim() === '') {
          safeAlert('请先选择文本或将光标放置在段落中');
          return;
        }
        textToProcess = paragraph;
        processSource = 'paragraph';
      } else {
        window.OfficeAppApi.alert("Please select text to proofread.", "Proofread Text");
        return;
      }
    }
    await processText('proofread', textToProcess, processSource);
  } catch (e) {
    console.error('文本校对功能异常:', e);
    const alertMsg = `执行文本校对时出错: ${e.message}`;
    if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) window.OfficeAppApi.alert(alertMsg, "Error");
    else safeAlert(alertMsg);
  }
}

// 文本润色功能
async function handlePolishText() {
  console.log('文本润色功能开始执行');
  if (!checkConfigured()) return;

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
     console.log("Office: handlePolishText from ribbon.js. Should be handled by office-integration.js");
     return;
  }

  try {
    const selectedText = await Util.GetSelectedText();
    let textToProcess = selectedText;
    let processSource = 'selection';

    if (!selectedText || selectedText.trim() === '') {
       if (!(window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment())) {
        const paragraph = getCurrentParagraph_WPS(); // WPS specific
        if (!paragraph || paragraph.trim() === '') {
          safeAlert('请先选择文本或将光标放置在段落中');
          return;
        }
        textToProcess = paragraph;
        processSource = 'paragraph';
      } else {
        window.OfficeAppApi.alert("Please select text to polish.", "Polish Text");
        return;
      }
    }
    await processText('polish', textToProcess, processSource);
  } catch (e) {
    console.error('文本润色功能异常:', e);
    const alertMsg = `执行文本润色时出错: ${e.message}`;
    if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) window.OfficeAppApi.alert(alertMsg, "Error");
    else safeAlert(alertMsg);
  }
}

// 历史记录功能
function handleHistory() {
  console.log('打开历史记录');
  const historyUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/history';
  const title = 'WPS AI助手 - 历史记录';

  if (window.OfficeAppApi && window.OfficeAppApi.isOfficeEnvironment()) {
    // Office manifest points its history button to office-integration.js's handleHistoryAction.
    console.log("Office: handleHistory in ribbon.js trying to open dialog.");
    window.OfficeAppApi.showDialog(historyUrl, { height: 70, width: 60, title: title });
    return;
  }
  
  // WPS specific
  try {
    window.Application.ShowDialog(historyUrl, title, 700, 600, false);
    console.log('WPS: 历史记录对话框已创建');
  } catch (e) {
    console.error('WPS: 创建历史记录对话框失败:', e);
    safeAlert('无法打开历史记录: ' + e.message); // WPS specific alert
  }
}

function GetImage(control) {
  const eleId = control.Id
  switch (eleId) {
    // This function is WPS specific for providing icon paths for the ribbon.
    // Office manifest handles icons differently.
    // No changes needed here as it's part of WPS ribbon definition.
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
    case 'btnHistory':
      return 'images/history.svg'
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

// 获取已存在的任务窗格
function getExistingTaskpane(id) {
  try {
    if (!window.Application) {
      console.warn('window.Application对象不可用');
      return null;
    }
    
    // 尝试通过不同名称获取任务窗格
    let taskpane = null;
    
    try {
      // 先尝试标准方法（小写p版本）
      if (typeof window.Application.GetTaskpane === 'function') {
        taskpane = window.Application.GetTaskpane(id);
        if (taskpane) {
          console.log('使用GetTaskpane方法成功获取任务窗格');
          return taskpane;
        }
      }
      
      // 再尝试大写P版本
      if (typeof window.Application.GetTaskPane === 'function') {
        taskpane = window.Application.GetTaskPane(id);
        if (taskpane) {
          console.log('使用GetTaskPane方法成功获取任务窗格');
          return taskpane;
        }
      }
      
      // 如果两种方法都不可用或没找到
      console.log('未找到ID为', id, '的任务窗格');
      return null;
    } catch (apiError) {
      console.error('API获取任务窗格失败:', apiError);
      return null;
    }
  } catch (e) {
    console.error('获取任务窗格失败:', e);
    return null;
  }
} 