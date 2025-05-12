<template>
  <div class="taskpane-container">
    <div class="taskpane-header">
      <h2>WPS AI助手</h2>
    </div>
    <div class="taskpane-content">
      <div class="function-panel">
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
        <div class="qa-history" ref="qaHistory">
          <div v-for="(item, index) in qaHistory" :key="index" :class="['qa-item', item.role]">
            <div class="qa-role">{{ item.role === 'user' ? '问题' : '回答' }}</div>
            <div class="qa-content">{{ item.content }}</div>
          </div>
        </div>
        <div class="qa-input-area">
          <input 
            type="text" 
            v-model="question" 
            @keyup.enter="askQuestion" 
            placeholder="请输入问题..." 
            class="qa-input"
            :disabled="isProcessing"
          />
          <button 
            @click="askQuestion" 
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
        </div>
      </div>
    </div>
    <div class="taskpane-footer">
      <div class="status-bar">
        <span>{{ statusMessage }}</span>
      </div>
      <div class="action-bar">
        <button @click="handleSettings" class="btn-settings">设置</button>
        <button @click="handleHelp" class="btn-help">帮助</button>
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

    // 发送问题
    const askQuestion = async () => {
      if (!question.value.trim()) return
      
      // 添加用户问题到历史
      qaHistory.value.push({
        role: 'user',
        content: question.value
      })
      
      const userQuestion = question.value
      question.value = ''
      isProcessing.value = true
      
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
        
        // 调用API获取回答
        const answer = await apiClient.documentQA(docContent, userQuestion)
        
        // 添加回答到历史
        qaHistory.value.push({
          role: 'assistant',
          content: answer
        })
        
        // 滚动到底部
        await nextTick()
        if (qaHistory.value) {
          const element = document.querySelector('.qa-history')
          if (element) element.scrollTop = element.scrollHeight
        }
        
        statusMessage.value = '问题回答完成'
      } catch (e) {
        console.error('问答失败:', e)
        
        // 添加错误信息到历史
        qaHistory.value.push({
          role: 'assistant',
          content: '回答失败: ' + e.message
        })
        
        statusMessage.value = '问答失败: ' + e.message
      } finally {
        isProcessing.value = false
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

    // 关闭面板
    const closePanel = () => {
      activePanel.value = ''
      statusMessage.value = '准备就绪'
    }

    const handleSettings = () => {
      if (window.Application) {
        window.Application.ShowDialog(
          window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/settings',
          'WPS AI助手 - 设置',
          550,
          650,
          false
        )
      }
    }

    const handleHelp = () => {
      if (window.Application) {
        window.Application.ShowDialog(
          window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/help',
          'WPS AI助手 - 帮助',
          500,
          400,
          false
        )
      }
    }

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
      handleContinueText,
      handleProofread,
      handlePolish,
      handleDocumentQA,
      handleSummarizeDoc,
      askQuestion,
      refreshSummary,
      closePanel,
      handleSettings,
      handleHelp
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
}

.taskpane-header {
  padding: 15px;
  background-color: #2b579a;
  color: white;
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
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
}

.status-bar {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
}

button {
  padding: 5px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  margin-left: 10px;
}

button:hover {
  background-color: #e5e5e5;
}

.btn-settings, .btn-help {
  font-size: 0.9rem;
}

/* 侧边栏样式 */
.sidebar-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 5px;
}

/* 问答面板样式 */
.qa-history {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qa-item {
  padding: 10px;
  border-radius: 5px;
  max-width: 90%;
}

.qa-item.user {
  align-self: flex-end;
  background-color: #e3f2fd;
}

.qa-item.assistant {
  align-self: flex-start;
  background-color: #f5f5f5;
}

.qa-role {
  font-weight: bold;
  font-size: 0.8rem;
  margin-bottom: 5px;
  color: #666;
}

.qa-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.qa-input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.qa-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.qa-submit {
  margin-left: 10px;
  padding: 8px 15px;
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

/* 摘要面板样式 */
.summary-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
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
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2b579a;
  border-radius: 50%;
  animation: spin 2s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  text-align: center;
  color: #666;
}

.error-message {
  color: #f44336;
  padding: 15px;
  border: 1px solid #f44336;
  border-radius: 4px;
  background-color: #ffebee;
}

.empty-message {
  color: #666;
  text-align: center;
  padding: 20px;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: center;
}

.refresh-btn {
  padding: 8px 15px;
  background-color: #2b579a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 