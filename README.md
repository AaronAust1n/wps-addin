# WPS AI助手加载项

WPS AI助手是一款集成了多种人工智能功能的WPS文字插件，旨在帮助用户提高文档编辑效率。插件提供文本续写、文本校对、文本润色、文本摘要和全文总结等功能，并支持连接到兼容OpenAI API格式的多种大型语言模型。

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
│   │   │   ├── api.js   # API客户端
│   │   │   ├── util.js  # 工具函数
│   │   │   └── ...      # 其他工具
│   │   ├── TaskPane.vue # 任务窗格组件
│   │   ├── Dialog.vue   # 对话框组件
│   │   ├── Loading.vue  # 加载状态组件
│   │   └── ribbon.js    # 功能区事件处理
│   ├── router/          # 路由配置
│   └── main.js          # 应用入口
└── manifest.xml         # 加载项清单
```

## 安装和部署

### 开发环境

1. 克隆项目：`git clone https://github.com/yourusername/wps-ai-assistant.git`
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev/wpsjs debug`
4. 配置WPS支持本地加载项
   - 打开WPS文字
   - 前往"开发工具"选项卡
   - 点击"WPS加载项"
   - 点击"浏览"，选择本项目的根目录
5. 重启WPS文字，即可在功能区看到"AI助手"选项卡

### 生产环境

1. 构建项目：`npm run build`
2. 将生成的dist目录部署到Web服务器
3. 在WPS中添加加载项，指向部署好的URL

## API配置

AI助手加载项支持连接到任何兼容OpenAI API格式的服务。用户可以通过点击功能区中的"API设置"按钮进行以下配置：

- **API地址**：AI服务的基础URL，例如：

  - OpenAI: `https://api.openai.com`
  - Azure OpenAI: `https://{your-resource-name}.openai.azure.com`
  - 私有化部署API服务: `http://your-server-address:port`
- **API密钥**：访问API所需的认证密钥（对于某些私有化部署服务可能是可选的）
- **默认模型**：支持多种大型语言模型，包括：

  - OpenAI系列：GPT-3.5 Turbo、GPT-4、GPT-4 Turbo
  - Google系列：Gemini Pro、Gemini 1.5 Pro
  - Anthropic系列：Claude 3 Opus、Claude 3 Sonnet
  - 阿里云系列：Qwen Turbo、Qwen Plus、Qwen Max
  - 百度系列：文心一言 ERNIE Bot 4.0、ERNIE Bot
  - 其他开源模型：DeepSeek Chat、Llama 3 70B等
  - 自定义模型：支持输入任何兼容的模型名称
- **高级设置**：

  - 最大输出令牌数：控制模型生成文本的最大长度
  - 随机性（Temperature）：控制生成文本的创意程度，0表示最确定性，1表示最创意
  - 针对不同功能选择特定模型：可为文本续写、校对、润色、摘要等功能分别配置不同的模型

## 使用方法

1. 在WPS文字中打开一个文档
2. 点击"AI助手"选项卡
3. 选择要操作的文本（对于全文总结功能不需要选择）
4. 点击所需功能按钮，例如"文本续写"、"文本校对"等
5. 插件将处理选中文本并返回结果
6. 根据功能不同，结果可能直接替换选中文本或提示用户选择替换方式

## 开发指南

### 添加新功能

1. 在ribbon/ribbon.xml中添加新的按钮
2. 在src/components/ribbon.js中实现对应的事件处理函数
3. 在src/components/js/api.js中添加新的API调用方法
4. 如需，创建新的Vue组件处理UI逻辑
5. 在router中添加新的路由（如果需要）

### 常见问题排查

如果插件未显示在WPS中，请检查：

1. manifest.xml是否包含正确的配置，确保 `<isToolbar>true</isToolbar>`属性存在
2. ribbon.xml是否放置在ribbon目录下，且在vite.config.js中正确配置
3. 确保src/components/ribbon.js中的OnAddinLoad函数正确导出
4. 确保在App.vue中正确初始化了window.ribbon对象

### 调试技巧

1. 使用console.log在ribbon.js中添加日志，可以在WPS开发者工具中查看
2. 确保在vite.config.js中设置了正确的端口
3. 开发时确保WPS可以访问到开发服务器

## Microsoft Office Add-in Integration

### 1. Overview

This project now supports a Microsoft Office Add-in version, allowing the AI Assistant to be used within Microsoft Word (and potentially other Office applications like Excel, PowerPoint with future enhancements). This is alongside the existing WPS Office Add-in.

