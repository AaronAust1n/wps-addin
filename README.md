# WPS AI助手加载项

WPS AI助手是一款集成了多种人工智能功能的WPS Office加载项，旨在帮助用户提高文档编辑、电子表格分析和演示文稿制作的效率。插件提供文本续写、文本校对、高级文本改写、文本摘要、全文总结、单元格描述和形状文本概述等功能，并支持连接到兼容OpenAI API格式的多种大型语言模型。

## 功能特点

- **文本续写**：根据上下文智能续写文档内容
- **文本校对**：检查并修正文档中的错误，包括拼写、语法和语义错误
- **高级文本改写 (Advanced Paraphrasing)**：提供多种模式（如简化、正式化、缩短、扩展）或自定义指令对选定文本进行高级改写。
- **文本摘要**：为选定内容生成简洁摘要，帮助理解核心内容
- **全文总结**：分析整个文档并生成总结，适用于较长文档
- **单元格描述 (表格 ET)**: 读取电子表格中选定单元格的内容，并由AI提供描述或分析。
- **概述形状文本 (演示 WPP)**: 提取演示文稿中选定形状（如文本框）的文本内容，并由AI生成摘要。

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

### 离线插件包部署 (Offline Plugin Package Deployment)

为了在不依赖本地开发服务器的情况下使用插件，或将其分发给其他用户，您需要构建并安装离线插件包：

1.  **构建插件资源**:
    ```bash
    npm run build
    ```
    此命令会使用Vite编译应用，并将包括`manifest.xml`在内的必要资源输出到 `dist/` 目录。

2.  **打包离线插件**:
    ```bash
    npx wpsjs build
    ```
    当提示时，请选择 **"离线插件" (Offline Plugin)** 类型。此命令会将在 `dist/` 目录中的资源打包成一个 `.7z` 文件，通常位于 `wps-addon-build/WPS-AI-Assistant.7z`。

3.  **在WPS中安装插件包**:
    *   打开WPS Office应用程序（如WPS文字、WPS表格或WPS演示）。
    *   通过“开发工具” -> “WPS加载项” -> “浏览” (或类似的路径，具体取决于您的WPS版本和语言设置) 来管理加载项。
    *   选择“从本地文件安装”（或类似选项），然后找到并选择前一步中生成的 `wps-addon-build/WPS-AI-Assistant.7z` 文件。
    *   如果提示，请确认安装并信任该加载项。
    *   重启WPS Office应用程序。

4.  **验证**: "AI助手" 选项卡及其功能（包括适用于文字、表格和演示文稿的功能）现在应该可以在功能区中使用了，无需运行本地开发服务器。

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

### WPS表格 (ET) 功能

1.  打开一个WPS电子表格文件。
2.  选择一个包含数据的单元格。
3.  点击"AI助手"选项卡中的"单元格描述"按钮。
4.  任务窗格将显示单元格内容，点击"AI描述内容"按钮获取AI分析。
5.  可使用"获取单元格实时内容"刷新所选单元格。

### WPS演示 (WPP) 功能

1.  打开一个WPS演示文稿文件。
2.  选择一个包含文本的形状 (例如文本框)。
3.  点击"AI助手"选项卡中的"概述形状文本"按钮。
4.  任务窗格将显示形状中的文本，点击"AI概述"按钮获取AI摘要。
5.  可使用"获取选定形状文本"刷新所选形状的文本。

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

## 许可协议

本项目采用MIT许可协议。详细内容请参见LICENSE文件。

## 已知限制和未来改进

*   **上下文相关的Ribbon按钮**: 目前，所有功能的Ribbon按钮（包括针对表格和演示文稿的）在所有WPS应用中都可见。未来可以改进为仅在对应的WPS应用激活时显示相关按钮。
*   **ET/WPP API交互**: 与WPS表格(ET)和WPS演示(WPP)的API交互是基于通用模式实现的。根据用户在不同WPS版本上的测试反馈，可能需要进一步的调整和优化。
*   **更丰富的ET/WPP功能**: 当前为ET和WPP实现的功能是基础的“案例研究”。未来可以扩展更多针对性的AI功能，例如：
    *   ET: 从自然语言生成公式、数据趋势分析、图表建议。
    *   WPP: 从大纲生成幻灯片、演讲者备注生成、设计一致性检查。
*   **错误处理**: 现有的错误处理是基础的，可以进一步增强用户体验。
