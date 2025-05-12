<template>
  <div class="dialog-container">
    <div class="dialog-header">
      <h2>WPS AI助手 - 设置</h2>
    </div>
    <div class="dialog-content">
      <div class="form-group">
        <label for="apiUrl">API 地址 <span class="required">*</span></label>
        <input type="text" id="apiUrl" v-model="config.apiUrl" class="full-border-input" placeholder="请输入AI服务API地址，例如: https://api.openai.com">
        <div class="help-text">支持OpenAI API格式的服务，如OpenAI、Azure OpenAI、私有部署模型等</div>
      </div>
      <div class="form-group">
        <label for="apiKey">API 密钥</label>
        <input type="password" id="apiKey" v-model="config.apiKey" class="full-border-input" placeholder="请输入API密钥（可选，部分API服务不需要）">
      </div>
      <div class="form-group">
        <label for="model">默认模型</label>
        <select id="model" v-model="config.models.defaultModel" class="full-border-input">
          <optgroup label="OpenAI">
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="gpt-4.5-preview">GPT-4.5 Preview</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
          </optgroup>
          <optgroup label="Google">
            <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
            <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash Preview</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </optgroup>
          <optgroup label="混合">
            <option value="o4-mini">O4-mini</option>
            <option value="o1">O1</option>
            <option value="grok-3-beta">Grok-3-beta</option>
          </optgroup>
          <optgroup label="DeepSeek">
            <option value="deepseek-r1">DeepSeek-R1</option>
            <option value="deepseek-v3-0324">DeepSeek-V3-0324</option>
          </optgroup>
          <optgroup label="阿里云">
            <option value="qwen3-235b-a22b">Qwen3-235b-a22b</option>
            <option value="qwen3-30b-a3b">Qwen3-30b-a3b</option>
            <option value="qwen3-32b">Qwen3-32b</option>
            <option value="qwen3-14b">Qwen3-14b</option>
            <option value="qwq-32b">QWQ-32b</option>
            <option value="qwen2.5-72b-instruct">Qwen2.5-72b-instruct</option>
            <option value="qwen2.5-32b-instruct">Qwen2.5-32b-instruct</option>
            <option value="qwen2.5-14b-instruct">Qwen2.5-14b-instruct</option>
          </optgroup>
          <optgroup label="其他">
            <option value="custom">自定义...</option>
          </optgroup>
        </select>
      </div>
      <div class="form-group" v-if="config.models.defaultModel === 'custom'">
        <label for="customModel">自定义模型名称</label>
        <input type="text" id="customModel" v-model="config.models.customModel" class="full-border-input" placeholder="请输入模型名称">
      </div>
      <div class="test-connection-group">
        <button @click="testConnection" class="btn-test">检测连通性</button>
        <span v-if="testStatus" :class="['test-status', testStatus === 'success' ? 'success' : 'error']">{{ testMessage }}</span>
      </div>
      <div class="advanced-settings">
        <div class="section-title" @click="toggleAdvanced">
          高级设置 <span class="toggle-icon">{{ advancedOpen ? '▼' : '►' }}</span>
        </div>
        <div class="advanced-content" v-if="advancedOpen">
          <div class="form-group">
            <label for="maxTokens">最大输出令牌数</label>
            <input type="number" id="maxTokens" v-model.number="config.options.maxTokens" min="100" max="32000" class="full-border-input">
          </div>
          <div class="form-group">
            <label for="temperature">随机性 (0.0-1.0)</label>
            <input type="range" id="temperature" v-model.number="config.options.temperature" min="0" max="1" step="0.1" class="full-border-input">
            <div class="range-value">{{ config.options.temperature }}</div>
          </div>
          <div class="form-group">
            <label>特定功能模型设置</label>
            <div class="sub-setting">
              <label for="continuationModel">文本续写</label>
              <select id="continuationModel" v-model="config.models.continuationModel" class="full-border-input">
                <option value="">使用默认模型</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
                <option value="qwen3-32b">Qwen3-32b</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="proofreadingModel">文本校对</label>
              <select id="proofreadingModel" v-model="config.models.proofreadingModel" class="full-border-input">
                <option value="">使用默认模型</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
                <option value="qwen3-32b">Qwen3-32b</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="polishingModel">文本润色</label>
              <select id="polishingModel" v-model="config.models.polishingModel" class="full-border-input">
                <option value="">使用默认模型</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
                <option value="qwen3-32b">Qwen3-32b</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="qaModel">文档问答</label>
              <select id="qaModel" v-model="config.models.qaModel" class="full-border-input">
                <option value="">使用默认模型</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
                <option value="qwen3-32b">Qwen3-32b</option>
              </select>
            </div>
            <div class="sub-setting">
              <label for="summarizationModel">全文总结</label>
              <select id="summarizationModel" v-model="config.models.summarizationModel" class="full-border-input">
                <option value="">使用默认模型</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro Preview</option>
                <option value="qwen3-32b">Qwen3-32b</option>
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
import apiClient from './js/api.js'

