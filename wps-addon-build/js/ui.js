/**
 * UI 相关模块
 * 处理任务窗格和对话框的显示和交互
 */

// 任务窗格对象缓存
const taskpanes = {};

// 显示任务窗格
window.showTaskpane = function(type, title, data = {}) {
    try {
        // 检查是否已有相同类型的任务窗格
        if (taskpanes[type] && taskpanes[type].Visible) {
            // 如果有，就更新数据并激活
            notifyTaskpane(type, data);
            return;
        }
        
        // 创建新的任务窗格
        const taskpane = wps.CreateTaskPane(getTaskpaneUrl(type));
        if (!taskpane) {
            throw new Error("创建任务窗格失败");
        }
        
        // 设置任务窗格属性
        taskpane.Visible = true;
        taskpane.DockPosition = wps.Enum.msoCTPDockPositionRight;
        taskpane.Width = 350;
        
        // 缓存任务窗格
        taskpanes[type] = taskpane;
        
        // 设置任务窗格数据
        setTimeout(() => {
            notifyTaskpane(type, data);
        }, 500);
    } catch (error) {
        console.error("显示任务窗格失败：", error);
        wps.alert("显示任务窗格失败：" + error.message);
    }
};

// 通知任务窗格更新数据
function notifyTaskpane(type, data) {
    try {
        if (!taskpanes[type] || !taskpanes[type].Visible) {
            return;
        }
        
        // 向任务窗格页面发送消息
        const taskpane = taskpanes[type];
        const frameWindow = taskpane.Window;
        if (frameWindow && frameWindow.postMessage) {
            frameWindow.postMessage({
                type: "updateData",
                data: data
            }, "*");
        }
    } catch (error) {
        console.error("通知任务窗格更新数据失败：", error);
    }
}

// 获取任务窗格URL
function getTaskpaneUrl(type) {
    // 根据类型获取对应的HTML文件URL
    const baseUrl = getBaseUrl();
    
    switch (type) {
        case "continueText":
            return baseUrl + "/taskpanes/continueText.html";
        case "proofreadText":
            return baseUrl + "/taskpanes/proofreadText.html";
        case "polishText":
            return baseUrl + "/taskpanes/polishText.html";
        case "summarizeText":
            return baseUrl + "/taskpanes/summarizeText.html";
        case "summarizeDoc":
            return baseUrl + "/taskpanes/summarizeDoc.html";
        default:
            return baseUrl + "/taskpanes/default.html";
    }
}

// 显示对话框
window.showDialog = function(type, title, options = {}) {
    try {
        // 获取对话框URL
        const url = getDialogUrl(type);
        
        // 设置对话框选项
        const dialogOptions = {
            width: options.width || 400,
            height: options.height || 300,
            title: title || "对话框"
        };
        
        // 显示对话框
        wps.ShowDialog(url, dialogOptions);
    } catch (error) {
        console.error("显示对话框失败：", error);
        wps.alert("显示对话框失败：" + error.message);
    }
};

// 获取对话框URL
function getDialogUrl(type) {
    // 根据类型获取对应的HTML文件URL
    const baseUrl = getBaseUrl();
    
    switch (type) {
        case "settings":
            return baseUrl + "/dialogs/settings.html";
        case "help":
            return baseUrl + "/dialogs/help.html";
        default:
            return baseUrl + "/dialogs/default.html";
    }
}

// 获取基础URL
function getBaseUrl() {
    try {
        // 获取当前脚本的路径
        const currentPath = document.location.href;
        // 返回到加载项根目录
        return currentPath.substring(0, currentPath.lastIndexOf('/'));
    } catch (error) {
        console.error("获取基础URL失败：", error);
        return "";
    }
} 