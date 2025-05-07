# WPS AI助手加载项

WPS AI助手是一款集成了多种人工智能功能的WPS文字插件，旨在帮助用户提高文档编辑效率。插件提供文本续写、文本校对、文本润色、文本摘要和全文总结等功能，并支持连接到内部大模型API服务。

## 功能特点

- **文本续写**：根据上下文智能续写文档内容
- **文本校对**：检查并修正文档中的错误，包括拼写、语法和语义错误
- **文本润色**：改进文档的表达和流畅度，使文章更加专业
- **文本摘要**：为选定内容生成简洁摘要，帮助理解核心内容
- **全文总结**：分析整个文档并生成总结，适用于较长文档

## 技术架构

本插件基于WPS加载项开发框架开发，主要使用以下技术：

- JavaScript/HTML/CSS
- WPS加载项API
- Office JS API
- Fetch API

## 目录结构

```
wps-addin/
├── ribbon/               # 功能区配置
│   └── ribbon.xml        # 功能区定义
├── js/                   # JavaScript模块
│   ├── ribbon.js         # 功能区事件处理
│   ├── aiServices.js     # AI服务API
│   ├── ui.js             # UI相关模块
│   ├── settings.js       # 配置管理模块
│   └── utils.js          # 工具函数
├── css/                  # 样式文件
│   ├── common.css        # 公共样式
│   └── taskpane.css      # 任务窗格样式
├── taskpanes/            # 任务窗格HTML
│   ├── default.html      # 默认任务窗格
│   ├── continueText.html # 文本续写任务窗格
│   └── ...               # 其他功能任务窗格
├── dialogs/              # 对话框HTML
│   ├── settings.html     # 设置对话框
│   └── help.html         # 帮助对话框
└── main.js               # 主入口文件
```

## 安装方法

### 开发环境

1. 克隆仓库到本地
2. 配置WPS支持本地加载项
   - 打开WPS文字
   - 前往"开发工具"选项卡
   - 点击"WPS加载项"
   - 点击"浏览"，选择本项目的根目录
3. 重启WPS文字，即可在功能区看到"AI助手"选项卡

### 生产环境

#### 方法一：使用publish模式部署

1. 安装wpsjs工具包：`npm install -g wpsjs`
2. 打包加载项：`wpsjs publish`
3. 将生成的wps-addon-build目录下的文件部署到服务器
4. 将wps-addon-publish目录下的publish.html文件部署到服务器
5. 用户访问publish.html页面，点击安装按钮

#### 方法二：使用jsplugins.xml模式部署

1. 配置jsplugins.xml文件，指定加载项位置
2. 为用户WPS配置JSPluginsServer，指向jsplugins.xml文件
3. 用户启动WPS时，自动加载插件

## API配置

AI助手加载项需要配置AI服务API才能正常工作。用户可以通过点击功能区中的"API设置"按钮进行配置：

- API地址：AI服务的基础URL
- API密钥：访问API所需的认证密钥
- 模型配置：可为不同功能配置不同的AI模型
- 高级选项：调整生成文本的最大长度、创造性等参数

## 开发指南

### 添加新功能

1. 在ribbon.xml中添加新的按钮
2. 在ribbon.js中实现对应的事件处理函数
3. 在aiServices.js中添加新的API调用方法
4. 创建新的任务窗格HTML文件

### 自定义AI模型

可以通过修改settings.js中的默认配置来自定义AI模型：

```javascript
function getDefaultConfig() {
    return {
        apiUrl: "https://api.example.com/ai",
        apiKey: "",
        models: {
            continuationModel: "your-model-name",
            // 其他模型...
        },
        // 其他配置...
    };
}
```

## 注意事项

- 插件依赖于网络连接，确保用户能够访问配置的API服务
- API密钥不会在网络之外传输，仅存储在用户本地
- 对于敏感文档，建议用户使用私有部署的AI服务

## 许可协议

本项目采用MIT许可协议。详细内容请参见LICENSE文件。 