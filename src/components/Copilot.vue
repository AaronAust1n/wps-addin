<template>
  <div class="copilot-container">
    <div class="copilot-header">
      <h2>{{ title }}</h2>
      <div class="actions">
        <button @click="closeCopilot" class="btn-close" title="关闭">×</button>
      </div>
    </div>
    
    <div class="copilot-content" ref="contentRef">
      <!-- 提示信息 -->
      <div class="message system-message">
        <div class="message-content">{{ prompt }}</div>
      </div>
      
      <!-- 用户输入的内容 -->
      <div class="message user-message" v-if="selectedText && showPrompt">
        <div class="message-avatar">用户</div>
        <div class="message-content">
          <div class="text-preview">
            {{ truncatedText }}
            <span v-if="isTextTruncated" class="truncated-info">
              (显示部分内容，共{{ textLength }}字)
            </span>
          </div>
          <div class="message-actions">
            <button @click="regenerate" class="btn-action">重新生成</button>
            <button @click="executeAIOperation" class="btn-primary">确认生成</button>
          </div>
        </div>
      </div>
      
      <!-- AI助手回复内容 -->
      <div class="message assistant-message" v-if="assistantResponse">
        <div class="message-avatar">AI助手</div>
        <div class="message-content">
          <div v-if="loading" class="loading-indicator">
            <div class="dot-typing"></div>
          </div>
          <div v-else class="assistant-response">
            <div v-html="formattedResponse"></div>
            
            <div class="message-actions" v-if="!loading && assistantResponse">
              <button @click="applyToDocument" class="btn-primary">应用到文档</button>
              <button @click="regenerate" class="btn-action">重新生成</button>
              <button @click="copyToClipboard" class="btn-action">复制</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 错误信息 -->
      <div class="message error-message" v-if="error">
        <div class="message-content">
          <div class="error-text">{{ error }}</div>
          <div class="message-actions">
            <button @click="regenerate" class="btn-action">重试</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 新的用户输入区域 -->
    <div class="copilot-footer" v-if="assistantResponse && !loading">
      <div class="input-container">
        <input 
          type="text" 
          v-model="userInput" 
          @keyup.enter="sendFollowUpMessage"
          placeholder="输入后续指令或问题..." 
          class="user-input" 
        />
        <button @click="sendFollowUpMessage" class="btn-send" :disabled="!userInput.trim()">
          <span class="send-icon">↑</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from './js/api.js'