export default {
  setup() {
    const config = ref({
      apiUrl: '',
      apiKey: '',
      models: {
        defaultModel: 'gpt-4.1',
        customModel: '',
        continuationModel: '',
        proofreadingModel: '',
        polishingModel: '',
        qaModel: '',
        summarizationModel: ''
      },
      options: {
        maxTokens: 2000,
        temperature: 0.7
      }
    })
    
    const advancedOpen = ref(false)
    const testStatus = ref('') // 'success' or 'error'
    const testMessage = ref('')
    
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

    const testConnection = async () => {
      // 保存前检查API地址
      if (!config.value.apiUrl) {
        window.Application.Alert('请填写API地址')
        return
      }
      
      // 初始化测试状态
      testStatus.value = 'testing'
      testMessage.value = '正在测试连接...'
      
      // 获取实际使用的模型
      let model = config.value.models.defaultModel
      if (model === 'custom' && config.value.models.customModel) {
        model = config.value.models.customModel
      } else if (model === 'custom' && !config.value.models.customModel) {
        testStatus.value = 'error'
        testMessage.value = '请填写自定义模型名称'
        return
      }
      
      try {
        // 临时更新API客户端配置
        apiClient.updateConfig({
          apiUrl: config.value.apiUrl,
          apiKey: config.value.apiKey,
          models: {
            defaultModel: model
          }
        })
        
        // 发送测试请求
        await apiClient.testConnection()
        
        // 测试成功
        testStatus.value = 'success'
        testMessage.value = '连接成功！'
      } catch (error) {
        // 测试失败
        testStatus.value = 'error'
        testMessage.value = `连接失败: ${error.message}`
      }
    }

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
      
      // 如果选择了自定义模型，更新实际的默认模型值为自定义模型名称
      const actualConfig = JSON.parse(JSON.stringify(config.value))
      if (actualConfig.models.defaultModel === 'custom') {
        actualConfig.models.defaultModel = actualConfig.models.customModel
      }
      
      // 保存配置到WPS本地存储
      if (window.Application && window.Application.PluginStorage) {
        try {
          window.Application.PluginStorage.setItem('aiConfig', JSON.stringify(actualConfig))
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
      testStatus,
      testMessage,
      toggleAdvanced,
      testConnection,
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

.full-border-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.required {
  color: #f00;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 3px;
}

.advanced-settings {
  margin-top: 20px;
}

.section-title {
  font-weight: bold;
  cursor: pointer;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.toggle-icon {
  float: right;
}

.advanced-content {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.sub-setting {
  margin-bottom: 10px;
}

.sub-setting label {
  font-weight: normal;
}

.range-value {
  text-align: center;
  margin-top: 5px;
}

.dialog-footer {
  text-align: right;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

button {
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

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-test {
  background-color: #4caf50;
  color: white;
  margin-left: 0;
}

.test-connection-group {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.test-status {
  margin-left: 10px;
  font-size: 14px;
}

.success {
  color: #4caf50;
}

.error {
  color: #f44336;
}
</style> 