# WPS-AI-Assistant 加载项部署指南

## 问题修复和部署流程

由于WPS加载项在解析XML时可能存在问题，导致功能区显示无效和加载项无法正确显示，这份指南提供了解决方案和正确的部署步骤。

## 关键修复

### 1. 修复manifest.xml文件

在WPS加载项的manifest.xml文件中，存在以下问题需要修复:

- `<name>` 标签可能被错误解析为 `<n>` 标签
- 功能区(ribbon)结构不符合WPS要求
- 按钮应使用 `<button>` 而非 `<control>`

在发布之前，请确保手动编辑manifest.xml文件：
1. 将 `<n>WPS-AI-Assistant</n>` 修改为 `<name>WPS-AI-Assistant</name>`
2. 确保ribbon结构正确

### 2. 创建正确的ribbon.xml

如果单独使用ribbon.xml，请确保它的XML命名空间正确：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<customUI xmlns="http://schemas.wps.cn/officespace/2009/textcustomui" onLoad="ribbonOnLoad">
    <ribbon startFromScratch="false">
        <tabs>
            <tab id="AI助手" label="AI助手">
                <group id="AIFunctions" label="AI功能">
                    <button id="btnContinueText" label="文本续写" onAction="onBtnContinueTextClick" imageMso="TextBoxInsert" size="large"/>
                    <button id="btnProofreadText" label="文本校对" onAction="onBtnProofreadTextClick" imageMso="ReviewerReviewItemPrevious" size="large"/>
                    <button id="btnPolishText" label="文本润色" onAction="onBtnPolishTextClick" imageMso="StylesChangeStyles" size="large"/>
                    <button id="btnSummarizeText" label="文本摘要" onAction="onBtnSummarizeTextClick" imageMso="OutlinePromote" size="large"/>
                    <button id="btnSummarizeDoc" label="全文总结" onAction="onBtnSummarizeDocClick" imageMso="DocumentMap" size="large"/>
                </group>
                <group id="AISettings" label="设置">
                    <button id="btnSettings" label="API设置" onAction="onBtnSettingsClick" imageMso="ServerProperties" size="large"/>
                    <button id="btnHelp" label="帮助" onAction="onBtnHelpClick" imageMso="Help" size="large"/>
                </group>
            </tab>
        </tabs>
    </ribbon>
</customUI>
```

## 正确的部署步骤

### 1. 准备发布

1. 修改package.json中的name字段，确保与manifest.xml中的name一致
2. 手动检查manifest.xml文件，确保name标签正确
3. 运行构建命令

```bash
npm run build
```

### 2. 服务器部署

1. 将`wps-addon-build`目录下的所有文件复制到服务器目录（如`/var/www/html/wps-ai-assistant/`）
2. 将`wps-addon-publish`目录下的publish.html部署到适当位置（可以和加载项放在同一目录）
3. 修改publish.html中的URL，指向正确的加载项位置

### 3. 使用jsplugins.xml部署（推荐企业环境）

1. 修改jsplugins.xml文件，确保name与manifest.xml一致:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jsplugins>
    <plugin name="WPS-AI-Assistant" version="1.0.0" url="http://your-server-url/wps-ai-assistant/">
        <description>一款集成多种AI功能的WPS加载项</description>
        <application>wps</application>
    </plugin>
</jsplugins>
```

2. 将jsplugins.xml部署到服务器上
3. 配置WPS客户端JSPluginsServer指向此文件的URL

### 4. 手动安装测试

如果遇到问题，可以尝试手动安装方式:

1. 打开WPS文字
2. 转到"开发工具"选项卡
3. 点击"WPS加载项"
4. 点击"浏览"选择加载项目录
5. 检查加载项是否显示在列表中及功能区是否正常

## 常见问题排查

1. **加载项未显示**
   - 检查manifest.xml中的name标签
   - 确认WPS版本支持加载项
   - 检查部署路径是否正确

2. **功能区显示无效**
   - 检查ribbon.xml的语法和命名空间
   - 确保onAction方法在ribbon.js中定义
   - 检查imageMso值是否WPS支持

3. **按钮点击无反应**
   - 检查ribbon.js中的相应方法
   - 检查控制台是否有JavaScript错误
   - 确保taskpane和dialog文件存在且路径正确

如有更多问题，请参考[WPS加载项开发文档](https://open.wps.cn/docs/client/wpsoffice)。 