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
    // 尝试多种方法获取选中文本
    let text = '';
    const doc = window.Application.ActiveDocument;
    
    // 方法1: 使用Selection对象
    try {
      if (doc.Application && doc.Application.Selection) {
        text = doc.Application.Selection.Text;
        if (text && text.trim().length > 0) {
          console.log('通过Selection对象获取选中文本成功，长度:', text.length);
          return text;
        }
      }
    } catch (e1) {
      console.warn('通过Selection对象获取选中文本失败:', e1);
    }
    
    // 方法2: 使用Range对象
    try {
      const selection = doc.Range;
      if (selection) {
        text = selection.Text;
        // 有些版本的WPS在没有选中文本时也会返回文本，需要进一步判断
        if (text && text.trim().length > 0) {
          // 判断是否真的选中了文本
          const selLength = selection.End - selection.Start;
          if (selLength > 1) { // 真正有选中内容
            console.log('通过Range对象获取选中文本成功，长度:', text.length);
            return text;
          } else {
            console.log('Range对象显示未选中文本(长度不足)');
          }
        }
      }
    } catch (e2) {
      console.warn('通过Range对象获取选中文本失败:', e2);
    }
    
    // 方法3: 尝试获取系统剪贴板(在某些情况下可以作为备选)
    try {
      // 此方法需要用户预先复制选中内容，仅作为参考
      // 实际应用时可能不适用，取决于WPS API和用户操作习惯
    } catch (e3) {
      console.warn('通过剪贴板获取选中文本失败:', e3);
    }
    
    console.log('选中文本为空或仅包含空白字符');
    return null;
  } catch (e) {
    console.error('获取选中文本失败:', e);
    window.Application.Alert('获取选中文本失败: ' + e.message);
    return null;
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
    const selection = window.Application.ActiveDocument.Range;
    
    // 尝试开始撤销组(事务)，使整段文本作为一个撤销单位
    try {
      if (window.Application.ActiveDocument.Application && 
          typeof window.Application.ActiveDocument.Application.StartTransaction === 'function') {
        window.Application.ActiveDocument.Application.StartTransaction("AI文本插入");
        console.log('开始撤销事务组');
      }
    } catch (txError) {
      console.warn('无法创建撤销事务组:', txError);
    }
    
    // 检查Collapse方法是否存在
    if (typeof selection.Collapse === 'function') {
      selection.Collapse(); // 确保光标折叠（不是选区）
    } else {
      console.warn('Selection.Collapse方法不可用，尝试替代方法');
    }
    
    // 检查InsertAfter方法是否存在
    if (typeof selection.InsertAfter === 'function') {
      selection.InsertAfter(text);
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
    
    // 尝试结束撤销组(事务)
    try {
      if (window.Application.ActiveDocument.Application && 
          typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
        window.Application.ActiveDocument.Application.EndTransaction();
        console.log('结束撤销事务组');
      }
    } catch (txError) {
      console.warn('无法结束撤销事务组:', txError);
    }
    
    return true;
  } catch (e) {
    console.error('插入文本失败:', e);
    
    // 结束可能未完成的事务
    try {
      if (window.Application.ActiveDocument.Application && 
          typeof window.Application.ActiveDocument.Application.EndTransaction === 'function') {
        window.Application.ActiveDocument.Application.EndTransaction();
      }
    } catch (txError) {}
    
    // 不要使用Alert，它可能已经出错
    console.error('插入文本失败: ' + e.message);
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
  try {
    console.log('开始创建任务窗格...');
    
    // 使用正确的WPS API创建任务窗格
    if (!window.Application) {
      throw new Error('window.Application对象不可用');
    }
    
    // 避免方法名大小写错误
    const createMethod = window.Application.CreateTaskPane || window.Application.CreateTaskpane;
    if (typeof createMethod !== 'function') {
      throw new Error('CreateTaskPane方法不可用');
    }
    
    // 创建任务窗格
    const taskpane = createMethod();
    if (!taskpane) {
      throw new Error('任务窗格创建失败，返回为空');
    }
    
    console.log('任务窗格已创建，设置属性...');
    
    // 设置任务窗格属性
    // 使用常量或枚举值设置停靠位置（右侧）
    // msoCTPDockPositionRight常量值为2
    const dockPositionRight = 
      (window.Application.Enum && window.Application.Enum.msoCTPDockPositionRight) || 2;
    
    taskpane.DockPosition = dockPositionRight;
    console.log('已设置任务窗格停靠位置: 右侧');
    
    // 设置宽度
    taskpane.Width = width;
    console.log('已设置任务窗格宽度:', width);
    
    // 导航到指定URL
    taskpane.Navigate(url);
    console.log('已导航到URL:', url);
    
    // 设置可见
    taskpane.Visible = true;
    console.log('已设置任务窗格为可见');
    
    return taskpane;
  } catch (e) {
    console.error('创建任务窗格失败:', e);
    
    // 尝试使用window.open作为备选方案
    try {
      console.log('尝试使用window.open作为备选方案...');
      const height = 600;
      const left = window.screen.width - width - 20; // 留出一些边距
      const top = 80; // 顶部留出一些空间
      
      // 使用特定的窗口特性，让其外观更像侧边栏
      const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no,menubar=no,toolbar=no`;
      
      // 使用_blank而不是特定名称，避免重用现有窗口
      const taskWin = window.open(url, '_blank', windowFeatures);
      
      if (!taskWin) {
        throw new Error('备选方案window.open创建窗口失败，可能被浏览器拦截');
      }
      
      console.log('使用window.open创建窗口成功');
      
      // 返回一个类似TaskPane的对象，以保持API兼容性
      return {
        _window: taskWin,
        _method: 'window.open',
        DockPosition: dockPositionRight,
        Width: width,
        Visible: true,
        
        // 模拟Navigate方法
        Navigate: function(newUrl) {
          try {
            this._window.location.href = newUrl;
            return true;
          } catch (navigateErr) {
            console.error('窗口导航失败:', navigateErr);
            return false;
          }
        }
      };
    } catch (fallbackErr) {
      console.error('备选方案也失败:', fallbackErr);
      
      // 此处不使用safeAlert，因为可能导致循环
      if (window.Application && window.Application.Alert) {
        window.Application.Alert('无法创建侧边栏: ' + e.message);
      } else {
        try { alert('无法创建侧边栏: ' + e.message); } catch (alertErr) {}
      }
      
      throw new Error('创建侧边栏失败');
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
  try {
    if (window.Application && window.Application.PluginStorage) {
      console.log('保存历史记录:', type);
      
      // 获取现有历史记录
      let history = [];
      const historyStr = window.Application.PluginStorage.getItem('aiHistory');
      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
        } catch (e) {
          console.error('解析历史记录失败:', e);
          history = [];
        }
      }
      
      // 添加新记录
      const newRecord = {
        type,
        input,
        output,
        timestamp: new Date().getTime()
      };
      
      // 限制历史记录数量，保留最新的50条
      history.unshift(newRecord);
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      // 保存回存储
      window.Application.PluginStorage.setItem('aiHistory', JSON.stringify(history));
      console.log('历史记录已保存，当前共', history.length, '条记录');
    }
  } catch (e) {
    console.error('保存历史记录失败:', e);
  }
}

// 安全的警告显示函数
function safeAlert(message) {
  console.log('安全警告:', message);
  try {
    if (typeof window.Application.Alert === 'function') {
      window.Application.Alert(message);
    } else {
      // 如果内置Alert不可用，使用原生alert
      alert(message);
    }
  } catch (e) {
    console.error('所有警告方法都失败:', e);
    try {
      alert(message);
    } catch (alertError) {
      console.error('原生alert也失败:', alertError);
    }
  }
}

// 文档问答功能
async function handleDocumentQA() {
  console.log('文档问答功能被触发');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开文档');
    safeAlert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法使用文档问答功能');
    return
  }
  
  try {
    // 检查是否已有文档问答任务窗格
    let taskpane = null;
    
    // 尝试获取已存在的任务窗格
    if (window._qaTaskpaneId) {
      taskpane = getExistingTaskpane(window._qaTaskpaneId);
      if (taskpane) {
        console.log('找到现有的文档问答任务窗格，重新激活');
        
        // 刷新URL以更新状态
        const qaUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=qa&refresh=' + new Date().getTime();
        taskpane.Navigate(qaUrl);
        
        // 确保任务窗格可见
        taskpane.Visible = true;
        
        return;
      }
    }
    
    // 没有找到现有任务窗格，创建新的
    console.log('未找到现有任务窗格，创建新的');
    
    // 检查是否有选中文本
    const selectedText = getSelectedText();
    console.log('通过Selection对象获取选中文本成功，长度:', selectedText ? selectedText.length : 0);
    
    // 创建任务窗格 - 添加特殊参数以区分不同功能的任务窗格
    const qaUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=qa';
    taskpane = createTaskpane(qaUrl, 350);
    
    if (taskpane) {
      console.log('文档问答任务窗格已创建');
      
      // 如果是window.open方式创建的，保存窗口引用
      if (taskpane._method === 'window.open') {
        console.log('使用window.open模拟任务窗格');
      } else {
        // 保存任务窗格ID以便后续使用
        window._qaTaskpaneId = taskpane.ID;
        console.log('保存任务窗格ID:', taskpane.ID);
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
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开文档');
    safeAlert('当前没有打开任何文档')
    return
  }
  
  if (!checkConfigured()) {
    console.warn('API未配置，无法使用全文总结功能');
    return
  }
  
  try {
    // 检查是否已有文档总结任务窗格
    let taskpane = null;
    
    // 尝试获取已存在的任务窗格
    if (window._summaryTaskpaneId) {
      taskpane = getExistingTaskpane(window._summaryTaskpaneId);
      if (taskpane) {
        console.log('找到现有的文档摘要任务窗格，重新激活');
        
        // 刷新URL以更新状态
        const summaryUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=summary&refresh=' + new Date().getTime();
        taskpane.Navigate(summaryUrl);
        
        // 确保任务窗格可见
        taskpane.Visible = true;
        
        return;
      }
    }
    
    // 没有找到现有任务窗格，创建新的
    console.log('未找到现有任务窗格，创建新的');
    
    // 检查是否有选中文本
    const selectedText = getSelectedText();
    console.log('通过Selection对象获取选中文本成功，长度:', selectedText ? selectedText.length : 0);
    
    // 创建任务窗格 - 添加特殊参数以区分不同功能的任务窗格
    const summaryUrl = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane?function=summary';
    taskpane = createTaskpane(summaryUrl, 350);
    
    if (taskpane) {
      console.log('文档摘要任务窗格已创建');
      
      // 如果是window.open方式创建的，保存窗口引用
      if (taskpane._method === 'window.open') {
        console.log('使用window.open模拟任务窗格');
      } else {
        // 保存任务窗格ID以便后续使用
        window._summaryTaskpaneId = taskpane.ID;
        console.log('保存任务窗格ID:', taskpane.ID);
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
    safeAlert('无法打开设置: ' + e.message);
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
    safeAlert('无法打开帮助: ' + e.message);
  }
}

// 文本续写功能
async function handleContinueText() {
  console.log('文本续写功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    safeAlert('当前没有打开任何文档')
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
        safeAlert('请先选择文本或将光标放置在段落中')
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
    safeAlert(`执行文本续写时出错: ${e.message}`);
  }
}

// 文本校对功能
async function handleProofreadText() {
  console.log('文本校对功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    safeAlert('当前没有打开任何文档')
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
        safeAlert('请先选择文本或将光标放置在段落中')
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
    safeAlert(`执行文本校对时出错: ${e.message}`);
  }
}

// 文本润色功能
async function handlePolishText() {
  console.log('文本润色功能开始执行');
  
  const doc = window.Application.ActiveDocument
  if (!doc) {
    console.error('没有打开的文档');
    safeAlert('当前没有打开任何文档')
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
        safeAlert('请先选择文本或将光标放置在段落中')
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
    safeAlert(`执行文本润色时出错: ${e.message}`);
  }
}

// 历史记录功能
function handleHistory() {
  console.log('打开历史记录');
  
  try {
    window.Application.ShowDialog(
      Util.GetUrlPath() + Util.GetRouterHash() + '/history',
      'WPS AI助手 - 历史记录',
      700,
      600,
      false
    );
    console.log('历史记录对话框已创建');
  } catch (e) {
    console.error('创建历史记录对话框失败:', e);
    safeAlert('无法打开历史记录: ' + e.message);
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
      return null;
    }
    
    // 检查GetTaskpane方法是否存在
    const getMethod = window.Application.GetTaskpane || window.Application.GetTaskPane;
    if (typeof getMethod !== 'function') {
      console.warn('GetTaskpane方法不可用');
      return null;
    }
    
    // 尝试通过ID获取任务窗格
    const taskpane = getMethod(id);
    
    if (taskpane) {
      console.log('成功获取ID为', id, '的任务窗格');
      return taskpane;
    }
    
    console.log('未找到ID为', id, '的任务窗格');
    return null;
  } catch (e) {
    console.error('获取任务窗格失败:', e);
    return null;
  }
} 