<template>
  <div class="qa-container">
    <div class="qa-header">
      <h2>文档问答</h2>
      <div class="qa-info" v-if="selectedText">已选中{{ selectedText.length }}个字符</div>
      <div class="qa-info" v-else>未选中文本，将对整个文档进行问答</div>
    </div>
    
    <div class="qa-content">
      <div class="question-section">
        <div class="label">请输入您的问题：</div>
        <textarea 
          v-model="question" 
          class="question-input" 
          placeholder="请输入您对文档的问题..."
          :disabled="isProcessing"></textarea>
        <button 
          @click="handleAsk" 
          class="ask-button" 
          :disabled="!question || isProcessing">
          {{ isProcessing ? '处理中...' : '提问' }}
        </button>
      </div>
      
      <div class="answer-section" v-if="answer">
        <div class="label">AI回答：</div>
        <div class="answer-content">{{ answer }}</div>
        
        <div class="actions">
          <button @click="insertToDocument" class="action-btn insert-btn">插入到文档</button>
          <button @click="reset" class="action-btn reset-btn">重新提问</button>
        </div>
      </div>
      
      <div class="loading" v-if="isProcessing">
        <div class="spinner"></div>
        <div>正在处理您的问题，请稍候...</div>
      </div>
    </div>
    
    <div class="qa-footer">
      <button @click="closeDialog" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from './js/api.js'

export default {
  setup() {
    const route = useRoute()
    const question = ref('')
    const answer = ref('')
    const isProcessing = ref(false)
    const selectedText = ref('')
    const fullDocument = ref('')
    
    // 安全的警告显示函数
    const safeAlert = (message) => {
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
    };
    
    // 在组件挂载时获取文档内容
    onMounted(async () => {
      if (window.Application && window.Application.ActiveDocument) {
        try {
          // 尝试获取选中文本
          if (window.Application.ActiveDocument.Application && 
              window.Application.ActiveDocument.Application.Selection) {
            const selection = window.Application.ActiveDocument.Application.Selection.Text;
            if (selection && selection.trim()) {
              selectedText.value = selection;
              console.log('已获取选中文本，长度:', selectedText.value.length);
            }
          }
          
          // 如果没有选中文本，则获取整个文档
          if (!selectedText.value) {
            if (window.Application.ActiveDocument.Range) {
              const docText = window.Application.ActiveDocument.Range().Text;
              fullDocument.value = docText;
              console.log('已获取整个文档内容，长度:', fullDocument.value.length);
            }
          }
        } catch (e) {
          console.error('获取文档内容失败:', e);
        }
      }
    })
    
    // 处理提问
    const handleAsk = async () => {
      if (!question.value || isProcessing.value) return;
      
      isProcessing.value = true;
      answer.value = '';
      
      try {
        // 选择处理数据：选中文本或整个文档
        const textToProcess = selectedText.value || fullDocument.value;
        
        if (!textToProcess) {
          safeAlert('无法获取文档内容，请确保文档已打开并且文本可访问');
          isProcessing.value = false;
          return;
        }
        
        // 长文本处理：如果内容过长，进行智能截断
        let processedText = textToProcess;
        const maxLength = 8000; // 根据模型容量调整
        
        if (textToProcess.length > maxLength) {
          console.warn(`文本内容过长(${textToProcess.length}字符)，将进行智能截断`);
          
          // 简单截断策略：保留前后部分
          const frontPart = textToProcess.substring(0, maxLength / 2);
          const backPart = textToProcess.substring(textToProcess.length - maxLength / 2);
          processedText = `${frontPart}\n...(中间内容已省略)...\n${backPart}`;
          
          console.log('截断后文本长度:', processedText.length);
        }
        
        // 调用API处理问答
        answer.value = await apiClient.documentQA(processedText, question.value);
        
        // 保存到历史记录
        saveHistory('qa', question.value, answer.value);
        
        console.log('问答完成，回答长度:', answer.value.length);
      } catch (e) {
        console.error('处理问答时出错:', e);
        safeAlert('问答失败: ' + e.message);
      } finally {
        isProcessing.value = false;
      }
    }
    
    // 保存历史记录
    const saveHistory = (type, input, output) => {
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
    
    // 将答案插入到文档
    const insertToDocument = () => {
      try {
        if (!answer.value) return;
        
        if (window.Application.ActiveDocument) {
          const formattedAnswer = `\n问题: ${question.value}\n答案: ${answer.value}\n`;
          
          if (window.Application.ActiveDocument.Application && 
              window.Application.ActiveDocument.Application.Selection) {
            // 插入文本
            window.Application.ActiveDocument.Application.Selection.TypeText(formattedAnswer);
            safeAlert('已将问答结果插入到文档');
            
            // 关闭对话框
            closeDialog();
          } else {
            safeAlert('无法将文本插入到文档');
          }
        }
      } catch (e) {
        console.error('插入文本到文档失败:', e);
        safeAlert('插入失败: ' + e.message);
      }
    }
    
    // 重置问答
    const reset = () => {
      question.value = '';
      answer.value = '';
    }
    
    // 关闭对话框
    const closeDialog = () => {
      if (window.Application) {
        window.Application.CloseDialog();
      }
    }
    
    return {
      question,
      answer,
      isProcessing,
      selectedText,
      handleAsk,
      insertToDocument,
      reset,
      closeDialog
    }
  }
}
</script>

<style scoped>
.qa-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.qa-header {
  margin-bottom: 20px;
}

.qa-header h2 {
  margin: 0 0 10px 0;
  color: #2b579a;
}

.qa-info {
  color: #666;
  font-size: 14px;
}

.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.question-section {
  margin-bottom: 20px;
}

.label {
  font-weight: bold;
  margin-bottom: 8px;
}

.question-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 10px;
}

.ask-button {
  padding: 8px 15px;
  background-color: #2b579a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ask-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.answer-section {
  margin-top: 20px;
  flex: 1;
}

.answer-content {
  padding: 15px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 150px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 15px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 15px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.insert-btn {
  background-color: #4caf50;
  color: white;
}

.reset-btn {
  background-color: #f0f0f0;
  color: #333;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.spinner {
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

.qa-footer {
  margin-top: 20px;
  text-align: right;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.close-btn {
  padding: 8px 15px;
  background-color: #2b579a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style> 