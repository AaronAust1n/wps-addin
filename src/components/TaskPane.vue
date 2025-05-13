<template>
  <div class="taskpane-container">
    <div class="taskpane-header">
      <h2>{{ panelTitle }}</h2>
    </div>
    <div class="taskpane-content">
      <!-- 功能选择面板(只有在非直接模式下显示) -->
      <div v-if="!isDirect" class="function-panel">
        <div class="function-item" @click="handleContinueText">
          <div class="icon">📝</div>
          <div class="title">文本续写</div>
          <div class="description">根据上下文智能续写文档内容</div>
        </div>
        <div class="function-item" @click="handleProofread">
          <div class="icon">✓</div>
          <div class="title">文本校对</div>
          <div class="description">检查并修正文档中的错误</div>
        </div>
        <div class="function-item" @click="handlePolish">
          <div class="icon">✨</div>
          <div class="title">文本润色</div>
          <div class="description">改进文档表达，使文章更专业</div>
        </div>
        <div class="function-item" @click="handleDocumentQA">
          <div class="icon">❓</div>
          <div class="title">文档问答</div>
          <div class="description">基于文档内容回答问题</div>
        </div>
        <div class="function-item" @click="handleSummarizeDoc">
          <div class="icon">📚</div>
          <div class="title">全文总结</div>
          <div class="description">分析整个文档并生成总结</div>
        </div>
      </div>

      <!-- 文档问答侧边栏内容 -->
      <div v-if="activePanel === 'qa'" class="sidebar-panel">
        <div class="sidebar-header">
          <h3>文档问答</h3>
          <button @click="closePanel" class="close-btn">&times;</button>
        </div>
        <div class="qa-history" ref="qaHistoryRef">
          <div v-for="(item, index) in qaHistory" :key="index" :class="['qa-item', item.role]">
            <div class="qa-role">{{ item.role === 'user' ? '问题' : '回答' }}</div>
            <div class="qa-content">{{ item.content }}</div>
          </div>
        </div>
        <div class="qa-input-area">
          <input 
            type="text" 
            v-model="question" 
            @keydown.enter.prevent="submitQuestion" 
            placeholder="请输入问题..." 
            class="qa-input"
            :disabled="isProcessing"
            ref="questionInput"
          />
          <button 
            @click="submitQuestion" 
            class="qa-submit" 
            :disabled="isProcessing || !question.trim()"
          >
            {{ isProcessing ? '处理中...' : '提问' }}
          </button>
        </div>
      </div>

      <!-- 全文总结侧边栏内容 -->
      <div v-if="activePanel === 'summary'" class="sidebar-panel">
        <div class="sidebar-header">
          <h3>{{ summaryTitle }}</h3>
          <button @click="closePanel" class="close-btn">&times;</button>
        </div>
        <div class="summary-content">
          <div v-if="isSummarizing" class="loading-indicator">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在生成摘要，请稍候...</div>
          </div>
          <div v-else-if="summaryError" class="error-message">
            {{ summaryError }}
          </div>
          <div v-else-if="summaryContent" class="summary-text">
            {{ summaryContent }}
          </div>
          <div v-else class="empty-message">
            点击"重新生成"按钮开始生成摘要
          </div>
        </div>
        <div class="sidebar-footer">
          <button @click="refreshSummary" class="refresh-btn" :disabled="isSummarizing">
            {{ isSummarizing ? '生成中...' : '重新生成' }}
          </button>
          <button @click="copySummary" class="copy-btn" :disabled="!summaryContent">
            复制内容
          </button>
        </div>
      </div>
    </div>
    <div class="taskpane-footer">
      <div class="status-bar">
        <span>{{ statusMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted } from 'vue'
import apiClient from './js/api.js'

export default {
  setup() {
    const statusMessage = ref('准备就绪')
    const activePanel = ref('') // 'qa' or 'summary'
    const question = ref('')
    const qaHistory = ref([])
    const isProcessing = ref(false)
    const summaryTitle = ref('全文总结')
    const summaryContent = ref('')
    const isSummarizing = ref(false)
    const summaryError = ref('')
    const isDirect = ref(false) // 是否是直接打开特定功能

    // 计算标题
    const panelTitle = computed(() => {
      if (activePanel.value === 'qa') {
        return 'WPS AI文档问答'
      } else if (activePanel.value === 'summary') {
        return 'WPS AI文档摘要'
      } else {
        return 'WPS AI助手'
      }
    })

    // 获取URL参数
    const getUrlParams = () => {
      const url = new URL(window.location.href)
      const params = new URLSearchParams(url.search || url.hash.split('?')[1])
      return {
        function: params.get('function'),
        direct: params.get('direct') === 'true',
        selection: params.get('selection') === 'true',
        refresh: params.get('refresh')
      }
    }

    // 获取选中文本
    const getSelectedText = () => {
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
    const getCurrentParagraph = () => {
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
    const getDocumentText = () => {
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
    const insertTextAtCursor = (text) => {
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

    // 替换选中文本
    const replaceSelectedText = (newText) => {
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

    const getConfig = () => {
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

    const checkConfigured = () => {
      const config = getConfig()
      if (!config || !config.apiUrl) {
        window.Application.Alert('请先配置API设置')
        handleSettings()
        return false
      }
      return true
    }

    const handleContinueText = async () => {
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

    const handleProofread = async () => {
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

    const handlePolish = async () => {
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
    const processSelection = async (action, text) => {
      statusMessage.value = `正在处理文本...`
      
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
            statusMessage.value = '文本续写完成'
            break
          case 'proofread':
            result = await apiClient.proofreadText(text)
            // 校对是替换原文
            insertTextAtCursor('\n' + result)
            statusMessage.value = '文本校对完成，请按Enter确认修改'
            break
          case 'polish':
            result = await apiClient.polishText(text)
            // 润色是替换原文
            insertTextAtCursor('\n' + result)
            statusMessage.value = '文本润色完成，请按Enter确认修改'
            break
        }
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    // 处理段落的通用方法
    const processParagraph = async (action, text) => {
      statusMessage.value = `正在处理段落...`
      
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
            statusMessage.value = '文本续写完成'
            break
          case 'proofread':
            result = await apiClient.proofreadText(text)
            // 校对是替换原文
            insertTextAtCursor('\n' + result)
            statusMessage.value = '文本校对完成，请按Enter确认修改'
            break
          case 'polish':
            result = await apiClient.polishText(text)
            // 润色是替换原文
            insertTextAtCursor('\n' + result)
            statusMessage.value = '文本润色完成，请按Enter确认修改'
            break
        }
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    // 文档问答功能
    const handleDocumentQA = () => {
      if (!checkConfigured()) return
      
      // 激活问答面板
      activePanel.value = 'qa'
      statusMessage.value = '文档问答已启动'
    }

    // 问题提交处理函数
    const submitQuestion = () => {
      console.log('提交问题按钮被点击');
      if (!question.value.trim() || isProcessing.value) {
        console.log('问题为空或正在处理中，忽略提交');
        return;
      }
      
      // 调用问答处理函数
      askQuestion();
    }
    
    // 发送问题
    const askQuestion = async () => {
      console.log('执行askQuestion函数');
      if (!question.value.trim()) {
        console.log('问题为空，放弃处理');
        return;
      }
      
      console.log('开始处理问题:', question.value);
      
      // 添加用户问题到历史
      qaHistory.value.push({
        role: 'user',
        content: question.value
      })
      
      const userQuestion = question.value
      question.value = ''
      isProcessing.value = true
      statusMessage.value = '正在处理问题...'
      
      try {
        console.log('获取文档内容...');
        // 获取文档内容（选中内容或全文）
        const selectedText = getSelectedText();
        console.log(`选中文本状态: ${selectedText ? '有选中文本, 长度:' + selectedText.length : '无选中文本'}`);
        
        let docContent;
        if (selectedText && selectedText.trim()) {
          docContent = selectedText;
          console.log('使用选中文本进行问答');
        } else {
          docContent = getDocumentText();
          console.log('使用全文进行问答, 文本长度:', docContent ? docContent.length : 0);
        }
        
        if (!docContent) {
          console.error('无法获取文档内容');
          throw new Error('无法获取文档内容');
        }
        
        // 更新API客户端配置
        console.log('更新API配置...');
        const config = getConfig();
        if (!config) {
          console.error('API配置未找到');
          throw new Error('无法获取API配置，请先在设置中配置API');
        }
        apiClient.updateConfig(config);
        
        console.log('发送问答请求到API:', config.apiUrl);
        // 调用API获取回答
        const answer = await apiClient.documentQA(docContent, userQuestion);
        console.log('问答完成，答案长度:', answer ? answer.length : 0);
        
        if (!answer) {
          console.error('API返回空答案');
          throw new Error('获取到的回答为空');
        }
        
        // 添加回答到历史
        qaHistory.value.push({
          role: 'assistant',
          content: answer
        });
        
        // 滚动到底部
        console.log('尝试滚动到对话历史底部');
        await nextTick();
        const element = document.querySelector('.qa-history');
        if (element) {
          console.log('滚动到底部');
          element.scrollTop = element.scrollHeight;
        } else {
          console.warn('未找到.qa-history元素，无法滚动');
        }
        
        statusMessage.value = '问题回答完成';
        
        // 将焦点放回输入框
        console.log('尝试将焦点放回输入框');
        await nextTick();
        if (document.querySelector('.qa-input')) {
          document.querySelector('.qa-input').focus();
        }
      } catch (e) {
        console.error('文档问答处理失败:', e);
        
        // 添加错误信息到历史
        qaHistory.value.push({
          role: 'assistant',
          content: '回答失败: ' + e.message
        });
        
        statusMessage.value = '问答失败: ' + e.message;
      } finally {
        isProcessing.value = false;
      }
    }

    // 全文总结功能
    const handleSummarizeDoc = async () => {
      if (!checkConfigured()) return
      
      // 激活总结面板
      activePanel.value = 'summary'
      
      // 检查是否有选中文本
      const selectedText = getSelectedText()
      if (selectedText && selectedText.trim()) {
        summaryTitle.value = '选中内容摘要'
      } else {
        summaryTitle.value = '全文总结'
      }
      
      // 自动生成摘要
      refreshSummary()
    }

    // 刷新摘要
    const refreshSummary = async () => {
      isSummarizing.value = true
      summaryError.value = ''
      summaryContent.value = ''
      statusMessage.value = '正在生成摘要...'
      
      try {
        // 获取文档内容（选中内容或全文）
        const selectedText = getSelectedText()
        const docContent = selectedText && selectedText.trim() ? selectedText : getDocumentText()
        
        if (!docContent) {
          throw new Error('无法获取文档内容')
        }
        
        // 更新API客户端配置
        const config = getConfig()
        apiClient.updateConfig(config)
        
        // 调用API生成摘要
        summaryContent.value = await apiClient.summarizeDocument(docContent)
        
        statusMessage.value = '摘要生成完成'
      } catch (e) {
        console.error('摘要生成失败:', e)
        summaryError.value = '摘要生成失败: ' + e.message
        statusMessage.value = '摘要生成失败: ' + e.message
      } finally {
        isSummarizing.value = false
      }
    }

    // 复制摘要内容到剪贴板
    const copySummary = () => {
      if (!summaryContent.value) return
      
      try {
        // 使用Clipboard API复制文本
        navigator.clipboard.writeText(summaryContent.value)
          .then(() => {
            statusMessage.value = '摘要已复制到剪贴板'
            setTimeout(() => {
              statusMessage.value = '准备就绪'
            }, 2000)
          })
          .catch(err => {
            console.error('复制到剪贴板失败:', err)
            statusMessage.value = '复制失败: ' + err.message
            
            // 备用方法：创建临时textarea
            fallbackCopy(summaryContent.value)
          })
      } catch (e) {
        console.error('复制摘要失败:', e)
        statusMessage.value = '复制失败，请手动选择文本复制'
        
        // 尝试备用复制方法
        fallbackCopy(summaryContent.value)
      }
    }
    
    // 备用复制方法
    const fallbackCopy = (text) => {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        statusMessage.value = '摘要已复制到剪贴板'
        setTimeout(() => {
          statusMessage.value = '准备就绪'
        }, 2000)
      } catch (e) {
        console.error('备用复制方法失败:', e)
        statusMessage.value = '复制失败，请手动选择文本复制'
      }
    }

    // 关闭面板
    const closePanel = () => {
      if (isDirect.value) {
        if (window.parent && typeof window.parent.closeTaskPane === 'function') {
          // 尝试调用父窗口的关闭方法 (如果是嵌入式模式)
          window.parent.closeTaskPane();
        } else {
          // 否则隐藏自己
          activePanel.value = '';
          statusMessage.value = '准备就绪';
        }
      } else {
        activePanel.value = '';
        statusMessage.value = '准备就绪';
      }
    }

    // 在组件挂载时处理URL参数
    onMounted(() => {
      const params = getUrlParams();
      isDirect.value = params.direct || false;
      
      // 根据URL参数直接显示相应功能
      if (params.function === 'qa') {
        activePanel.value = 'qa';
        statusMessage.value = '文档问答已启动';
      } else if (params.function === 'summary') {
        activePanel.value = 'summary';
        
        // 设置标题并根据是否有选择内容设置不同标题
        summaryTitle.value = params.selection ? '选中内容摘要' : '全文总结';
        
        // 如果是直接模式，自动开始生成摘要
        if (isDirect.value) {
          refreshSummary();
        }
      }
    });

    return {
      statusMessage,
      activePanel,
      question,
      qaHistory,
      isProcessing,
      summaryTitle,
      summaryContent,
      isSummarizing,
      summaryError,
      isDirect,
      panelTitle,
      handleContinueText,
      handleProofread,
      handlePolish,
      handleDocumentQA,
      handleSummarizeDoc,
      askQuestion,
      submitQuestion,
      refreshSummary,
      copySummary,
      closePanel
    }
  }
}
</script>

<style scoped>
.taskpane-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.taskpane-header {
  padding: 15px;
  background-color: rgba(43, 87, 154, 0.9);
  color: white;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.taskpane-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.taskpane-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  position: relative;
}

.function-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 15px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 15px 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  height: 120px;
}

.function-item:hover {
  background-color: #e8f1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.title {
  font-weight: bold;
  margin-bottom: 5px;
}

.description {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.2;
}

.taskpane-footer {
  padding: 10px 15px;
  background-color: rgba(240, 240, 240, 0.7);
  border-top: 1px solid rgba(221, 221, 221, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.status-bar {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
}

/* 侧边栏样式 */
.sidebar-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(200, 200, 200, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: rgba(43, 87, 154, 0.8);
  color: white;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.sidebar-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

/* 问答样式 */
.qa-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid rgba(238, 238, 238, 0.6);
  border-radius: 5px;
  padding: 10px;
  max-height: calc(100vh - 200px);
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.qa-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 5px;
}

.qa-item.user {
  background-color: rgba(240, 247, 255, 0.8);
  align-self: flex-end;
  border: 1px solid rgba(200, 220, 240, 0.5);
}

.qa-item.assistant {
  background-color: rgba(245, 245, 245, 0.8);
  align-self: flex-start;
  border: 1px solid rgba(220, 220, 220, 0.5);
}

.qa-role {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #666;
}

.qa-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.qa-input-area {
  display: flex;
  margin-bottom: 10px;
}

.qa-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.qa-submit {
  padding: 10px 15px;
  background-color: #2b579a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.qa-submit:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 摘要样式 */
.summary-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid rgba(238, 238, 238, 0.6);
  border-radius: 5px;
  padding: 15px;
  max-height: calc(100vh - 200px);
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.summary-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
}

.error-message {
  color: #d32f2f;
  padding: 15px;
  background-color: #ffebee;
  border-radius: 4px;
}

.empty-message {
  color: #666;
  text-align: center;
  padding: 20px;
}

.sidebar-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-top: 1px solid rgba(238, 238, 238, 0.6);
  background-color: rgba(250, 250, 250, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.refresh-btn, .copy-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn {
  background-color: #2b579a;
  color: white;
}

.copy-btn {
  background-color: #4caf50;
  color: white;
}

.refresh-btn:disabled, .copy-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 