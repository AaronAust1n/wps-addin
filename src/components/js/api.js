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
    
    // 确保API地址格式正确
    if (config.apiUrl) {
      // 规范化API URL，确保以http://或https://开头
      let apiUrl = config.apiUrl.trim();
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = 'http://' + apiUrl;
        console.log('API地址已添加http://前缀:', apiUrl);
      }
      
      // 如果用户输入了带有/v1/chat/completions的完整路径，截取基础URL
      if (apiUrl.includes('/v1/chat/completions')) {
        apiUrl = apiUrl.substring(0, apiUrl.indexOf('/v1/chat/completions'));
        console.log('API地址已规范化，移除了/v1/chat/completions后缀:', apiUrl);
      }
      
      // 如果URL结尾有斜杠，移除它
      if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl.substring(0, apiUrl.length - 1);
        console.log('API地址已规范化，移除了结尾的斜杠:', apiUrl);
      }
      
      this.axios.defaults.baseURL = apiUrl;
      console.log('已设置API基础URL:', apiUrl);
      
      // 检测API类型
      this.detectApiType(apiUrl);
    } else {
      delete this.axios.defaults.baseURL;
      console.warn('未设置API地址');
    }
    
    // 设置授权头
    if (config.apiKey) {
      this.axios.defaults.headers['Authorization'] = `Bearer ${config.apiKey}`;
      console.log('已设置API授权头');
    } else {
      delete this.axios.defaults.headers['Authorization'];
      console.log('未设置API密钥，已移除授权头');
    }
    
    // 更新请求超时时间
    if (config.timeout) {
      this.axios.defaults.timeout = parseInt(config.timeout) * 1000 || 60000;
      console.log('已设置请求超时时间:', this.axios.defaults.timeout / 1000, '秒');
    }
  }

  /**
   * 检测API类型，并设置相应的请求参数
   * @param {string} apiUrl - API地址
   */
  detectApiType(apiUrl) {
    // 设置默认类型
    this.apiType = 'openai';
    
    // 根据URL特征判断API类型
    if (apiUrl.includes('ollama')) {
      this.apiType = 'ollama';
      console.log('检测到Ollama API');
    } else if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      if (apiUrl.includes(':8000')) {
        this.apiType = 'vllm';
        console.log('检测到vLLM API');
      } else if (apiUrl.includes(':8080')) {
        this.apiType = 'llama-cpp';
        console.log('检测到llama.cpp服务API');
      }
    }
    
    // 调整请求格式
    switch (this.apiType) {
      case 'ollama':
        // Ollama特定的请求参数调整
        this.ollamaEndpoint = '/api/generate';
        console.log('已设置Ollama端点:', this.ollamaEndpoint);
        break;
      case 'vllm':
      case 'llama-cpp':
      case 'openai':
      default:
        // 默认使用OpenAI格式
        console.log('使用标准OpenAI格式');
        break;
    }
  }

  /**
   * 根据API类型格式化请求数据
   * @param {Object} data - 原始请求数据
   * @returns {Object} - 格式化后的请求数据
   */
  formatRequestByApiType(data) {
    switch (this.apiType) {
      case 'ollama':
        // Ollama API格式转换
        return {
          model: data.model,
          prompt: data.messages.map(m => m.content).join('\n'),
          stream: false,
          options: {
            temperature: data.temperature || 0.7,
            num_predict: data.max_tokens || 2000
          }
        };
      case 'vllm':
      case 'llama-cpp':
      case 'openai':
      default:
        // 返回原始OpenAI格式
        return data;
    }
  }

  /**
   * 发送API请求的统一方法，包含错误处理和重试逻辑
   * @param {string} endpoint - API端点，如'/v1/chat/completions'
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他选项，如timeout
   * @returns {Promise<Object>} - API响应
   */
  async sendRequest(endpoint, data, options = {}) {
    const maxRetries = 2; // 最大重试次数
    let retries = 0;
    let lastError = null;
    
    // 准备请求数据和端点
    let requestData = this.formatRequestByApiType(data);
    
    // 根据API类型调整端点
    let requestEndpoint = endpoint || '/v1/chat/completions';
    if (this.apiType === 'ollama') {
      requestEndpoint = this.ollamaEndpoint || '/api/generate';
    }
    
    // 确保endpoint开始不带斜杠
    if (!requestEndpoint.startsWith('/')) {
      requestEndpoint = '/' + requestEndpoint;
    }
    
    console.log(`使用端点 ${requestEndpoint} 调用 ${this.apiType || 'standard'} API`);
    
    while (retries <= maxRetries) {
      try {
        console.log(`正在发送API请求到: ${this.axios.defaults.baseURL}${requestEndpoint} (第${retries+1}次尝试)`);
        
        const requestTimeout = options.timeout || 60000;
        console.log(`请求超时设置: ${requestTimeout/1000}秒`);
        
        // 尝试发送请求
        const response = await this.axios.post(requestEndpoint, requestData, {
          timeout: requestTimeout
        });
        
        // 处理不同API类型的响应
        if (this.apiType === 'ollama') {
          // 将Ollama响应转换为OpenAI格式
          return {
            data: {
              choices: [{
                message: {
                  content: response.data.response || ''
                }
              }]
            }
          };
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // 对于网络错误或超时，可以进行重试
        if ((error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
            error.message.includes('Network Error')) && retries < maxRetries) {
          retries++;
          console.warn(`请求失败，正在进行第${retries}次重试...`);
          
          // 延迟一段时间再重试
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // 无法处理的错误或已达到最大重试次数，抛出异常
        break;
      }
    }
    
    // 所有重试都失败，抛出最后捕获的错误
    console.error(`请求失败，已重试${retries}次`, lastError);
    throw lastError;
  }

  /**
   * 文本续写
   * @param {string} text - 上下文文本
   * @returns {Promise<string>} - 续写结果
   */
  async continueText(text) {
    const model = this.config.models?.continuationModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文本续写，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 4000) {
      console.warn(`输入文本超过4000字符(${text.length})，可能导致模型输入截断`);
    }
    
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文字助手，你的任务是根据用户提供的上下文继续写作，保持风格一致，输出流畅自然。' },
        { role: 'user', content: `请基于以下上下文，继续写作：\n\n${text}\n\n续写：` }
      ],
      max_tokens: this.config.options?.maxTokens || 1500,
      temperature: this.config.options?.temperature || 0.7
    }
    
    try {
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 60000 // 60秒超时
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
      throw new Error(`文本续写失败: ${this.formatErrorMessage(error)}`);
    }
  }

  /**
   * 文本校对
   * @param {string} text - 需要校对的文本
   * @returns {Promise<string>} - 校对结果
   */
  async proofreadText(text) {
    const model = this.config.models?.proofreadModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文本校对，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 6000) {
      console.warn(`输入文本超过6000字符(${text.length})，可能导致模型输入截断`);
    }
    
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文字校对助手，检查并修正文本中的语法错误、标点错误和用词不当，同时保持原文的风格和意思。' },
        { role: 'user', content: `请对以下文本进行校对修正，修正语法和标点符号错误，使表达更通顺准确：\n\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.3
    }
    
    try {
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 60000 // 60秒超时
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的校对结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('文本校对请求失败:', error);
      throw new Error(`文本校对失败: ${this.formatErrorMessage(error)}`);
    }
  }

  /**
   * 文本润色
   * @param {string} text - 需要润色的文本
   * @returns {Promise<string>} - 润色结果
   */
  async polishText(text) {
    const model = this.config.models?.polishModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文本润色，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 6000) {
      console.warn(`输入文本超过6000字符(${text.length})，可能导致模型输入截断`);
    }
    
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文字润色助手，帮助用户改进文本表达，使其更加优美、专业和有说服力，同时保持原意不变。' },
        { role: 'user', content: `请对以下文本进行润色改进，使表达更加优美、专业，但保持原意不变：\n\n${text}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.5
    }
    
    try {
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 60000 // 60秒超时
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的润色结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('文本润色请求失败:', error);
      throw new Error(`文本润色失败: ${this.formatErrorMessage(error)}`);
    }
  }

  /**
   * 生成文本摘要
   * @param {string} text - 需要摘要的文本
   * @returns {Promise<string>} - 摘要结果
   */
  async summarizeText(text) {
    const model = this.config.models?.summarizationModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文本摘要，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 6000) {
      console.warn(`输入文本超过6000字符(${text.length})，可能导致模型输入截断`);
    }
    
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
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 60000 // 60秒超时
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的摘要结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('文本摘要请求失败:', error);
      
      // 增强错误处理，添加更多调试信息
      let errorDetails = this.formatErrorMessage(error);
      console.error('详细错误信息:', errorDetails);
      
      // 记录更多上下文信息以便调试
      console.error('API配置:', {
        url: this.axios.defaults.baseURL,
        model: model,
        hasAuth: !!this.axios.defaults.headers['Authorization']
      });
      
      throw new Error(`生成摘要失败: ${errorDetails}`);
    }
  }

  /**
   * 生成全文总结
   * @param {string} text - 需要总结的全文
   * @returns {Promise<string>} - 总结结果
   */
  async summarizeDocument(text) {
    const model = this.config.models?.summarizationModel || this.config.models?.defaultModel
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行全文总结，输入长度: ${text.length}字符`);
    
    // 检查文本是否太长
    if (text.length > 10000) {
      console.warn(`输入文本超过10000字符(${text.length})，可能导致模型输入截断，将尝试分段处理`);
      
      // 这里可以添加分段处理逻辑，如果文档过长
      // 例如：分割文档为多个部分，分别处理后合并结果
    }
    
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
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 180000 // 增加到180秒，因为全文总结可能需要更多时间
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的全文总结结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('全文总结请求失败:', error);
      
      // 增强错误处理，添加更多调试信息
      let errorDetails = this.formatErrorMessage(error);
      console.error('详细错误信息:', errorDetails);
      
      // 记录更多上下文信息以便调试
      console.error('API配置:', {
        url: this.axios.defaults.baseURL,
        model: model,
        hasAuth: !!this.axios.defaults.headers['Authorization']
      });
      
      throw new Error(`全文总结失败: ${errorDetails}`);
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
      
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
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
    
    // 记录有关模型和请求的信息
    console.log(`使用模型"${model}"执行文档问答，文档长度: ${docContent.length}字符，问题: "${question}"`);
    
    // 检查文本是否太长
    if (docContent.length > 8000) {
      console.warn(`文档内容超过8000字符(${docContent.length})，可能导致模型输入截断，将尝试提取相关部分`);
      
      // 这里可以添加智能提取逻辑，例如根据问题关键词提取相关段落
      // 或者根据文档结构进行分段处理
    }
    
    const data = {
      model: model,
      messages: [
        { role: 'system', content: '你是一个专业的文档助手，根据文档内容回答用户问题。请提供准确、简洁且有帮助的回答。' },
        { role: 'user', content: `文档内容：${docContent}\n\n问题：${question}` }
      ],
      max_tokens: this.config.options?.maxTokens || 2000,
      temperature: this.config.options?.temperature || 0.3
    }

    try {
      // 使用统一的请求方法发送请求
      const response = await this.sendRequest('/v1/chat/completions', data, {
        timeout: 120000 // 增加到120秒
      });
      
      // 记录响应信息
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message.content;
        console.log(`API请求成功，返回${result.length}字符的问答结果`);
        return result;
      } else {
        console.error('API响应格式不正确:', response.data);
        throw new Error('API返回了不正确的响应格式');
      }
    } catch (error) {
      console.error('文档问答请求失败:', error);
      
      // 增强错误处理，添加更多调试信息
      let errorDetails = this.formatErrorMessage(error);
      console.error('详细错误信息:', errorDetails);
      
      // 记录更多上下文信息以便调试
      console.error('API配置:', {
        url: this.axios.defaults.baseURL,
        model: model,
        hasAuth: !!this.axios.defaults.headers['Authorization']
      });
      
      throw new Error(`文档问答失败: ${errorDetails}`);
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