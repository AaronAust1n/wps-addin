import axios from 'axios'

/**
 * AI服务API客户端
 * 支持OpenAI格式API和多种大型语言模型
 */
class AIAPIClient {
  constructor(config) {
    this.config = config || {}
    this.axios = axios.create({
      baseURL: this.config.apiUrl || '',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : ''
      },
      timeout: 60000 // 默认60秒超时
    })
  }

  /**
   * 更新API配置
   * @param {Object} config - API配置
   */
  updateConfig(config) {
    this.config = config
    this.axios.defaults.baseURL = config.apiUrl || ''
    if (config.apiKey) {
      this.axios.defaults.headers['Authorization'] = `Bearer ${config.apiKey}`
    } else {
      delete this.axios.defaults.headers['Authorization']
    }
  }

  /**
   * 执行文本续写
   * @param {string} text - 需要续写的文本
   * @returns {Promise<string>} - 续写结果
   */
  async continueText(text) {
    const model = this.config.models?.continuationModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文本续写，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 6000) {
      console.warn(`输入文本超过6000字符(${text.length})，可能导致模型输入截断`);
    }
    
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文本续写助手，请根据用户提供的文本进行高质量的续写。' },
        { role: 'user', content: `请帮我续写以下文本:\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.7
    }

    try {
      console.log(`正在发送API请求到: ${this.axios.defaults.baseURL}/v1/chat/completions`);
      
      // 设置更长的超时时间，处理大型输入可能需要更多时间
      const response = await this.axios.post('/v1/chat/completions', data, {
        timeout: 120000 // 增加到120秒
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的续写结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('文本续写请求失败:', error);
      
      // 增强错误处理，添加更多调试信息
      let errorDetails = this.formatErrorMessage(error);
      console.error('详细错误信息:', errorDetails);
      
      // 记录更多上下文信息以便调试
      console.error('API配置:', {
        url: this.axios.defaults.baseURL,
        model: model,
        hasAuth: !!this.axios.defaults.headers['Authorization']
      });
      
      throw new Error(`文本续写失败: ${errorDetails}`);
    }
  }

  /**
   * 执行文本校对
   * @param {string} text - 需要校对的文本
   * @returns {Promise<string>} - 校对结果
   */
  async proofreadText(text) {
    const model = this.config.models?.proofreadingModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文本校对助手，请检查并修正用户提供文本中的错误，包括拼写、语法和标点符号等问题。' },
        { role: 'user', content: `请校对以下文本并返回修正后的完整内容:\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.3
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('文本校对请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
    }
  }

  /**
   * 执行文本润色
   * @param {string} text - 需要润色的文本
   * @returns {Promise<string>} - 润色结果
   */
  async polishText(text) {
    const model = this.config.models?.polishingModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文本润色助手，请改进用户提供的文本，使表达更加优雅、专业和流畅，但保持原有意思不变。' },
        { role: 'user', content: `请润色以下文本并返回优化后的完整内容:\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.5
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('文本润色请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
    }
  }

  /**
   * 生成文本摘要
   * @param {string} text - 需要摘要的文本
   * @returns {Promise<string>} - 摘要结果
   */
  async summarizeText(text) {
    const model = this.config.models?.summarizationModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文本摘要助手，请为用户提供的文本生成简洁、准确的摘要，突出核心内容和关键点。' },
        { role: 'user', content: `请为以下文本生成摘要：\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 1000,
      temperature: this.config.options?.temperature || 0.3
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('文本摘要请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
    }
  }

  /**
   * 生成全文总结
   * @param {string} text - 需要总结的全文
   * @returns {Promise<string>} - 总结结果
   */
  async summarizeDocument(text) {
    const model = this.config.models?.summarizationModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文档总结助手，请为用户提供的完整文档生成全面、结构化的总结，包括主要观点、论据和结论。' },
        { role: 'user', content: `请为以下文档生成全文总结：\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.4
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('全文总结请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
    }
  }

  /**
   * 测试API连接
   * @returns {Promise<{success: boolean, message: string, model?: string}>} - 测试结果
   */
  async testConnection() {
    console.log('开始测试API连接:', this.config.apiUrl);
    
    // 首先验证URL格式
    if (!this.config.apiUrl) {
      return {
        success: false,
        message: '未配置API URL'
      };
    }
    
    try {
      new URL(this.config.apiUrl);
    } catch (e) {
      console.error('API URL格式无效:', e);
      return {
        success: false,
        message: 'API URL格式无效'
      };
    }
    
    // 选择默认模型或回退到一个通用名称
    const model = this.config.models?.defaultModel || 'gpt-3.5-turbo';
    console.log(`使用模型"${model}"测试连接`);
    
    const data = {
      model: model,
      messages: [
        { role: 'user', content: '回复"连接测试成功"确认API连接' }
      ],
      max_tokens: 10, // 只需要很小的响应
      temperature: 0
    }

    try {
      console.log('发送测试请求...');
      const startTime = Date.now();
      
      // 设置较短的超时时间用于测试
      const response = await this.axios.post('/v1/chat/completions', data, {
        timeout: 10000 // 10秒超时，仅用于测试
      });
      
      const duration = Date.now() - startTime;
      console.log(`API响应时间: ${duration}ms`);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const modelInfo = response.data.model || model;
        console.log('连接测试成功, 模型:', modelInfo);
        return {
          success: true,
          message: `连接成功 (${duration}ms)`,
          model: modelInfo
        };
      } else {
        console.error('API响应格式不正确:', response.data);
        return {
          success: false,
          message: 'API响应格式不正确'
        };
      }
    } catch (error) {
      console.error('API连接测试失败:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error)
      };
    }
  }

  /**
   * 为文档问答生成回答
   * @param {string} docContent - 文档内容
   * @param {string} question - 用户问题
   * @returns {Promise<string>} - 问答结果
   */
  async documentQA(docContent, question) {
    const model = this.config.models?.qaModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文档助手，根据文档内容回答用户问题。' },
        { role: 'user', content: `文档内容：${docContent}\n\n问题：${question}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.3
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('文档问答请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
    }
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @returns {string} - 格式化后的错误信息
   */
  formatErrorMessage(error) {
    if (error.response) {
      // 服务器响应了错误状态码
      const status = error.response.status;
      let message = '';
      
      // 根据状态码提供更具体的错误信息
      switch (status) {
        case 401:
          message = '身份验证失败，请检查API密钥';
          break;
        case 403:
          message = '无权访问该资源，请检查API权限';
          break;
        case 404:
          message = 'API端点不存在，请检查API URL是否正确';
          break;
        case 429:
          message = '请求次数超限，请降低请求频率或升级API套餐';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = `服务器错误(${status})，请稍后重试`;
          break;
        default:
          message = error.response.data?.error?.message || JSON.stringify(error.response.data);
      }
      
      return `服务器错误 (${status}): ${message}`;
    } else if (error.request) {
      // 请求已发送但没有收到响应
      if (error.code === 'ECONNABORTED') {
        return '请求超时，服务器响应时间过长';
      } else if (error.code === 'ECONNREFUSED') {
        return '连接被拒绝，服务器可能未运行或地址错误';
      } else if (error.code === 'ENOTFOUND') {
        return 'DNS查找失败，请检查API域名是否正确';
      }
      return '未收到API服务器响应，请检查API地址和网络连接';
    } else {
      // 请求设置时出现错误
      return `请求错误: ${error.message}`;
    }
  }
}

// 创建单例实例
const apiClient = new AIAPIClient()

export default apiClient 