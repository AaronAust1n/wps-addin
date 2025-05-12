<template>
  <div class="dialog-container">
    <div class="dialog-header">
      <h2>WPS AI助手 - 设置</h2>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label for="apiUrl">API 地址 <span class="required">*</span></label>
        <input type="text" id="apiUrl" v-model="config.apiUrl" placeholder="请输入AI服务API地址，例如: https://api.openai.com">
        <div class="help-text">支持OpenAI API格式的服务，如OpenAI、Azure OpenAI、私有部署模型等</div>
      </div>
      <div class="form-group">
        <label for="apiKey">API 密钥</label>
        <input type="password" id="apiKey" v-model="config.apiKey" placeholder="请输入API密钥（可选，部分API服务不需要）">
      </div>
      <div class="form-group">
        <label for="model">默认模型</label>
        <select id="model" v-model="config.models.defaultModel">
          <optgroup label="OpenAI">
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </optgroup>
          <optgroup label="Google">
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </optgroup>
          <optgroup label="阿里云">
            <option value="qwen-turbo">Qwen Turbo</option>
            <option value="qwen-plus">Qwen Plus</option>
            <option value="qwen-max">Qwen Max</option>
          </optgroup>
          <optgroup label="百度">
            <option value="ernie-bot-4">文心一言 ERNIE Bot 4.0</option>
            <option value="ernie-bot">文心一言 ERNIE Bot</option>
          </optgroup>
          <optgroup label="其他">
            <option value="deepseek-chat">DeepSeek Chat</option>
            <option value="llama-3-70b">Llama 3 70B</option>
            <option value="custom">自定义</option>
          </optgroup>
        </select>
      </div>
      <div class="form-group" v-if="config.models.defaultModel === 'custom'">
        <label for="customModel">自定义模型名称</label>
        <input type="text" id="customModel" v-model="config.models.customModel" placeholder="请输入模型名称">
      </div>
      <div class="advanced-settings">
        <div class="section-title" @click="toggleAdvanced">
          高级设置 <span class="toggle-icon">{{ advancedOpen ? '▼' : '►' }}</span>
        </div>
        <div class="advanced-content" v-if="advancedOpen">
          <div class="form-group">
            <label for="maxTokens">最大输出令牌数</label>
            <input type="number" id="maxTokens" v-model.number="config.options.maxTokens" min="100" max="32000">
          </div>
          <div class="form-group">
            <label for="temperature">随机性 (0.0-1.0)</label>
            <input type="range" id="temperature" v-model.number="config.options.temperature" min="0" max="1" step="0.1">
            <div class="range-value">{{ config.options.temperature }}</div>
          </div>
          <div class="form-group">
            <label>特定功能模型设置</label>
            <div class="sub-setting">
              <label for="continuationModel">文本续写</label>
              <select id="continuationModel" v-model="config.models.continuationModel">
                <option value="">使用默认模型</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="qwen-plus">Qwen Plus</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="proofreadingModel">文本校对</label>
              <select id="proofreadingModel" v-model="config.models.proofreadingModel">
                <option value="">使用默认模型</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="qwen-plus">Qwen Plus</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="polishingModel">文本润色</label>
              <select id="polishingModel" v-model="config.models.polishingModel">
                <option value="">使用默认模型</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="qwen-plus">Qwen Plus</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="summarizationModel">文本摘要/全文总结</label>
              <select id="summarizationModel" v-model="config.models.summarizationModel">
                <option value="">使用默认模型</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="qwen-plus">Qwen Plus</option>
              </select>
            </div>
          </div>
        </div>
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
        customModel: '',
        continuationModel: '',
        proofreadingModel: '',
        polishingModel: '',
        summarizationModel: ''
      },
      options: {
        maxTokens: 2000,
        temperature: 0.7
      }
    })
    
    const advancedOpen = ref(false)
    
    const toggleAdvanced = () => {
      advancedOpen.value = !advancedOpen.value
    }

    onMounted(() => {
      // 从WPS本地存储加载配置
      if (window.Application && window.Application.PluginStorage) {
        const configStr = window.Application.PluginStorage.getItem('aiConfig')
        if (configStr) {
          try {
            const savedConfig = JSON.parse(configStr)
            config.value = { 
              ...config.value, 
              ...savedConfig,
              models: { ...config.value.models, ...savedConfig.models },
              options: { ...config.value.options, ...savedConfig.options }
            }
          } catch (e) {
            console.error('配置加载失败', e)
          }
        }
      }
    })

    const saveConfig = () => {
      // 保存前检查必填项
      if (!config.value.apiUrl) {
        window.Application.Alert('请填写API地址')
        return
      }
      
      // 检查自定义模型名称
      if (config.value.models.defaultModel === 'custom' && !config.value.models.customModel) {
        window.Application.Alert('请填写自定义模型名称')
        return
      }
      
      // 如果选择了自定义模型，更新默认模型为自定义模型名称
      if (config.value.models.defaultModel === 'custom') {
        config.value.models.defaultModel = config.value.models.customModel
      }
      
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
      advancedOpen,
      toggleAdvanced,
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
  max-height: 450px;
  overflow-y: auto;
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

.required {
  color: red;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.advanced-settings {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.section-title {
  padding: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.toggle-icon {
  float: right;
}

.advanced-content {
  padding: 15px;
  border-top: 1px solid #eee;
}

.range-value {
  text-align: center;
  margin-top: 5px;
}

.sub-setting {
  margin-bottom: 10px;
  padding-left: 10px;
}

.sub-setting label {
  font-weight: normal;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
  border-top: 1px solid #eee;
  padding-top: 15px;
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