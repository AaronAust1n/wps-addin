<template>
  <div class="root-container">
    <div class="header">
      <h1>WPS AI助手</h1>
      <div class="version">v1.0.0</div>
    </div>
    <div class="content">
      <div class="welcome-message">
        <p>欢迎使用WPS AI助手！</p>
        <p>本加载项提供多种AI辅助功能，帮助您高效处理文档。</p>
      </div>
      <div class="features">
        <h2>主要功能</h2>
        <ul>
          <li>
            <div class="icon">📝</div>
            <div class="feature-info">
              <h3>文本续写</h3>
              <p>根据上下文智能续写文档内容</p>
            </div>
          </li>
          <li>
            <div class="icon">✓</div>
            <div class="feature-info">
              <h3>文本校对</h3>
              <p>检查并修正文档中的错误</p>
            </div>
          </li>
          <li>
            <div class="icon">✨</div>
            <div class="feature-info">
              <h3>文本润色</h3>
              <p>改进文档表达，使文章更专业</p>
            </div>
          </li>
          <li>
            <div class="icon">📋</div>
            <div class="feature-info">
              <h3>文本摘要</h3>
              <p>为选定内容生成简洁摘要</p>
            </div>
          </li>
          <li>
            <div class="icon">📚</div>
            <div class="feature-info">
              <h3>全文总结</h3>
              <p>分析整个文档并生成总结</p>
            </div>
          </li>
        </ul>
      </div>
      <div class="getting-started">
        <h2>使用方法</h2>
        <ol>
          <li>在WPS文字中选择要处理的文本</li>
          <li>点击"AI助手"选项卡中的相应功能按钮</li>
          <li>等待处理完成，查看结果</li>
        </ol>
      </div>
      <div class="settings-info">
        <h2>API设置</h2>
        <p>首次使用时，请先在"API设置"中配置AI服务信息</p>
        <div class="config-button" @click="openSettings">配置API</div>
      </div>
    </div>
    <div class="footer">
      <p>© 2023-2024 AI助手开发团队</p>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const openSettings = () => {
      if (window.Application && window.Util) {
        window.Application.ShowDialog(
          window.Util.GetUrlPath() + window.Util.GetRouterHash() + '/dialog',
          'WPS AI助手 - 设置',
          450,
          600,
          false
        )
      }
    }

    return {
      openSettings
    }
  }
}
</script>

<style scoped>
.root-container {
  font-family: 'Microsoft YaHei', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  color: #333;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.header h1 {
  color: #4a86e8;
  margin: 0;
}

.version {
  position: absolute;
  top: 5px;
  right: 0;
  color: #888;
  font-size: 12px;
}

.content {
  margin-bottom: 40px;
}

.welcome-message {
  font-size: 16px;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 30px;
}

.features h2, .getting-started h2, .settings-info h2 {
  color: #4a86e8;
  font-size: 18px;
  margin-bottom: 15px;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
}

.features li:hover {
  background-color: #f9f9f9;
}

.features .icon {
  font-size: 24px;
  margin-right: 15px;
  width: 40px;
  text-align: center;
}

.feature-info h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.feature-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.getting-started ol {
  padding-left: 20px;
  line-height: 1.6;
}

.settings-info {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f9ff;
  border-radius: 5px;
  text-align: center;
}

.config-button {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4a86e8;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.config-button:hover {
  background-color: #3b78e7;
}

.footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #888;
  font-size: 12px;
}
</style> 