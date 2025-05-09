<template>
  <div class="dialog-container">
    <div class="dialog-header">
      <h2>WPS AI助手 - 设置</h2>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label for="apiUrl">API 地址</label>
        <input type="text" id="apiUrl" v-model="config.apiUrl" placeholder="请输入AI服务API地址">
      </div>
      <div class="form-group">
        <label for="apiKey">API 密钥</label>
        <input type="password" id="apiKey" v-model="config.apiKey" placeholder="请输入API密钥">
      </div>
      <div class="form-group">
        <label for="model">默认模型</label>
        <select id="model" v-model="config.models.defaultModel">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button @click="saveConfig" class="btn-primary">保存</button>
      <button @click="closeDialog" class="btn-secondary">取消</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const config = ref({
      apiUrl: '',
      apiKey: '',
      models: {
        defaultModel: 'gpt-3.5-turbo',
        continuationModel: 'gpt-3.5-turbo',
        proofreadingModel: 'gpt-3.5-turbo',
        polishingModel: 'gpt-3.5-turbo',
        summarizationModel: 'gpt-3.5-turbo'
      },
      options: {
        maxTokens: 2000,
        temperature: 0.7
      }
    })

    onMounted(() => {
      // 从WPS本地存储加载配置
      if (window.Application && window.Application.PluginStorage) {
        const configStr = window.Application.PluginStorage.getItem('aiConfig')
        if (configStr) {
          try {
            const savedConfig = JSON.parse(configStr)
            config.value = { ...config.value, ...savedConfig }
          } catch (e) {
            console.error('配置加载失败', e)
          }
        }
      }
    })

    const saveConfig = () => {
      // 保存配置到WPS本地存储
      if (window.Application && window.Application.PluginStorage) {
        try {
          window.Application.PluginStorage.setItem('aiConfig', JSON.stringify(config.value))
          window.Application.Alert('配置已保存')
          closeDialog()
        } catch (e) {
          console.error('配置保存失败', e)
          window.Application.Alert('配置保存失败: ' + e.message)
        }
      }
    }

    const closeDialog = () => {
      if (window.Application) {
        window.Application.CloseDialog()
      }
    }

    return {
      config,
      saveConfig,
      closeDialog
    }
  }
}
</script>

<style scoped>
.dialog-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.dialog-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.dialog-content {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-footer {
  text-align: right;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-primary {
  background-color: #4a86e8;
  color: white;
}

.btn-secondary {
  background-color: #f1f1f1;
  color: #333;
}
</style> 