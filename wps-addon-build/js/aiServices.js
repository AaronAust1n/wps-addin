/**
 * AI服务模块
 * 处理与AI API的通信和数据处理
 */

// AI服务对象
window.aiService = {
    // 文本续写
    continueText: async function(text, options = {}) {
        try {
            console.log("调用文本续写服务");
            
            // 获取配置
            const config = window.aiConfig || {};
            
            // 构建请求参数
            const params = {
                text: text,
                model: options.model || config.models.continuationModel,
                max_tokens: options.maxTokens || config.options.maxTokens,
                temperature: options.temperature || config.options.temperature
            };
            
            // 调用API
            return await callAiApi("continue", params);
        } catch (error) {
            console.error("文本续写服务调用失败：", error);
            throw error;
        }
    },
    
    // 文本校对
    proofreadText: async function(text, options = {}) {
        try {
            console.log("调用文本校对服务");
            
            // 获取配置
            const config = window.aiConfig || {};
            
            // 构建请求参数
            const params = {
                text: text,
                model: options.model || config.models.proofreadingModel,
                check_grammar: options.checkGrammar !== false,
                check_spelling: options.checkSpelling !== false,
                check_style: options.checkStyle !== false
            };
            
            // 调用API
            return await callAiApi("proofread", params);
        } catch (error) {
            console.error("文本校对服务调用失败：", error);
            throw error;
        }
    },
    
    // 文本润色
    polishText: async function(text, options = {}) {
        try {
            console.log("调用文本润色服务");
            
            // 获取配置
            const config = window.aiConfig || {};
            
            // 构建请求参数
            const params = {
                text: text,
                model: options.model || config.models.polishingModel,
                tone: options.tone || "professional",
                intensity: options.intensity || "medium"
            };
            
            // 调用API
            return await callAiApi("polish", params);
        } catch (error) {
            console.error("文本润色服务调用失败：", error);
            throw error;
        }
    },
    
    // 文本摘要
    summarizeText: async function(text, options = {}) {
        try {
            console.log("调用文本摘要服务");
            
            // 获取配置
            const config = window.aiConfig || {};
            
            // 构建请求参数
            const params = {
                text: text,
                model: options.model || config.models.summarizationModel,
                length: options.length || "medium",
                format: options.format || "paragraph"
            };
            
            // 调用API
            return await callAiApi("summarize", params);
        } catch (error) {
            console.error("文本摘要服务调用失败：", error);
            throw error;
        }
    },
    
    // 全文摘要
    summarizeDocument: async function(document, options = {}) {
        try {
            console.log("调用全文摘要服务");
            
            // 获取配置
            const config = window.aiConfig || {};
            
            // 构建请求参数
            const params = {
                document: document,
                model: options.model || config.models.summarizationModel,
                length: options.length || "medium",
                format: options.format || "structured",
                focus: options.focus || "general"
            };
            
            // 调用API
            return await callAiApi("document-summary", params);
        } catch (error) {
            console.error("全文摘要服务调用失败：", error);
            throw error;
        }
    }
};

// 调用AI API
async function callAiApi(endpoint, params) {
    try {
        // 获取配置
        const config = window.aiConfig || {};
        
        // 获取API URL
        const apiUrl = config.apiUrl || "https://api.example.com/ai";
        
        // 构建完整URL
        const url = `${apiUrl}/${endpoint}`;
        
        // 构建请求头
        const headers = {
            "Content-Type": "application/json"
        };
        
        // 添加认证
        if (config.apiKey) {
            headers["Authorization"] = `Bearer ${config.apiKey}`;
        }
        
        // 发送请求
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(params)
        });
        
        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败：${response.status} ${response.statusText} - ${errorText}`);
        }
        
        // 解析响应
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API调用失败：", error);
        throw error;
    }
}

// 模拟API调用（仅用于开发测试）
window.mockAiApi = {
    // 模拟文本续写
    continueText: function(text) {
        return {
            text: text + "这是模拟的续写内容。人工智能（AI）技术正在迅速发展，为各行各业带来了巨大的变革。在文档处理领域，AI可以帮助用户自动生成内容、校对文档、提取摘要等，大大提高了工作效率。"
        };
    },
    
    // 模拟文本校对
    proofreadText: function(text) {
        return {
            corrections: [
                {
                    original: "错误",
                    suggested: "正确",
                    type: "spelling",
                    position: 5
                },
                {
                    original: "错误的语法",
                    suggested: "正确的语法",
                    type: "grammar",
                    position: 10
                }
            ]
        };
    },
    
    // 模拟文本润色
    polishText: function(text) {
        return {
            text: "这是润色后的文本内容。文章更加流畅、专业，表达更加准确。"
        };
    },
    
    // 模拟文本摘要
    summarizeText: function(text) {
        return {
            summary: "这是文本的摘要内容。主要观点包括：1. 首要论点；2. 次要论点；3. 结论。"
        };
    },
    
    // 模拟全文摘要
    summarizeDocument: function(document) {
        return {
            summary: "这是整个文档的摘要。文档主要讨论了以下几个方面：\n1. 第一部分的主要内容\n2. 第二部分的主要观点\n3. 第三部分的关键结论"
        };
    }
}; 