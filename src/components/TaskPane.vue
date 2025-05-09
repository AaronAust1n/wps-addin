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
        <div class="function-item" @click="handleSummarize">
          <div class="icon">📋</div>
          <div class="title">文本摘要</div>
          <div class="description">为选定内容生成简洁摘要</div>
        </div>
        <div class="function-item" @click="handleSummarizeDoc">
          <div class="icon">📚</div>
          <div class="title">全文总结</div>
          <div class="description">分析整个文档并生成总结</div>
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
import { ref } from 'vue'

export default {
  setup() {
    const statusMessage = ref('准备就绪')

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
      if (!config || !config.apiUrl || !config.apiKey) {
        window.Application.Alert('请先配置API设置')
        handleSettings()
        return false
      }
      return true
    }

    const handleContinueText = () => {
      if (!checkConfigured()) return
      statusMessage.value = '执行文本续写...'
      // 实现文本续写功能
      try {
        // 这里编写实际的文本续写实现
        statusMessage.value = '文本续写完成'
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleProofread = () => {
      if (!checkConfigured()) return
      statusMessage.value = '执行文本校对...'
      // 实现文本校对功能
      try {
        // 这里编写实际的文本校对实现
        statusMessage.value = '文本校对完成'
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handlePolish = () => {
      if (!checkConfigured()) return
      statusMessage.value = '执行文本润色...'
      // 实现文本润色功能
      try {
        // 这里编写实际的文本润色实现
        statusMessage.value = '文本润色完成'
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleSummarize = () => {
      if (!checkConfigured()) return
      statusMessage.value = '生成文本摘要...'
      // 实现文本摘要功能
      try {
        // 这里编写实际的文本摘要实现
        statusMessage.value = '文本摘要生成完成'
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleSummarizeDoc = () => {
      if (!checkConfigured()) return
      statusMessage.value = '生成全文总结...'
      // 实现全文总结功能
      try {
        // 这里编写实际的全文总结实现
        statusMessage.value = '全文总结生成完成'
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleSettings = () => {
      if (window.Application) {
        window.Application.ShowDialog(
          window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/dialog',
          'WPS AI助手 - 设置',
          450,
          400,
          false
        )
      }
    }

    const handleHelp = () => {
      window.open('https://example.com/ai-assistant-help', '_blank')
    }

    return {
      statusMessage,
      handleContinueText,
      handleProofread,
      handlePolish,
      handleSummarize,
      handleSummarizeDoc,
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
}

.taskpane-header {
  padding: 15px;
  background-color: #4a86e8;
  color: white;
}

.taskpane-header h2 {
  margin: 0;
  font-size: 18px;
}

.taskpane-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.function-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.function-item {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.function-item:hover {
  background-color: #f5f5f5;
}

.function-item .icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.function-item .title {
  font-weight: bold;
  margin-bottom: 5px;
}

.function-item .description {
  font-size: 12px;
  color: #666;
}

.taskpane-footer {
  border-top: 1px solid #eee;
  padding: 10px 15px;
}

.status-bar {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-settings {
  background-color: #f1f1f1;
  color: #333;
}

.btn-help {
  background-color: #f1f1f1;
  color: #333;
}
</style> 