<template>
  <div class="dialog-container">
    <div class="dialog-header">
      <h2>WPS AI助手 - {{ isHelp ? '帮助' : '设置' }}</h2>
    </div>
    
    <!-- 设置内容 -->
    <div v-if="!isHelp" class="dialog-content settings-content">
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
            <option value="qwen3-235b-a22b">Qwen3-235B-A22B</option>
            <option value="qwen3-30b-a3b">Qwen3-30B-A3B</option>
            <option value="qwen3-32b">Qwen3-32B</option>
            <option value="qwen3-14b">Qwen3-14B</option>
            <option value="qwq-32b">QWQ-32b</option>
            <option value="qwen2.5-72b-instruct">Qwen2.5-72B-Instruct</option>
            <option value="qwen2.5-32b-instruct">Qwen2.5-32B-Instruct</option>
            <option value="qwen2.5-14b-instruct">Qwen2.5-14B-Instruct</option>
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
      <div class="dialog-footer">
        <button @click="saveConfig" class="btn-primary">保存</button>
        <button @click="closeDialog" class="btn-secondary">取消</button>
      </div>
    </div>
    
    <!-- 帮助内容 -->
    <div v-if="isHelp" class="dialog-content help-content">
      <div class="help-section">
        <h3>主要功能</h3>
        <ul>
          <li>
            <strong>文本续写</strong>：根据选中的文本或光标所在段落，智能续写内容。
          </li>
          <li>
            <strong>文本校对</strong>：检查并修正选中文本或光标所在段落中的错误。
          </li>
          <li>
            <strong>文本润色</strong>：优化选中文本或光标所在段落的表达，使其更加专业流畅。
          </li>
          <li>
            <strong>文档问答</strong>：基于当前文档内容回答问题，支持选取部分内容或全文。
          </li>
          <li>
            <strong>全文总结</strong>：为整个文档或选中内容生成摘要。
          </li>
        </ul>
      </div>
      <div class="help-section">
        <h3>使用方法</h3>
        <ol>
          <li>首先点击"设置"按钮配置AI接口信息</li>
          <li>文本操作（续写/校对/润色）：
            <ul>
              <li>选择需要处理的文本（或定位光标到段落中）</li>
              <li>点击对应功能按钮</li>
              <li>处理完成后，修改结果会显示在原文后</li>
              <li>按Enter接受修改，删除旧内容</li>
            </ul>
          </li>
          <li>文档问答：
            <ul>
              <li>点击"文档问答"按钮，打开侧边栏</li>
              <li>在输入框中输入问题，按回车或点击"提问"</li>
              <li>AI将基于文档内容回答问题</li>
            </ul>
          </li>
          <li>全文总结：
            <ul>
              <li>点击"全文总结"按钮，打开侧边栏</li>
              <li>如有选中内容，将生成该内容的摘要；否则生成全文摘要</li>
              <li>点击"重新生成"可刷新摘要结果</li>
            </ul>
          </li>
        </ol>
      </div>
      <div class="help-section">
        <h3>常见问题</h3>
        <div class="qa-item">
          <div class="question">API设置无法保存？</div>
          <div class="answer">请确保填写了必要的API地址，如使用自定义模型需填写模型名称。</div>
        </div>
        <div class="qa-item">
          <div class="question">功能按钮点击无反应？</div>
          <div class="answer">请先完成API设置，确保API连通性正常。</div>
        </div>
        <div class="qa-item">
          <div class="question">处理结果不正确？</div>
          <div class="answer">尝试使用不同的模型，或提供更多上下文信息。</div>
        </div>
      </div>
      <div class="dialog-footer">
        <button @click="closeDialog" class="btn-close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
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
    
    const route = useRoute();
    const isHelp = computed(() => {
      const result = route.path === '/help';
      console.log(`计算isHelp: 路径=${route.path}, 结果=${result}`);
      return result;
    });
    
    const advancedOpen = ref(false)
    const testStatus = ref('') // 'success' or 'error'
    const testMessage = ref('')
    
    const toggleAdvanced = () => {
      advancedOpen.value = !advancedOpen.value
    }

    // 监视路由变化
    watch(() => route.path, (newPath) => {
      console.log('路由路径变化:', newPath);
    });

    onMounted(() => {
      console.log('Dialog组件挂载, 当前路由完整信息:', {
        path: route.path,
        fullPath: route.fullPath,
        name: route.name,
        params: route.params,
        query: route.query
      });
      console.log('是否显示帮助:', isHelp.value);
      
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
            console.log('成功加载配置:', config.value);
          } catch (e) {
            console.error('配置加载失败', e)
          }
        } else {
          console.log('未找到已保存的配置');
        }
      } else {
        console.warn('PluginStorage不可用');
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
      console.log('开始保存配置...', config.value);
      
      // 保存前检查必填项
      if (!config.value.apiUrl) {
        console.warn('API地址为空，中止保存');
        window.Application.Alert('请填写API地址')
        return
      }
      
      // 检查自定义模型名称
      if (config.value.models.defaultModel === 'custom' && !config.value.models.customModel) {
        console.warn('自定义模型名称为空，中止保存');
        window.Application.Alert('请填写自定义模型名称')
        return
      }
      
      // 深度复制配置对象，避免引用问题
      const actualConfig = JSON.parse(JSON.stringify(config.value))
      console.log('配置对象深度复制完成');
      
      // 正确处理自定义模型
      if (actualConfig.models.defaultModel === 'custom') {
        console.log('检测到自定义模型', {
          defaultModel: actualConfig.models.defaultModel,
          customModel: actualConfig.models.customModel
        });
        
        // 保存自定义模型值作为默认模型
        const customModelValue = actualConfig.models.customModel;
        actualConfig.models.defaultModel = customModelValue;
        
        console.log('自定义模型已设置为默认模型', {
          defaultModel: actualConfig.models.defaultModel,
          customModel: actualConfig.models.customModel
        });
      }
      
      // 保存配置到WPS本地存储
      if (window.Application && window.Application.PluginStorage) {
        try {
          const configStr = JSON.stringify(actualConfig);
          console.log('准备保存配置:', configStr);
          
          window.Application.PluginStorage.setItem('aiConfig', configStr);
          console.log('配置已保存到本地存储');
          
          // 立即读取保存的配置进行验证
          const savedConfigStr = window.Application.PluginStorage.getItem('aiConfig');
          if (savedConfigStr) {
            const savedConfig = JSON.parse(savedConfigStr);
            console.log('验证保存的配置:', savedConfig);
          }
          
          // 提示用户保存成功并关闭对话框
          testStatus.value = 'success';
          testMessage.value = '配置已成功保存!';
          
          // 延迟关闭对话框，让用户有时间看到保存成功提示
          setTimeout(() => {
            window.Application.Alert('配置已成功保存')
            closeDialog()
          }, 1000);
        } catch (e) {
          console.error('配置保存失败', e)
          testStatus.value = 'error';
          testMessage.value = '配置保存失败: ' + e.message;
          window.Application.Alert('配置保存失败: ' + e.message)
        }
      } else {
        console.error('PluginStorage不可用，无法保存配置');
        testStatus.value = 'error';
        testMessage.value = '无法访问存储，配置保存失败';
        window.Application.Alert('无法访问存储，配置保存失败')
      }
    }

    const closeDialog = () => {
      // 确保关闭对话框
      try {
        console.log('正在关闭对话框...');
        if (window.Application && typeof window.Application.CloseDialog === 'function') {
          window.Application.CloseDialog();
          console.log('对话框已关闭');
        } else {
          console.warn('CloseDialog方法不可用，尝试备选方法');
          // 尝试备选方法
          if (window.close) {
            window.close();
          }
        }
      } catch (e) {
        console.error('关闭对话框失败:', e);
      }
    }

    return {
      config,
      advancedOpen,
      testStatus,
      testMessage,
      isHelp,
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
}

/* 设置对话框需要自己的滚动条 */
.settings-content {
  max-height: 450px;
  overflow-y: auto;
}

/* 帮助对话框依赖父容器的滚动条 */
.help-content {
  overflow-y: visible;
  max-height: none;
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

.btn-close {
  background-color: #2b579a;
  color: white;
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

/* 帮助页面样式 */
.help-section {
  margin-bottom: 20px;
}

.help-section h3 {
  color: #2b579a;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  margin-top: 0;
}

.qa-item {
  margin-bottom: 15px;
}

.question {
  font-weight: bold;
  color: #2b579a;
  margin-bottom: 5px;
}

.answer {
  line-height: 1.5;
}

ul, ol {
  padding-left: 20px;
  margin-top: 5px;
}

li {
  margin-bottom: 5px;
  line-height: 1.5;
}
</style> 