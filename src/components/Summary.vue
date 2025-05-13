<template>
  <div class="summary-container">
    <div class="summary-header">
      <h2>文档摘要</h2>
      <div class="summary-info" v-if="sourceText">已处理{{ sourceText.length }}个字符</div>
      <div class="summary-info" v-else>未能获取文档内容</div>
    </div>
    
    <div class="summary-content">
      <div class="summary-section" v-if="!isProcessing && !result">
        <div class="label">请选择操作：</div>
        <div class="button-group">
          <button @click="handleSummarize('selection')" class="action-btn" :disabled="!sourceText">摘要选中内容</button>
          <button @click="handleSummarize('document')" class="action-btn">摘要全文</button>
        </div>
      </div>
      
      <div class="result-section" v-if="result">
        <div class="label">摘要结果：</div>
        <div class="result-content">{{ result }}</div>
        
        <div class="actions">
          <button @click="insertToDocument" class="action-btn insert-btn">插入到文档</button>
          <button @click="reset" class="action-btn reset-btn">重新生成</button>
        </div>
      </div>
      
      <div class="loading" v-if="isProcessing">
        <div class="spinner"></div>
        <div>正在生成摘要，请稍候...</div>
      </div>
    </div>
    
    <div class="summary-footer">
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
    const route = useRoute();
    const sourceText = ref('');
    const result = ref('');
    const isProcessing = ref(false);
    const fullDocument = ref('');
    const mode = ref('');
    
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
          // 默认使用选中文本
          mode.value = route.query.mode || 'selection';
          
          if (mode.value === 'selection') {
            // 尝试获取选中文本
            if (window.Application.ActiveDocument.Application && 
                window.Application.ActiveDocument.Application.Selection) {
              const selection = window.Application.ActiveDocument.Application.Selection.Text;
              if (selection && selection.trim()) {
                sourceText.value = selection;
                console.log('已获取选中文本，长度:', sourceText.value.length);
                
                // 自动开始处理选中文本
                if (sourceText.value) {
                  handleSummarize('selection');
                }
              }
            }
          } else if (mode.value === 'document') {
            // 获取整个文档
            if (window.Application.ActiveDocument.Range) {
              fullDocument.value = window.Application.ActiveDocument.Range().Text;
              console.log('已获取整个文档内容，长度:', fullDocument.value.length);
              
              // 自动开始处理全文
              handleSummarize('document');
            }
          }
        } catch (e) {
          console.error('获取文档内容失败:', e);
        }
      }
    });
    
    // 处理摘要请求
    const handleSummarize = async (summaryMode) => {
      if (isProcessing.value) return;
      
      isProcessing.value = true;
      result.value = '';
      
      try {
        let textToProcess = '';
        
        if (summaryMode === 'selection') {
          textToProcess = sourceText.value;
          if (!textToProcess) {
            // 尝试重新获取选中文本
            if (window.Application.ActiveDocument.Application && 
                window.Application.ActiveDocument.Application.Selection) {
              textToProcess = window.Application.ActiveDocument.Application.Selection.Text;
              sourceText.value = textToProcess;
            }
          }
        } else {
          textToProcess = fullDocument.value;
          if (!textToProcess) {
            // 尝试获取整个文档
            if (window.Application.ActiveDocument.Range) {
              textToProcess = window.Application.ActiveDocument.Range().Text;
              fullDocument.value = textToProcess;
            }
          }
        }
        
        if (!textToProcess) {
          safeAlert(`无法获取${summaryMode === 'selection' ? '选中文本' : '全文'}，请确保文档已打开并且有可用内容`);
          isProcessing.value = false;
          return;
        }
        
        // 长文本处理：如果内容过长，进行智能截断
        let processedText = textToProcess;
        const maxLength = 8000; // 根据模型容量调整
        
        if (textToProcess.length > maxLength) {
          console.warn(`文本内容过长(${textToProcess.length}字符)，将进行智能截断`);
          
          // 基于段落的分段策略
          const paragraphs = textToProcess.split(/\n\s*\n/);
          console.log(`文本分为${paragraphs.length}个段落`);
          
          // 如果段落太多，进行分批处理
          if (paragraphs.length > 20) {
            // 分批处理段落
            const batchSize = 5; // 每批处理的段落数
            const batches = [];
            
            for (let i = 0; i < paragraphs.length; i += batchSize) {
              batches.push(paragraphs.slice(i, i + batchSize).join('\n\n'));
            }
            
            console.log(`分为${batches.length}批进行处理`);
            
            // 依次处理每批段落并生成摘要
            const batchSummaries = [];
            for (let i = 0; i < batches.length; i++) {
              console.log(`处理第${i+1}/${batches.length}批段落`);
              const batchText = batches[i];
              
              try {
                const batchSummary = await apiClient.summarizeText(batchText);
                batchSummaries.push(batchSummary);
              } catch (batchError) {
                console.error(`第${i+1}批段落处理失败:`, batchError);
                batchSummaries.push(`[第${i+1}部分处理失败]`);
              }
            }
            
            // 合并所有批次的摘要
            const combinedSummary = batchSummaries.join('\n\n');
            
            // 如果合并后的摘要仍然很长，进行二次摘要
            if (combinedSummary.length > 2000) {
              console.log('生成的摘要仍然较长，进行二次摘要');
              result.value = await apiClient.summarizeText(combinedSummary);
            } else {
              result.value = combinedSummary;
            }
          } else {
            // 直接做一次摘要
            result.value = await apiClient.summarizeText(textToProcess);
          }
        } else {
          // 文本不太长，直接处理
          result.value = await apiClient.summarizeText(textToProcess);
        }
        
        // 保存到历史记录
        saveHistory('summarize', summaryMode === 'selection' ? '选中文本摘要' : '全文摘要', result.value);
        
        console.log('摘要生成完成，结果长度:', result.value.length);
      } catch (e) {
        console.error('处理摘要时出错:', e);
        safeAlert('摘要生成失败: ' + e.message);
      } finally {
        isProcessing.value = false;
      }
    };
    
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
    };
    
    // 将摘要插入到文档
    const insertToDocument = () => {
      try {
        if (!result.value) return;
        
        if (window.Application.ActiveDocument) {
          const formattedResult = `\n【摘要】\n${result.value}\n`;
          
          if (window.Application.ActiveDocument.Application && 
              window.Application.ActiveDocument.Application.Selection) {
            // 插入文本
            window.Application.ActiveDocument.Application.Selection.TypeText(formattedResult);
            safeAlert('已将摘要结果插入到文档');
            
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
    };
    
    // 重置生成
    const reset = () => {
      result.value = '';
    };
    
    // 关闭对话框
    const closeDialog = () => {
      if (window.Application) {
        window.Application.CloseDialog();
      }
    };
    
    return {
      sourceText,
      result,
      isProcessing,
      handleSummarize,
      insertToDocument,
      reset,
      closeDialog
    };
  }
}
</script>

<style scoped>
.summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.summary-header {
  margin-bottom: 20px;
}

.summary-header h2 {
  margin: 0 0 10px 0;
  color: #2b579a;
}

.summary-info {
  color: #666;
  font-size: 14px;
}

.summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.summary-section {
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.label {
  font-weight: bold;
  margin-bottom: 8px;
}

.result-section {
  margin-top: 20px;
  flex: 1;
}

.result-content {
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
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2b579a;
  color: white;
  margin-left: 10px;
}

.action-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.insert-btn {
  background-color: #4caf50;
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

.summary-footer {
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