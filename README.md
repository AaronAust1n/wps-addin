# WPS AI助手加载项

WPS AI助手是一款集成了多种人工智能功能的WPS文字插件，旨在帮助用户提高文档编辑效率。插件提供文本续写、文本校对、文本润色、文本摘要和全文总结等功能，并支持连接到内部大模型API服务。

## 功能特点

- **文本续写**：根据上下文智能续写文档内容
- **文本校对**：检查并修正文档中的错误，包括拼写、语法和语义错误
- **文本润色**：改进文档的表达和流畅度，使文章更加专业
- **文本摘要**：为选定内容生成简洁摘要，帮助理解核心内容
- **全文总结**：分析整个文档并生成总结，适用于较长文档

## 技术架构

本插件基于Vue.js和WPS加载项开发框架开发，主要使用以下技术：

- Vue.js 3
- JavaScript/HTML/CSS
- WPS加载项API
- Vite构建工具
- Axios HTTP客户端

## 目录结构

```
wps-addin/
├── ribbon/              # 功能区定义
│   └── ribbon.xml       # 功能区XML定义
├── public/              # 静态资源
│   └── images/          # 图标和图片资源
├── src/                 # 源代码
│   ├── assets/          # 静态资源
│   ├── components/      # Vue组件
│   │   ├── js/          # JavaScript模块
│   │   │   ├── util.js  # 工具函数
│   │   │   └── ...      # 其他工具
│   │   ├── TaskPane.vue # 任务窗格组件
│   │   ├── Dialog.vue   # 对话框组件
│   │   └── ribbon.js    # 功能区事件处理
│   ├── router/          # Vue路由
│   ├── App.vue          # 主组件
│   └── main.js          # 入口文件
├── index.html           # HTML模板
├── manifest.xml         # 加载项清单
├── vite.config.js       # Vite配置
└── package.json         # 项目配置
```

## 安装方法

### 开发环境

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 配置WPS支持本地加载项
   - 打开WPS文字
   - 前往"开发工具"选项卡
   - 点击"WPS加载项"
   - 点击"浏览"，选择本项目的根目录
4. 重启WPS文字，即可在功能区看到"AI助手"选项卡

### 生产环境

1. 构建项目：`npm run build`
2. 将生成的dist目录部署到Web服务器
3. 在WPS中添加加载项，指向部署好的URL

## API配置

AI助手加载项需要配置AI服务API才能正常工作。用户可以通过点击功能区中的"API设置"按钮进行配置：

- API地址：AI服务的基础URL
- API密钥：访问API所需的认证密钥
- 模型配置：可为不同功能配置不同的AI模型

## 开发指南

### 添加新功能

1. 在ribbon/ribbon.xml中添加新的按钮
2. 在src/components/ribbon.js中实现对应的事件处理函数
3. 创建新的Vue组件处理UI逻辑
4. 在router中添加新的路由

### 常见问题排查

如果插件未显示在WPS中，请检查：

1. manifest.xml是否包含正确的配置，确保`<isToolbar>true</isToolbar>`属性存在
2. ribbon.xml是否放置在ribbon目录下，且在vite.config.js中正确配置
3. 确保src/components/ribbon.js中的OnAddinLoad函数正确导出
4. 确保在App.vue中正确初始化了window.ribbon对象

### 调试技巧

1. 使用console.log在ribbon.js中添加日志，可以在WPS开发者工具中查看
2. 确保在vite.config.js中设置了正确的端口
3. 开发时确保WPS可以访问到开发服务器

## 许可协议

本项目采用MIT许可协议。详细内容请参见LICENSE文件。 