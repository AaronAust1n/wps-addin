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
          <div class="title">文档问答</div>
          <div class="description">基于文档内容回答您的问题</div>
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
import apiClient from './js/api.js'

export default {
  setup() {
    const statusMessage = ref('准备就绪')

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
      
      const selectedText = getSelectedText()
      if (!selectedText) return
      
      statusMessage.value = '执行文本续写...'
      
      try {
        // 更新API客户端配置
        const config = getConfig()
        apiClient.updateConfig(config)
        
        // 调用API续写文本
        const result = await apiClient.continueText(selectedText)
        
        // 将结果替换选中文本
        if (result) {
          const combinedText = selectedText + result
          replaceSelectedText(combinedText)
          statusMessage.value = '文本续写完成'
        }
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleProofread = async () => {
      if (!checkConfigured()) return
      
      const selectedText = getSelectedText()
      if (!selectedText) return
      
      statusMessage.value = '执行文本校对...'
      
      try {
        // 更新API客户端配置
        const config = getConfig()
        apiClient.updateConfig(config)
        
        // 调用API校对文本
        const result = await apiClient.proofreadText(selectedText)
        
        // 将结果替换选中文本
        if (result) {
          replaceSelectedText(result)
          statusMessage.value = '文本校对完成'
        }
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handlePolish = async () => {
      if (!checkConfigured()) return
      
      const selectedText = getSelectedText()
      if (!selectedText) return
      
      statusMessage.value = '执行文本润色...'
      
      try {
        // 更新API客户端配置
        const config = getConfig()
        apiClient.updateConfig(config)
        
        // 调用API润色文本
        const result = await apiClient.polishText(selectedText)
        
        // 将结果替换选中文本
        if (result) {
          replaceSelectedText(result)
          statusMessage.value = '文本润色完成'
        }
      } catch (e) {
        statusMessage.value = '操作失败: ' + e.message
      }
    }

    const handleSummarize = async () => {
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
      
      if (!docText) return;
      
      statusMessage.value = '打开文档问答...'
      
      // 使用Ribbon.js中定义的showCopilotPanel函数
      if (window.Util) {
        // 调用Ribbon.js中定义的showCopilotPanel函数
        const tempDataId = 'ai_copilot_temp_data_' + Date.now()
        const tempData = {
          title: '文档问答',
          prompt: '我可以回答关于此文档的问题。请在下方输入您的问题：',
          operation: 'docQA',
          selectedText: docText,
          config: getConfig(),
          initial: false // 设为false，确保执行初始化
        }
        
        console.log('打开文档问答侧边栏')
        // 保存临时数据到浏览器存储
        sessionStorage.setItem(tempDataId, JSON.stringify(tempData))
        
        // 打开Copilot侧边栏
        let tsId = window.Application.PluginStorage.getItem('copilot_panel_id')
        if (!tsId) {
          try {
            let tskpane = window.Application.CreateTaskPane(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
            if (!tskpane) {
              throw new Error('创建任务面板失败')
            }
            let id = tskpane.ID
            window.Application.PluginStorage.setItem('copilot_panel_id', id)
            tskpane.Visible = true
          } catch (e) {
            console.error('创建任务面板失败:', e)
            window.Application.Alert('创建任务面板失败: ' + e.message)
            return
          }
        } else {
          try {
            let tskpane = window.Application.GetTaskPane(tsId)
            if (!tskpane) {
              throw new Error('获取任务面板失败')
            }
            tskpane.Navigate(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
            tskpane.Visible = true
          } catch (e) {
            console.error('获取任务面板失败:', e)
            try {
              let tskpane = window.Application.CreateTaskPane(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
              if (!tskpane) {
                throw new Error('创建任务面板失败')
              }
              let id = tskpane.ID
              window.Application.PluginStorage.setItem('copilot_panel_id', id)
              tskpane.Visible = true
            } catch (innerE) {
              console.error('创建任务面板失败:', innerE)
              window.Application.Alert('任务面板创建失败: ' + innerE.message)
              return
            }
          }
        }
        
        statusMessage.value = '文档问答已打开'
      } else {
        window.Application.Alert('无法加载Copilot面板')
      }
    }

    const handleSummarizeDoc = async () => {
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
      
      if (!docText) return;
      
      statusMessage.value = '生成' + title + '中...'
      
      // 使用Ribbon.js中定义的showCopilotPanel函数
      if (window.Util) {
        // 调用Ribbon.js中定义的showCopilotPanel函数
        const tempDataId = 'ai_copilot_temp_data_' + Date.now()
        const tempData = {
          title: title,
          prompt: prompt,
          operation: 'documentSummarization',
          selectedText: docText,
          config: getConfig(),
          initial: false // 设为false，确保执行初始化
        }
        
        console.log('打开全文总结侧边栏')
        // 保存临时数据到浏览器存储
        sessionStorage.setItem(tempDataId, JSON.stringify(tempData))
        
        // 打开Copilot侧边栏
        let tsId = window.Application.PluginStorage.getItem('copilot_panel_id')
        if (!tsId) {
          try {
            let tskpane = window.Application.CreateTaskPane(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
            if (!tskpane) {
              throw new Error('创建任务面板失败')
            }
            let id = tskpane.ID
            window.Application.PluginStorage.setItem('copilot_panel_id', id)
            tskpane.Visible = true
          } catch (e) {
            console.error('创建任务面板失败:', e)
            window.Application.Alert('创建任务面板失败: ' + e.message)
            return
          }
        } else {
          try {
            let tskpane = window.Application.GetTaskPane(tsId)
            if (!tskpane) {
              throw new Error('获取任务面板失败')
            }
            tskpane.Navigate(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
            tskpane.Visible = true
          } catch (e) {
            console.error('获取任务面板失败:', e)
            try {
              let tskpane = window.Application.CreateTaskPane(window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/copilot?id=' + tempDataId)
              if (!tskpane) {
                throw new Error('创建任务面板失败')
              }
              let id = tskpane.ID
              window.Application.PluginStorage.setItem('copilot_panel_id', id)
              tskpane.Visible = true
            } catch (innerE) {
              console.error('创建任务面板失败:', innerE)
              window.Application.Alert('任务面板创建失败: ' + innerE.message)
              return
            }
          }
        }
        
        statusMessage.value = title + '面板已打开'
      } else {
        window.Application.Alert('无法加载Copilot面板')
      }
    }

    const handleSettings = () => {
      if (window.Application) {
        window.Application.ShowDialog(
          window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/dialog',
          'WPS AI助手 - 设置',
          450,
          600,
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
  background-color: #e6e6e6;
  color: #333;
}
</style> 