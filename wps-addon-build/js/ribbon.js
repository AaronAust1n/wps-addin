/**
 * 功能区处理模块
 * 处理ribbon.xml中定义的按钮点击事件和功能区加载事件
 */

// 功能区加载事件处理函数
window.ribbonOnLoad = function(ribbonUI) {
    // 保存ribbonUI对象，以便后续使用
    window.ribbonUI = ribbonUI;
    console.log("功能区加载完成");
};

// 文本续写按钮点击事件
window.onBtnContinueTextClick = function(control) {
    try {
        console.log("文本续写按钮点击");
        // 获取当前选中的文本
        const selectedText = getSelectedText();
        if (!selectedText) {
            wps.alert("请先选择一段文本作为续写的基础");
            return;
        }
        
        // 显示任务窗格
        showTaskpane("continueText", "文本续写", {
            text: selectedText
        });
    } catch (error) {
        console.error("文本续写处理失败：", error);
        wps.alert("处理失败：" + error.message);
    }
};

// 文本校对按钮点击事件
window.onBtnProofreadTextClick = function(control) {
    try {
        console.log("文本校对按钮点击");
        // 获取当前选中的文本
        const selectedText = getSelectedText();
        if (!selectedText) {
            wps.alert("请先选择需要校对的文本");
            return;
        }
        
        // 显示任务窗格
        showTaskpane("proofreadText", "文本校对", {
            text: selectedText
        });
    } catch (error) {
        console.error("文本校对处理失败：", error);
        wps.alert("处理失败：" + error.message);
    }
};

// 文本润色按钮点击事件
window.onBtnPolishTextClick = function(control) {
    try {
        console.log("文本润色按钮点击");
        // 获取当前选中的文本
        const selectedText = getSelectedText();
        if (!selectedText) {
            wps.alert("请先选择需要润色的文本");
            return;
        }
        
        // 显示任务窗格
        showTaskpane("polishText", "文本润色", {
            text: selectedText
        });
    } catch (error) {
        console.error("文本润色处理失败：", error);
        wps.alert("处理失败：" + error.message);
    }
};

// 文本摘要按钮点击事件
window.onBtnSummarizeTextClick = function(control) {
    try {
        console.log("文本摘要按钮点击");
        // 获取当前选中的文本
        const selectedText = getSelectedText();
        if (!selectedText) {
            wps.alert("请先选择需要生成摘要的文本");
            return;
        }
        
        // 显示任务窗格
        showTaskpane("summarizeText", "文本摘要", {
            text: selectedText
        });
    } catch (error) {
        console.error("文本摘要处理失败：", error);
        wps.alert("处理失败：" + error.message);
    }
};

// 全文总结按钮点击事件
window.onBtnSummarizeDocClick = function(control) {
    try {
        console.log("全文总结按钮点击");
        // 获取整个文档的内容
        const docContent = getDocumentContent();
        if (!docContent) {
            wps.alert("无法获取文档内容或文档为空");
            return;
        }
        
        // 显示任务窗格
        showTaskpane("summarizeDoc", "全文总结", {
            text: docContent
        });
    } catch (error) {
        console.error("全文总结处理失败：", error);
        wps.alert("处理失败：" + error.message);
    }
};

// API设置按钮点击事件
window.onBtnSettingsClick = function(control) {
    try {
        console.log("API设置按钮点击");
        // 显示设置对话框
        showDialog("settings", "API设置");
    } catch (error) {
        console.error("设置对话框显示失败：", error);
        wps.alert("显示设置失败：" + error.message);
    }
};

// 帮助按钮点击事件
window.onBtnHelpClick = function(control) {
    try {
        console.log("帮助按钮点击");
        // 显示帮助对话框
        showDialog("help", "使用帮助");
    } catch (error) {
        console.error("帮助对话框显示失败：", error);
        wps.alert("显示帮助失败：" + error.message);
    }
};

// 获取当前选中的文本
function getSelectedText() {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            return "";
        }
        
        // 获取选择区域
        const selection = doc.Selection;
        if (!selection) {
            return "";
        }
        
        return selection.Text;
    } catch (error) {
        console.error("获取选中文本失败：", error);
        return "";
    }
}

// 获取整个文档的内容
function getDocumentContent() {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            return "";
        }
        
        // 获取文档内容
        return doc.Content.Text;
    } catch (error) {
        console.error("获取文档内容失败：", error);
        return "";
    }
} 