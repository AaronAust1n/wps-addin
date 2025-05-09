// 导入功能模块
import './js/ribbon.js';
import './js/aiServices.js';
import './js/ui.js';
import './js/settings.js';
import './js/utils.js';
import './js/systemIntegration.js';

// 加载项初始化
window.onload = function() {
    console.log("AI助手加载项已初始化");
    
    // 检查WPS环境
    if (typeof wps === 'undefined') {
        console.error('未检测到WPS环境，加载项可能无法正常工作');
        return;
    }
    
    // 初始化加载项配置
    initConfig();
    
    console.log("AI助手加载项初始化完成");
};

// 初始化配置
function initConfig() {
    try {
        // 从本地存储加载配置
        const config = loadConfig();
        window.aiConfig = config || getDefaultConfig();
        
        console.log("配置加载成功");
    } catch (error) {
        console.error("配置加载失败：", error);
        window.aiConfig = getDefaultConfig();
    }
}

// 从本地存储加载配置
function loadConfig() {
    try {
        const configStr = wps.PluginStorage.getItem("aiConfig");
        if (configStr) {
            return JSON.parse(configStr);
        }
        return null;
    } catch (error) {
        console.error("读取配置失败：", error);
        return null;
    }
}

// 获取默认配置
function getDefaultConfig() {
    return {
        apiUrl: "https://api.example.com/ai",
        apiKey: "",
        models: {
            continuationModel: "gpt-3.5-turbo",
            proofreadingModel: "gpt-3.5-turbo",
            polishingModel: "gpt-3.5-turbo",
            summarizationModel: "gpt-3.5-turbo"
        },
        options: {
            maxTokens: 2000,
            temperature: 0.7
        }
    };
} 