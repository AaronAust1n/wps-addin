/**
 * 工具函数模块
 * 提供各种实用工具函数
 */

// 获取当前选中的文本
window.getSelectedText = function() {
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
};

// 替换选中的文本
window.replaceSelectedText = function(newText) {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            throw new Error("无法获取活动文档");
        }
        
        // 获取选择区域
        const selection = doc.Selection;
        if (!selection) {
            throw new Error("无法获取选择区域");
        }
        
        // 替换文本
        selection.Text = newText;
        
        return true;
    } catch (error) {
        console.error("替换选中文本失败：", error);
        return false;
    }
};

// 获取整个文档的内容
window.getDocumentContent = function() {
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
};

// 将文本添加到文档末尾
window.appendToDocument = function(text) {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            throw new Error("无法获取活动文档");
        }
        
        // 获取文档内容范围
        const content = doc.Content;
        
        // 将光标移到文档末尾
        content.Collapse(0); // 0表示文档末尾
        
        // 插入文本
        content.InsertAfter(text);
        
        return true;
    } catch (error) {
        console.error("添加文本到文档末尾失败：", error);
        return false;
    }
};

// 获取选中区域的上下文（前后文本）
window.getTextContext = function(contextLength = 500) {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            return { before: "", selected: "", after: "" };
        }
        
        // 获取选择区域
        const selection = doc.Selection;
        if (!selection) {
            return { before: "", selected: "", after: "" };
        }
        
        // 获取选中文本
        const selectedText = selection.Text;
        
        // 保存当前选择位置
        const selStart = selection.Start;
        const selEnd = selection.End;
        
        // 获取选中区域前面的内容
        let beforeText = "";
        if (selStart > 0) {
            // 创建范围从文档开始到选择区域开始
            const beforeRange = doc.Range(Math.max(0, selStart - contextLength), selStart);
            beforeText = beforeRange.Text;
        }
        
        // 获取选中区域后面的内容
        let afterText = "";
        const docLength = doc.Content.End;
        if (selEnd < docLength) {
            // 创建范围从选择区域结束到文档结束
            const afterRange = doc.Range(selEnd, Math.min(docLength, selEnd + contextLength));
            afterText = afterRange.Text;
        }
        
        return {
            before: beforeText,
            selected: selectedText,
            after: afterText
        };
    } catch (error) {
        console.error("获取文本上下文失败：", error);
        return { before: "", selected: "", after: "" };
    }
};

// 高亮显示文本
window.highlightText = function(start, end, color = 255) {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            throw new Error("无法获取活动文档");
        }
        
        // 创建范围
        const range = doc.Range(start, end);
        
        // 设置高亮颜色
        range.HighlightColorIndex = color;
        
        return true;
    } catch (error) {
        console.error("高亮文本失败：", error);
        return false;
    }
};

// 删除高亮
window.removeHighlight = function(start, end) {
    try {
        // 获取当前活动文档
        const doc = wps.WpsApplication().ActiveDocument;
        if (!doc) {
            throw new Error("无法获取活动文档");
        }
        
        // 创建范围
        const range = doc.Range(start, end);
        
        // 删除高亮颜色
        range.HighlightColorIndex = 0;
        
        return true;
    } catch (error) {
        console.error("删除高亮失败：", error);
        return false;
    }
};

// 格式化日期时间
window.formatDateTime = function(date) {
    try {
        date = date || new Date();
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error("格式化日期时间失败：", error);
        return "";
    }
}; 