export default {
  setup() {
    const route = useRoute()
    const title = ref('AI助手')
    const prompt = ref('')
    const selectedText = ref('')
    const operation = ref('')
    const assistantResponse = ref('')
    const loading = ref(false)
    const error = ref('')
    const userInput = ref('')
    const contentRef = ref(null)
    const showPrompt = ref(true)
    
    // 用于存储对话历史
    const conversationHistory = ref([])
    
    // 截断文本，只显示预览
    const truncatedText = computed(() => {
      const text = selectedText.value || ''
      if (text.length <= 500) return text
      return text.substring(0, 497) + '...'
    })
    
    const isTextTruncated = computed(() => {
      return (selectedText.value || '').length > 500
    })
    
    const textLength = computed(() => {
      return (selectedText.value || '').length
    })
    
    // 格式化AI助手回复，处理换行
    const formattedResponse = computed(() => {
      if (!assistantResponse.value) return ''
      return assistantResponse.value
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 处理加粗语法
    })
    
    // 初始化
    onMounted(async () => {
      const dataId = route.query.id
      
      if (dataId) {
        try {
          const tempData = JSON.parse(sessionStorage.getItem(dataId))
          if (tempData) {
            title.value = tempData.title || 'AI助手'
            prompt.value = tempData.prompt || ''
            selectedText.value = tempData.selectedText || ''
            operation.value = tempData.operation || ''
            
            // 如果有配置，更新API客户端配置
            if (tempData.config) {
              apiClient.updateConfig(tempData.config)
            }
            
            // 如果有自动执行操作，触发生成
            if (operation.value && selectedText.value && !tempData.initial) {
              // 标记为已初始化，避免重复执行
              sessionStorage.setItem(dataId, JSON.stringify({...tempData, initial: true}))
              await executeAIOperation()
            }
          }
        } catch (e) {
          console.error('加载数据失败:', e)
        }
      }
    })
    
    // 关闭Copilot侧边栏
    const closeCopilot = () => {
      if (window.Application) {
        const tsId = window.Application.PluginStorage.getItem('copilot_panel_id')
        if (tsId) {
          try {
            const taskPane = window.Application.GetTaskPane(tsId)
            taskPane.Visible = false
          } catch (e) {
            console.error('关闭侧边栏失败:', e)
          }
        }
      }
    }
    
    // 执行AI操作
    const executeAIOperation = async () => {
      if (!operation.value || !selectedText.value) return
      
      loading.value = true
      error.value = ''
      assistantResponse.value = ''
      
      try {
        // 添加对话历史
        conversationHistory.value = [
          { role: 'user', content: selectedText.value }
        ]
        
        // 根据操作类型调用不同的API
        let result = ''
        switch (operation.value) {
          case 'continuation':
            result = await apiClient.continueText(selectedText.value)
            break
          case 'proofreading':
            result = await apiClient.proofreadText(selectedText.value)
            break
          case 'polishing':
            result = await apiClient.polishText(selectedText.value)
            break
          case 'summarization':
            result = await apiClient.summarizeText(selectedText.value)
            break
          case 'documentSummarization':
            result = await apiClient.summarizeDocument(selectedText.value)
            break
          default:
            throw new Error('未知操作类型')
        }
        
        // 更新响应和对话历史
        assistantResponse.value = result
        conversationHistory.value.push({ role: 'assistant', content: result })
        
        // 滚动到底部
        await nextTick()
        scrollToBottom()
      } catch (e) {
        console.error('执行AI操作失败:', e)
        error.value = e.message || '执行操作失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    // 重新生成
    const regenerate = async () => {
      showPrompt.value = true
      assistantResponse.value = ''
      error.value = ''
      await executeAIOperation()
    }
    
    // 应用到文档
    const applyToDocument = () => {
      if (!assistantResponse.value) return
      
      try {
        // 根据操作类型决定如何应用
        if (window.Application && window.Application.ActiveDocument) {
          const selection = window.Application.ActiveDocument.Range
          
          switch (operation.value) {
            case 'continuation':
              // 续写是添加到原文本后面
              if (selection) {
                selection.Text = selectedText.value + assistantResponse.value
              }
              break
            case 'documentSummarization':
              // 全文总结是添加到文档末尾
              if (selection) {
                selection.Collapse(false) // 折叠到末尾
                selection.InsertAfter('\n\n## 文档总结\n\n' + assistantResponse.value + '\n')
              }
              break
            default:
              // 其他操作是替换选中文本
              if (selection) {
                selection.Text = assistantResponse.value
              }
              break
          }
          
          window.Application.Alert('内容已应用到文档')
        }
      } catch (e) {
        console.error('应用到文档失败:', e)
        window.Application.Alert('应用到文档失败: ' + e.message)
      }
    }
    
    // 复制到剪贴板
    const copyToClipboard = () => {
      if (!assistantResponse.value) return
      
      // 创建临时元素
      const textArea = document.createElement('textarea')
      textArea.value = assistantResponse.value
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        window.Application.Alert('内容已复制到剪贴板')
      } catch (e) {
        console.error('复制失败:', e)
        window.Application.Alert('复制失败')
      } finally {
        document.body.removeChild(textArea)
      }
    }
    
    // 发送后续消息
    const sendFollowUpMessage = async () => {
      if (!userInput.value.trim()) return
      
      const message = userInput.value.trim()
      userInput.value = ''
      
      // 隐藏原始提示
      showPrompt.value = false
      
      // 添加到对话历史
      conversationHistory.value.push({ role: 'user', content: message })
      
      loading.value = true
      error.value = ''
      
      try {
        // 构建完整的对话历史
        const messages = [
          { role: 'system', content: `你是WPS AI助手，一个专业的文档处理助手。用户之前要求你${title.value}，你已经生成了相应内容，现在用户有新的指令或问题。` },
          ...conversationHistory.value
        ]
        
        // 调用API进行对话
        const result = await apiClient.chat(messages)
        
        // 更新响应和对话历史
        assistantResponse.value = result
        conversationHistory.value.push({ role: 'assistant', content: result })
        
        // 滚动到底部
        await nextTick()
        scrollToBottom()
      } catch (e) {
        console.error('发送消息失败:', e)
        error.value = e.message || '发送消息失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (contentRef.value) {
        contentRef.value.scrollTop = contentRef.value.scrollHeight
      }
    }
    
    // 监听assistantResponse的变化，滚动到底部
    watch(assistantResponse, async () => {
      await nextTick()
      scrollToBottom()
    })
    
    return {
      title,
      prompt,
      selectedText,
      operation,
      assistantResponse,
      loading,
      error,
      userInput,
      contentRef,
      showPrompt,
      truncatedText,
      isTextTruncated,
      textLength,
      formattedResponse,
      closeCopilot,
      executeAIOperation,
      regenerate,
      applyToDocument,
      copyToClipboard,
      sendFollowUpMessage
    }
  }
}
</script>

<style scoped>
.copilot-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Microsoft YaHei', sans-serif;
  background-color: #f9f9f9;
  color: #333;
}

.copilot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #4a86e8;
  color: white;
  z-index: 10;
}

.copilot-header h2 {
  margin: 0;
  font-size: 18px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.copilot-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  animation: fadeIn 0.3s ease-in-out;
}

.system-message {
  background-color: #f0f4fc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.user-message, .assistant-message {
  display: flex;
  gap: 12px;
}

.message-avatar {
  font-weight: bold;
  font-size: 14px;
  color: #4a86e8;
  width: 40px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background-color: #f0f4fc;
}

.text-preview {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

.truncated-info {
  color: #999;
  font-size: 12px;
  margin-left: 5px;
}

.assistant-response {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4a86e8;
  color: white;
}

.btn-primary:hover {
  background-color: #3b78e7;
}

.btn-action {
  background-color: #f1f1f1;
  color: #333;
}

.btn-action:hover {
  background-color: #e4e4e4;
}

.error-message .message-content {
  background-color: #fff0f0;
  border-left: 3px solid #e53935;
}

.error-text {
  color: #e53935;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.dot-typing {
  position: relative;
  left: -9999px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #4a86e8;
  color: #4a86e8;
  box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  animation: dot-typing 1.5s infinite linear;
}

@keyframes dot-typing {
  0% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
  16.667% {
    box-shadow: 9984px -10px 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
  33.333% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
  50% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px -10px 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
  66.667% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
  83.333% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px -10px 0 0 #4a86e8;
  }
  100% {
    box-shadow: 9984px 0 0 0 #4a86e8, 9999px 0 0 0 #4a86e8, 10014px 0 0 0 #4a86e8;
  }
}

.copilot-footer {
  padding: 16px;
  border-top: 1px solid #eee;
  background-color: white;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 4px 8px;
}

.user-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px;
  outline: none;
  font-size: 14px;
}

.btn-send {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #4a86e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-send:disabled {
  background-color: #c5c5c5;
  cursor: not-allowed;
}

.send-icon {
  font-size: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 