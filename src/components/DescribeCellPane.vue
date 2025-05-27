<template>
  <div class="taskpane">
    <h3>单元格描述</h3>
    <div>
      <p><strong>当前单元格地址:</strong> {{ currentCellAddress || '未选择' }}</p>
      <p><strong>当前单元格内容:</strong></p>
      <textarea v-model="currentCellValue" rows="3" style="width: 100%;" readonly></textarea>
    </div>
    <button @click="fetchLiveCellData" style="margin-top: 10px;">获取单元格实时内容</button>
    
    <hr style="margin: 15px 0;">
    
    <button @click="getAIDescription" :disabled="isLoading || !currentCellValue" style="margin-top: 10px;">
      {{ isLoading ? '正在获取描述...' : 'AI描述内容' }}
    </button>
    
    <div v-if="aiDescription" style="margin-top: 15px;">
      <h4>AI分析结果:</h4>
      <textarea v-model="aiDescription" rows="5" style="width: 100%;" readonly></textarea>
    </div>
    
    <div v-if="error" style="color: red; margin-top: 10px;">
      <p>错误: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from './js/api.js'; // Ensure this path is correct

const props = defineProps({
  initialValue: { type: String, default: '' },
  initialAddress: { type: String, default: '' }
});

const currentCellValue = ref('');
const currentCellAddress = ref('');
const aiDescription = ref('');
const isLoading = ref(false);
const error = ref('');

const getWpsApp = () => typeof wps !== 'undefined' ? wps : (typeof WPS !== 'undefined' ? WPS : null);
const getEtApp = () => typeof window.et !== 'undefined' ? window.et : null;

const fetchLiveCellData = () => {
  error.value = '';
  aiDescription.value = ''; // Clear previous description
  const etApp = getEtApp();
  if (etApp && etApp.Application) {
    try {
      let selection = etApp.Application.Selection;
      if (selection) {
        // Attempt to get Text and Address. These are speculative based on common API patterns.
        // More robust error handling or specific API knowledge might be needed.
        currentCellValue.value = selection.Text || ''; // Or selection.Value, selection.Formula
        currentCellAddress.value = selection.Address || '未知地址';
        
        // If it's a multi-cell range, Text might be the first cell or an array.
        // For simplicity, we assume single cell or first cell's text.
        // ActiveCell might be more reliable for single cell context.
        if (etApp.Application.ActiveCell && (!currentCellValue.value || currentCellAddress.value === '未知地址')) {
            currentCellValue.value = etApp.Application.ActiveCell.Text || '';
            currentCellAddress.value = etApp.Application.ActiveCell.Address || '未知地址';
        }

        if (!currentCellValue.value && !currentCellAddress.value && currentCellAddress.value !== '未知地址') { // Allow empty value if address is known
             error.value = "请在表格中选择一个单元格。";
        }
      } else {
        error.value = "无法获取选区。请在表格中选择一个单元格。";
      }
    } catch (e) {
      console.error("Error fetching live cell data from ET:", e);
      error.value = "读取单元格数据时出错: " + e.message;
    }
  } else {
    error.value = "WPS表格 (ET) API不可用。";
    // Fallback for testing
    if (import.meta.env.DEV) {
        currentCellValue.value = "开发模式: 实时单元格内容";
        currentCellAddress.value = "A1 (Dev)";
    }
  }
};

const getAIDescription = async () => {
  if (!currentCellValue.value && currentCellAddress.value === '未知地址') { // only error if both are empty or address is unknown
    error.value = "单元格内容为空或未选择单元格，无法获取描述。";
    return;
  }
  isLoading.value = true;
  error.value = '';
  aiDescription.value = '';

  if (window.aiConfig) {
    apiClient.updateConfig(window.aiConfig);
  } else {
    error.value = "AI配置未加载。";
    isLoading.value = false;
     if (import.meta.env.DEV) { // Dev fallback
        setTimeout(() => {
            aiDescription.value = `DEV MODE: AI描述对于 "${currentCellValue.value.substring(0,50)}..."`;
            isLoading.value = false;
        }, 1000);
    }
    return;
  }

  try {
    // Using paraphraseText for now, can create a dedicated 'describeData' if needed
    const prompt = "请对以下数据进行简要描述: " + (currentCellValue.value || "空单元格");
    // Pass 'describe' as mode, or handle it inside paraphraseText/create new method
    const result = await apiClient.paraphraseText((currentCellValue.value || "空单元格"), 'custom', prompt); 
    aiDescription.value = result;
  } catch (err) {
    console.error("AI description error:", err);
    error.value = err.message || "获取AI描述时发生未知错误。";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  currentCellValue.value = props.initialValue || '';
  currentCellAddress.value = props.initialAddress || '';
  if (!currentCellValue.value && !currentCellAddress.value) {
    // If opened directly without params (e.g. dev mode direct route)
    fetchLiveCellData();
  } else {
    console.log("DescribeCellPane mounted with props. Address:", currentCellAddress.value, "Value:", currentCellValue.value);
  }
});
</script>

<style scoped>
.taskpane {
  padding: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 14px;
}
.taskpane h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}
.taskpane p {
  margin: 5px 0;
}
.taskpane strong {
  font-weight: 600;
}
textarea {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 1em;
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #0078d4;
  color: white;
  cursor: pointer;
  font-size: 1em;
}
button:hover {
  background-color: #005a9e;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
hr {
  border: none;
  border-top: 1px solid #eee;
}
</style>
