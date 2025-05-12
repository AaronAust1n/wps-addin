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
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('文本续写请求失败:', error)
      throw new Error(this.formatErrorMessage(error))
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
   * 执行文档问答
   * @param {string} text - 文档文本
   * @param {string} question - 用户问题
   * @returns {Promise<string>} - 回答结果
   */
  async documentQA(text, question) {
    const model = this.config.models?.summarizationModel || this.config.models?.defaultModel
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文档问答助手，请基于用户提供的文档内容回答问题。只回答文档中包含的内容，如果无法从文档中找到答案，请明确指出。' },
        { role: 'user', content: `文档内容：\n${text}\n\n问题：${question}` }
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
   * 执行一般聊天对话
   * @param {Array} messages - 消息数组
   * @returns {Promise<string>} - 回复内容
   */
  async chat(messages) {
    const model = this.config.models?.defaultModel
    const data = {
      model: model,
      messages: messages,
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.7
    }

    try {
      const response = await this.axios.post('/v1/chat/completions', data)
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('聊天请求失败:', error)
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
      return `服务器错误 (${error.response.status}): ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return '未收到API服务器响应，请检查API地址和网络连接'
    } else {
      // 请求设置时出现错误
      return `请求错误: ${error.message}`
    }
  }
}

// 创建单例实例
const apiClient = new AIAPIClient()

export default apiClient 