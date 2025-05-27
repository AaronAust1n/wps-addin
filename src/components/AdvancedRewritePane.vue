<template>
  <div class="advanced-rewrite-pane">
    <h2>高级改写</h2>

    <div class="section original-text-section">
      <h3>原文：</h3>
      <textarea v-model="selectedText" readonly rows="5" placeholder="将从文档中加载选中的文本..."></textarea>
      <button @click="fetchSelectedText" :disabled="isLoading" class="action-button refresh-button">刷新选中</button>
    </div>

    <div class="section rewrite-options-section">
      <h3>改写选项：</h3>
      <div class="rewrite-modes">
        <label>
          <input type="radio" v-model="rewriteMode" value="simplify" :disabled="isLoading"> 简化
        </label>
        <label>
          <input type="radio" v-model="rewriteMode" value="expand" :disabled="isLoading"> 扩写
        </label>
        <label>
          <input type="radio" v-model="rewriteMode" value="formalize" :disabled="isLoading"> 正式
        </label>
        <label>
          <input type="radio" v-model="rewriteMode" value="casualize" :disabled="isLoading"> 口语化
        </label>
        <label>
          <input type="radio" v-model="rewriteMode" value="custom" :disabled="isLoading"> 自定义
        </label>
      </div>
      <textarea 
        v-if="rewriteMode === 'custom'" 
        v-model="customPrompt" 
        rows="3" 
        placeholder="请输入自定义改写要求，例如：请将以下内容改写为一首古诗..."
        :disabled="isLoading"
        class="custom-prompt-area"
      ></textarea>
    </div>

    <button @click="handleRewrite" :disabled="isLoading || !selectedText.trim()" class="action-button rewrite-button">
      {{ isLoading ? '正在改写...' : '开始改写' }}
    </button>

    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>AI正在努力创作中...</p>
    </div>

    <div v-if="error" class="error-message">
      <p>错误：{{ error }}</p>
    </div>

    <div v-if="rewrittenText && !isLoading" class="section rewritten-text-section">
      <h3>改写结果：</h3>
      <textarea v-model="rewrittenText" readonly rows="8"></textarea>
      <div class="result-actions">
        <button @click="replaceOriginal" class="action-button">替换原文</button>
        <button @click="copyToClipboard" class="action-button">复制内容</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from './js/api.js';

const getWpsApp = () => typeof wps !== 'undefined' ? wps : (typeof WPS !== 'undefined' ? WPS : null);

const selectedText = ref('');
const rewriteMode = ref('simplify'); // Default mode
const customPrompt = ref('');
const isLoading = ref(false);
const rewrittenText = ref('');
const error = ref('');

const fetchSelectedText = () => {
  const app = getWpsApp();
  error.value = ''; // Clear previous error
  if (app && app.Application && app.Application.ActiveDocument && app.Application.ActiveDocument.Selection) {
    selectedText.value = app.Application.ActiveDocument.Selection.Text || "";
    if (!selectedText.value && !import.meta.env.DEV) { // Don't show this error in dev if using fallback
      error.value = "请先在文档中选中文本，然后再打开此面板或点击刷新。";
    }
  } else {
    selectedText.value = ""; // Default to empty if API not available
    if (!import.meta.env.DEV) { // Only show error if not in dev
        error.value = "WPS API似乎不可用。";
    }
  }
  // Fallback for easier testing in browser during development
  if (import.meta.env.DEV && !selectedText.value) {
    selectedText.value = "这是在开发环境中用于测试的示例文本。请在WPS中实际选中内容进行测试。";
    console.log("AdvancedRewritePane: Using fallback selected text for DEV mode.");
  }
};

const handleRewrite = async () => {
  if (!selectedText.value) {
    error.value = "没有选中的文本可供改写。";
    return;
  }
  isLoading.value = true;
  error.value = '';
  rewrittenText.value = ''; // Clear previous result

  // Ensure apiClient is configured. window.aiConfig should be set up in main.js or similar
  if (window.aiConfig) {
    apiClient.updateConfig(window.aiConfig);
  } else {
    error.value = "AI配置未加载，请检查主程序设置。";
    isLoading.value = false;
    if(import.meta.env.DEV) { // Dev fallback
        setTimeout(() => {
            rewrittenText.value = `DEV MODE: 改写模式 '${rewriteMode.value}' 应用于: "${selectedText.value.substring(0,50)}..."` + (customPrompt.value ? ` 自定义指令: "${customPrompt.value}"` : "");
            isLoading.value = false;
        }, 1000);
    }
    return;
  }

  try {
    const result = await apiClient.paraphraseText(selectedText.value, rewriteMode.value, customPrompt.value);
    rewrittenText.value = result;
  } catch (err) {
    console.error("Paraphrase error:", err);
    error.value = err.message || "改写时发生未知错误。";
  } finally {
    isLoading.value = false;
  }
};

const replaceOriginal = () => {
  const app = getWpsApp();
  error.value = ''; // Clear previous error
  if (!rewrittenText.value) {
    error.value = "没有可用于替换的改写文本。";
    return;
  }
  if (app && app.Application && app.Application.ActiveDocument && app.Application.ActiveDocument.Selection) {
    try {
        // Check if there is a selection to replace
        if (app.Application.ActiveDocument.Selection.Text !== null && app.Application.ActiveDocument.Selection.Text !== undefined) {
             app.Application.ActiveDocument.Selection.Text = rewrittenText.value;
        } else {
             // If nothing is selected, perhaps insert at cursor? Or show error.
             // For now, assume selection must exist.
             error.value = "请在文档中保持文本选中状态以进行替换。";
        }
    } catch (e) {
        console.error("Error replacing text:", e);
        error.value = "替换原文失败: " + e.message;
    }
  } else {
    error.value = "无法替换文本 (WPS API不可用)";
    if(import.meta.env.DEV){ // Dev fallback
        console.log(`DEV MODE: Original text would be replaced with: "${rewrittenText.value}"`);
        alert("文本已替换 (模拟)");
    }
  }
};

const copyToClipboard = () => {
  if (!rewrittenText.value) return;
  navigator.clipboard.writeText(rewrittenText.value)
    .then(() => {
      alert("已复制到剪贴板！");
      console.log("Text copied to clipboard.");
    })
    .catch(err => {
      alert("复制失败: " + err);
      console.error("Failed to copy text: ", err);
    });
};

onMounted(() => {
  fetchSelectedText();
});
</script>

<style scoped>
.advanced-rewrite-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.section {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
  font-size: 1.1em;
}

textarea {
  width: calc(100% - 20px); /* Full width minus padding */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
  min-height: 60px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.rewrite-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.rewrite-modes label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rewrite-modes label:hover {
  background-color: #e0e0e0;
}

.rewrite-modes input[type="radio"] {
  margin-right: 5px;
}

.custom-prompt-area {
  margin-top: 10px;
}

.action-button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #0056b3;
}

.action-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.rewrite-button {
  background-color: #28a745;
}
.rewrite-button:hover {
  background-color: #1e7e34;
}


.refresh-button {
  background-color: #6c757d;
  font-size: 0.9em;
  padding: 8px 12px;
}
.refresh-button:hover {
  background-color: #545b62;
}


.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #D8000C;
  background-color: #FFD2D2;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #D8000C;
}

.rewritten-text-section textarea {
  min-height: 100px;
  background-color: #e9f5ff; /* Light blue background for results */
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.result-actions .action-button {
  flex-grow: 1; /* Make buttons share space */
}
</style>
