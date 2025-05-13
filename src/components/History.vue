<template>
  <div class="history-container">
    <div class="history-header">
      <h2>WPS AI助手 - 历史记录</h2>
    </div>
    <div class="history-content">
      <div v-if="history.length === 0" class="empty-history">
        暂无历史记录
      </div>
      <div v-else class="history-list">
        <div v-for="(item, index) in history" :key="index" class="history-item">
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          <div class="history-type">{{ getOperationName(item.type) }}</div>
          <div class="history-text">
            <div class="input-text">
              <div class="text-label">输入:</div>
              <div class="text-content">{{ truncateText(item.input, 100) }}</div>
            </div>
            <div class="output-text">
              <div class="text-label">输出:</div>
              <div class="text-content">{{ truncateText(item.output, 150) }}</div>
            </div>
          </div>
          <div class="history-actions">
            <button @click="copyToClipboard(item.output)" class="action-btn copy-btn">复制结果</button>
            <button @click="reuse(item)" class="action-btn reuse-btn">重新使用</button>
          </div>
        </div>
      </div>
    </div>
    <div class="history-footer">
      <button @click="clearHistory" class="btn btn-warning" :disabled="history.length === 0">清空历史</button>
      <button @click="closeHistory" class="btn btn-primary">关闭</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const history = ref([]);
    
    // 在组件挂载时加载历史记录
    onMounted(() => {
      loadHistory();
    });
    
    // 从本地存储加载历史记录
    const loadHistory = () => {
      try {
        if (window.Application && window.Application.PluginStorage) {
          const historyStr = window.Application.PluginStorage.getItem('aiHistory');
          if (historyStr) {
            history.value = JSON.parse(historyStr);
            console.log('历史记录加载成功，共', history.value.length, '条记录');
          } else {
            console.log('未找到历史记录');
          }
        }
      } catch (e) {
        console.error('加载历史记录失败:', e);
      }
    };
    
    // 清空历史记录
    const clearHistory = () => {
      if (window.confirm('确定要清空所有历史记录吗？')) {
        try {
          if (window.Application && window.Application.PluginStorage) {
            window.Application.PluginStorage.setItem('aiHistory', '[]');
            history.value = [];
            console.log('历史记录已清空');
          }
        } catch (e) {
          console.error('清空历史记录失败:', e);
        }
      }
    };
    
    // 格式化时间
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
    };
    
    // 补零函数
    const padZero = (num) => {
      return num < 10 ? '0' + num : num;
    };
    
    // 获取操作类型名称
    const getOperationName = (type) => {
      const typeMap = {
        'continue': '文本续写',
        'proofread': '文本校对',
        'polish': '文本润色',
        'qa': '文档问答',
        'summarize': '文档摘要'
      };
      return typeMap[type] || '未知操作';
    };
    
    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    
    // 复制到剪贴板
    const copyToClipboard = (text) => {
      try {
        // 使用现代clipboard API
        navigator.clipboard.writeText(text).then(() => {
          window.Application.Alert('已复制到剪贴板');
        }).catch(err => {
          console.error('复制失败:', err);
          fallbackCopy(text);
        });
      } catch (e) {
        console.error('复制功能不可用:', e);
        fallbackCopy(text);
      }
    };
    
    // 后备复制方法
    const fallbackCopy = (text) => {
      try {
        // 创建临时文本区域
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          window.Application.Alert('已复制到剪贴板');
        } else {
          window.Application.Alert('复制失败，请手动复制');
        }
      } catch (e) {
        console.error('后备复制方法失败:', e);
        window.Application.Alert('复制功能不可用');
      }
    };
    
    // 重新使用历史记录
    const reuse = (item) => {
      // 这里可以调用对应功能的API
      window.Application.Alert(`即将重新${getOperationName(item.type)}，请在文档中选择位置`);
      closeHistory();
    };
    
    // 关闭历史记录对话框
    const closeHistory = () => {
      if (window.Application) {
        window.Application.CloseDialog();
      }
    };
    
    return {
      history,
      formatTime,
      getOperationName,
      truncateText,
      copyToClipboard,
      reuse,
      clearHistory,
      closeHistory
    };
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.history-header h2 {
  margin: 0;
  color: #2b579a;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.empty-history {
  text-align: center;
  color: #999;
  margin-top: 50px;
  font-size: 16px;
}

.history-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.history-time {
  color: #666;
  font-size: 12px;
  margin-bottom: 5px;
}

.history-type {
  font-weight: bold;
  color: #2b579a;
  margin-bottom: 10px;
  font-size: 16px;
}

.history-text {
  margin-bottom: 15px;
}

.input-text, .output-text {
  margin-bottom: 10px;
}

.text-label {
  font-weight: bold;
  margin-bottom: 3px;
}

.text-content {
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #eee;
  white-space: pre-wrap;
  word-break: break-word;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 5px 10px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.copy-btn {
  background-color: #4caf50;
  color: white;
}

.reuse-btn {
  background-color: #2b579a;
  color: white;
}

.history-footer {
  text-align: right;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 15px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #2b579a;
  color: white;
}

.btn-warning {
  background-color: #f44336;
  color: white;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 