### 2. Development Setup for Office Add-in

To develop and test the Office Add-in:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Vite Development Server:**
    ```bash
    npm run dev
    ```
    This command starts the development server, which by default runs on `https://localhost:3889`. It uses HTTPS, which is required for Office Add-ins. The server will automatically use a self-signed SSL certificate (via `vite-plugin-mkcert`). You may need to trust this certificate in your browser or system the first time you access it.

3.  **Manifest File:**
    *   The Office Add-in uses `manifest-office.xml`. This file defines the add-in's properties, ribbon UI, and where Office should load its resources from (e.g., `https://localhost:3889/index.html` for the task pane, `https://localhost:3889/functionfile.html` for ribbon commands during development).

### 3. Sideloading the Office Add-in (for Development)

To test your add-in in Office, you need to "sideload" the `manifest-office.xml` file. This tells Office to load your add-in from your local development server.

*   **Office on Windows:**
    1.  Create a network share for your project directory (e.g., `\\MyPC\wps-ai-assistant`).
    2.  In Word, go to `File > Options > Trust Center > Trust Center Settings... > Trusted Add-in Catalogs`.
    3.  Enter the network share path (e.g., `\\MyPC\wps-ai-assistant`) as the `Catalog Url`, and click `Add catalog`.
    4.  Check the `Show in Menu` box and click `OK`.
    5.  Close and reopen Word.
    6.  On the `Insert` tab, click `My Add-ins`. Under `Shared Folder`, you should see your add-in.

*   **Office on Mac:**
    1.  Open Finder, and press `Command+Shift+G`.
    2.  Enter `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/` (for Word). If the `wef` folder doesn't exist, create it.
        *   For Excel: `~/Library/Containers/com.microsoft.Excel/Data/Documents/wef/`
        *   For PowerPoint: `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/`
    3.  Copy your `manifest-office.xml` file into this `wef` folder.
    4.  Close and reopen Word.
    5.  On the `Insert` tab, click `My Add-ins`. You should see your add-in.

*   **Office on the Web (e.g., Word Online):**
    1.  Open Word Online (or Excel Online, etc.).
    2.  On the `Insert` tab, click `Add-ins` (or `Office Add-ins`).
    3.  In the Office Add-ins dialog, select `MY ADD-INS`, then click `Manage My Add-ins`, and choose `Upload My Add-in`.
    4.  Browse to your `manifest-office.xml` file and upload it.
    5.  Your add-in should now appear in the ribbon.

### 4. Building for Production

1.  **Build Command:**
    ```bash
    npm run build
    ```
    This command bundles the application and outputs the static files to the `dist/` directory.

2.  **Deployment:**
    *   For production, all files in the `dist/` folder (which includes `index.html`, `functionfile.html`, JavaScript assets like `assets/office-integration.js`, CSS files, and `manifest-office.xml`) must be deployed to an HTTPS-enabled web server.
    *   **Crucially**, you must update the URLs within the `manifest-office.xml` file that you deploy to production. All instances of `https://localhost:3889/...` must be changed to point to your actual production hosting URLs (e.g., `https://your-domain.com/office-addin/...`).

### 5. Key Files for Office Integration

*   **`manifest-office.xml`**: The manifest file for the Office Add-in. Configures how the add-in appears and operates within Office applications.
*   **`public/functionfile.html`**: A simple HTML page that loads the Office.js library and the JavaScript file (`assets/office-integration.js` after build) responsible for handling ribbon commands.
*   **`src/components/js/office-integration.js`**: This file contains:
    *   The JavaScript logic for functions executed by ribbon buttons.
    *   An abstraction layer (`OfficeAppApi`) to interact with the Office.js API, providing similar functionalities to those used by the WPS add-in (e.g., getting selected text, inserting text).

### 6. Known Issues / Current Status

*   **Build Command Timeout:** During automated testing, the `npm run build` command sometimes timed out. Local verification of the build process completion is recommended.
*   **Feature Parity & Refinement:**
    *   The integration is new, and some features or UI elements might require further refinement or thorough testing specifically for the Office environment.
    *   Full implementation of `getCurrentParagraph` and `getDocumentText` within `src/components/js/office-integration.js` (the `OfficeAppApi` module) is still pending and currently uses placeholders. These are more complex to implement robustly across different Office hosts.
    *   The primary host tested is Word. Behavior in Excel or PowerPoint might require additional manifest configurations and testing.

## 许可协议

本项目采用MIT许可协议。详细内容请参见LICENSE文件。
