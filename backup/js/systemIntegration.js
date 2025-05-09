/**
 * 系统集成模块
 * 实现与外部业务系统的交互
 */

// 系统集成对象
window.systemIntegration = {
    // 初始化系统集成
    init: function() {
        console.log("系统集成初始化");
        
        // 注册事件监听
        this.registerEventHandlers();
        
        // 检查URL参数
        this.processUrlParameters();
    },
    
    // 注册事件处理程序
    registerEventHandlers: function() {
        // 注册消息事件
        window.addEventListener("message", function(event) {
            try {
                // 处理来自父窗口的消息
                if (event.data && event.data.type) {
                    switch (event.data.type) {
                        case "openDocument":
                            systemIntegration.openDocumentFromUrl(event.data.url);
                            break;
                        case "saveDocument":
                            systemIntegration.saveDocumentToSystem(event.data.callback);
                            break;
                        case "setConfig":
                            systemIntegration.setConfigFromSystem(event.data.config);
                            break;
                        default:
                            console.log("未知消息类型：", event.data.type);
                    }
                }
            } catch (error) {
                console.error("处理消息事件失败：", error);
            }
        });
    },
    
    // 处理URL参数
    processUrlParameters: function() {
        try {
            // 获取URL参数
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            
            // 处理文档参数
            if (urlParams.has("docUrl")) {
                const docUrl = urlParams.get("docUrl");
                this.openDocumentFromUrl(docUrl);
            }
            
            // 处理配置参数
            if (urlParams.has("configUrl")) {
                const configUrl = urlParams.get("configUrl");
                this.loadConfigFromUrl(configUrl);
            }
            
            // 处理系统标识参数
            if (urlParams.has("systemId")) {
                window.systemId = urlParams.get("systemId");
                console.log("系统标识：", window.systemId);
            }
        } catch (error) {
            console.error("处理URL参数失败：", error);
        }
    },
    
    // 从URL打开文档
    openDocumentFromUrl: function(url) {
        try {
            console.log("从URL打开文档：", url);
            
            // 通知用户
            wps.alert("正在从系统获取文档...");
            
            // 使用WPS OA助手下载文件
            const oaAssist = wps.OAAssist;
            if (oaAssist) {
                oaAssist.DownloadFile(url, function(result) {
                    if (result.code === 0) {
                        // 打开文档
                        const wpsApp = wps.WpsApplication();
                        wpsApp.Documents.Open(result.data);
                        
                        // 通知业务系统
                        systemIntegration.notifySystem({
                            type: "documentOpened",
                            fileName: result.data
                        });
                    } else {
                        wps.alert("下载文档失败：" + result.message);
                    }
                });
            } else {
                // 如果OA助手不可用，使用其他方式
                fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                        // 保存到临时文件
                        const tempFile = systemIntegration.saveBlobToTempFile(blob);
                        
                        // 打开文档
                        const wpsApp = wps.WpsApplication();
                        wpsApp.Documents.Open(tempFile);
                    })
                    .catch(error => {
                        wps.alert("下载文档失败：" + error.message);
                    });
            }
        } catch (error) {
            console.error("从URL打开文档失败：", error);
            wps.alert("打开文档失败：" + error.message);
        }
    },
    
    // 保存Blob到临时文件
    saveBlobToTempFile: function(blob) {
        try {
            // 获取临时目录
            const tempPath = wps.Env.GetTempPath();
            
            // 生成临时文件名
            const fileName = "wps_" + new Date().getTime() + ".docx";
            const filePath = tempPath + "\\" + fileName;
            
            // 将Blob转换为二进制字符串
            const reader = new FileReader();
            reader.readAsBinaryString(blob);
            reader.onload = function() {
                // 保存文件
                wps.FileSystem.writeAsBinaryString(filePath, reader.result);
            };
            
            return filePath;
        } catch (error) {
            console.error("保存Blob到临时文件失败：", error);
            return null;
        }
    },
    
    // 保存文档到业务系统
    saveDocumentToSystem: function(callbackUrl) {
        try {
            console.log("保存文档到业务系统");
            
            // 获取当前文档
            const wpsApp = wps.WpsApplication();
            const doc = wpsApp.ActiveDocument;
            
            if (!doc) {
                wps.alert("无法获取当前文档");
                return;
            }
            
            // 先保存文档
            doc.Save();
            
            // 上传文档
            const oaAssist = wps.OAAssist;
            if (oaAssist) {
                oaAssist.UploadFile(doc.FullName, callbackUrl, function(result) {
                    if (result.code === 0) {
                        wps.alert("文档已保存到业务系统");
                        
                        // 通知业务系统
                        systemIntegration.notifySystem({
                            type: "documentSaved",
                            fileName: doc.Name
                        });
                    } else {
                        wps.alert("保存文档失败：" + result.message);
                    }
                });
            } else {
                // 如果OA助手不可用，提示用户手动上传
                wps.alert("请手动将文档上传到业务系统");
            }
        } catch (error) {
            console.error("保存文档到业务系统失败：", error);
            wps.alert("保存文档失败：" + error.message);
        }
    },
    
    // 从URL加载配置
    loadConfigFromUrl: function(url) {
        try {
            console.log("从URL加载配置：", url);
            
            // 获取配置
            fetch(url)
                .then(response => response.json())
                .then(config => {
                    // 设置配置
                    this.setConfigFromSystem(config);
                })
                .catch(error => {
                    console.error("获取配置失败：", error);
                });
        } catch (error) {
            console.error("从URL加载配置失败：", error);
        }
    },
    
    // 从系统设置配置
    setConfigFromSystem: function(config) {
        try {
            console.log("从系统设置配置");
            
            // 保存配置
            window.saveConfig(config);
            
            // 通知业务系统
            this.notifySystem({
                type: "configSet",
                success: true
            });
        } catch (error) {
            console.error("从系统设置配置失败：", error);
            
            // 通知业务系统
            this.notifySystem({
                type: "configSet",
                success: false,
                error: error.message
            });
        }
    },
    
    // 通知业务系统
    notifySystem: function(data) {
        try {
            // 获取父窗口
            if (window.parent && window.parent !== window) {
                // 发送消息到父窗口
                window.parent.postMessage(data, "*");
            }
            
            // 如果配置了回调URL
            if (window.systemCallbackUrl) {
                // 发送请求到回调URL
                fetch(window.systemCallbackUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }).catch(error => {
                    console.error("发送回调请求失败：", error);
                });
            }
            
            // 使用OA助手通知
            const oaAssist = wps.OAAssist;
            if (oaAssist && window.systemNotifyUrl) {
                oaAssist.WebNotify(window.systemNotifyUrl, JSON.stringify(data));
            }
        } catch (error) {
            console.error("通知业务系统失败：", error);
        }
    }
};

// 初始化系统集成
window.addEventListener("load", function() {
    // 延迟初始化，确保WPS环境已加载
    setTimeout(function() {
        systemIntegration.init();
    }, 1000);
}); 