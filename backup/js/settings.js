/**
 * 设置模块
 * 处理加载项配置的保存和加载
 */

// 保存配置
window.saveConfig = function(config) {
    try {
        console.log("保存配置");
        
        // 深拷贝配置对象，避免引用问题
        const configCopy = JSON.parse(JSON.stringify(config));
        
        // 将配置保存到本地存储
        wps.PluginStorage.setItem("aiConfig", JSON.stringify(configCopy));
        
        // 更新全局配置
        window.aiConfig = configCopy;
        
        return true;
    } catch (error) {
        console.error("保存配置失败：", error);
        return false;
    }
};

// 加载配置
window.loadConfig = function() {
    try {
        console.log("加载配置");
        
        // 从本地存储加载配置
        const configStr = wps.PluginStorage.getItem("aiConfig");
        if (configStr) {
            const config = JSON.parse(configStr);
            
            // 更新全局配置
            window.aiConfig = config;
            
            return config;
        }
        
        // 如果没有配置，返回默认配置
        return getDefaultConfig();
    } catch (error) {
        console.error("加载配置失败：", error);
        
        // 返回默认配置
        return getDefaultConfig();
    }
};

// 重置配置
window.resetConfig = function() {
    try {
        console.log("重置配置");
        
        // 获取默认配置
        const defaultConfig = getDefaultConfig();
        
        // 保存默认配置
        saveConfig(defaultConfig);
        
        return true;
    } catch (error) {
        console.error("重置配置失败：", error);
        return false;
    }
};

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

// 更新部分配置
window.updateConfig = function(partialConfig) {
    try {
        console.log("更新部分配置");
        
        // 获取当前配置
        const currentConfig = window.aiConfig || getDefaultConfig();
        
        // 深拷贝当前配置
        const newConfig = JSON.parse(JSON.stringify(currentConfig));
        
        // 递归合并配置对象
        function mergeConfig(target, source) {
            for (const key in source) {
                if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                    mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        // 合并配置
        mergeConfig(newConfig, partialConfig);
        
        // 保存新配置
        return saveConfig(newConfig);
    } catch (error) {
        console.error("更新部分配置失败：", error);
        return false;
    }
}; 