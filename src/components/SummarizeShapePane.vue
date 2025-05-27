<template>
  <div class="taskpane">
    <h3>概述形状文本</h3>
    <p><strong>选定形状:</strong> {{ shapeName || '未选择' }}</p>
    <div>
      <p><strong>原始文本:</strong></p>
      <textarea v-model="shapeText" rows="7" style="width: 100%;" readonly></textarea>
    </div>
    <button @click="fetchLiveShapeText" style="margin-top: 10px;">获取选定形状文本</button>
    
    <hr style="margin: 15px 0;">
    
    <button @click="getAISummary" :disabled="isLoading || !shapeText || shapeText === 'Shape has no text.' || shapeText === 'Selected shape does not contain text.' || shapeText === 'No shape selected.'" style="margin-top: 10px;">
      {{ isLoading ? '正在概述...' : 'AI概述' }}
    </button>
    
    <div v-if="summary" style="margin-top: 15px;">
      <h4>概述结果:</h4>
      <textarea v-model="summary" rows="7" style="width: 100%;" readonly></textarea>
      <button @click="copySummary" :disabled="!summary" style="margin-top: 5px;">复制概述</button>
    </div>
    
    <div v-if="error" style="color: red; margin-top: 10px;">
      <p>错误: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from './js/api.js'; // Adjust path if necessary

const props = defineProps({
  initialText: { type: String, default: '' },
  initialShapeName: { type: String, default: 'N/A' }
});

const shapeText = ref('');
const shapeName = ref('');
const summary = ref('');
const isLoading = ref(false);
const error = ref('');

const getWppApp = () => typeof window.wpp !== 'undefined' ? window.wpp : null;

const fetchLiveShapeText = () => {
  error.value = '';
  summary.value = ''; // Clear previous summary
  const wppApp = getWppApp();
  if (wppApp && wppApp.Application && wppApp.Application.ActiveWindow) {
    try {
      const selection = wppApp.Application.ActiveWindow.Selection;
      if (selection && selection.Type === 2 /* wppSelectionShapes */ && selection.ShapeRange) { // Assuming Type 2 is for shapes
        const shapeRange = selection.ShapeRange;
        if (shapeRange.Count > 0) {
          const shape = shapeRange.Item(1); // Use Item(1) as ShapeRange is 1-indexed
          shapeName.value = shape.Name || "Unnamed Shape";
          if (shape.HasTextFrame && shape.TextFrame.HasText) {
            shapeText.value = shape.TextFrame.TextRange.Text || "";
          } else {
            shapeText.value = "Selected shape does not contain text.";
          }
        } else {
          shapeText.value = "No shape selected.";
          shapeName.value = "N/A";
        }
      } else {
         shapeText.value = "No shape selected or selection is not a ShapeRange.";
         shapeName.value = "N/A";
      }
    } catch (e) {
      console.error("Error fetching live shape text from WPP:", e);
      shapeText.value = "";
      shapeName.value = "N/A";
      error.value = "读取形状文本时出错: " + e.message;
    }
  } else {
    error.value = "WPS演示 (WPP) API不可用。";
    if (import.meta.env.DEV) { // Fallback for testing
        shapeText.value = "开发模式: 这是一个形状中的示例文本内容。";
        shapeName.value = "Rectangle 1 (Dev)";
    }
  }
};

const getAISummary = async () => {
  if (!shapeText.value || shapeText.value === 'Shape has no text.' || shapeText.value === 'Selected shape does not contain text.' || shapeText.value === 'No shape selected.') {
    error.value = "形状中文本内容为空或无效，无法概述。";
    return;
  }
  isLoading.value = true;
  error.value = '';
  summary.value = '';

  if (window.aiConfig) {
    apiClient.updateConfig(window.aiConfig);
  } else {
    error.value = "AI配置未加载。";
    isLoading.value = false;
    if (import.meta.env.DEV) { // Dev fallback
        setTimeout(() => {
            summary.value = `DEV MODE: AI 概述对于 "${shapeText.value.substring(0,50)}..."`;
            isLoading.value = false;
        }, 1000);
    }
    return;
  }

  try {
    const result = await apiClient.summarizeText(shapeText.value); // Using existing summarizeText
    summary.value = result;
  } catch (err) {
    console.error("AI summary error:", err);
    error.value = err.message || "获取AI概述时发生未知错误。";
  } finally {
    isLoading.value = false;
  }
};

const copySummary = () => {
  if(summary.value) {
    navigator.clipboard.writeText(summary.value)
      .then(() => { alert("概述已复制到剪贴板"); })
      .catch(err => { alert("复制失败: " + err); });
  }
};

onMounted(() => {
  shapeText.value = props.initialText || '';
  shapeName.value = props.initialShapeName || 'N/A';
  if (!props.initialText) { // If opened directly or without valid initial text
    fetchLiveShapeText();
  } else {
    console.log("SummarizeShapePane mounted with props. Shape:", shapeName.value, "Text:", shapeText.value);
  }
});
</script>

<style scoped>
.taskpane {
  padding: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
.taskpane h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}
.taskpane p {
  margin: 8px 0;
}
.taskpane strong {
  font-weight: 600;
  color: #555;
}
textarea {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.95em;
  width: 100%; /* Ensure textareas take full width */
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #0078d4; /* WPS Blue */
  color: white;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #005a9e; /* Darker blue */
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
hr {
  border: none;
  border-top: 1px solid #eee;
}
.error-message p {
    color: #D8000C; /* Error red */
    background-color: #FFD2D2; /* Light red background */
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #D8000C;
}
</style>
