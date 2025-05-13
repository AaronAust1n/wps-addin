<template>
  <div class="help-container">
    <div class="help-header">
      <h2>WPS AI助手 - 帮助</h2>
    </div>
    <div class="help-content">
      <div class="section">
        <h3>主要功能</h3>
        <ul>
          <li>
            <strong>文本续写</strong>：根据选中的文本或光标所在段落，智能续写内容。
          </li>
          <li>
            <strong>文本校对</strong>：检查并修正选中文本或光标所在段落中的错误。
          </li>
          <li>
            <strong>文本润色</strong>：优化选中文本或光标所在段落的表达，使其更加专业流畅。
          </li>
          <li>
            <strong>文档问答</strong>：基于当前文档内容回答问题，支持选取部分内容或全文。
          </li>
          <li>
            <strong>全文总结</strong>：为整个文档或选中内容生成摘要。
          </li>
        </ul>
      </div>
      <div class="section">
        <h3>使用方法</h3>
        <ol>
          <li>首先点击"设置"按钮配置AI接口信息</li>
          <li>文本操作（续写/校对/润色）：
            <ul>
              <li>选择需要处理的文本（或定位光标到段落中）</li>
              <li>点击对应功能按钮</li>
              <li>处理完成后，修改结果会显示在原文后</li>
              <li>按Enter接受修改，删除旧内容</li>
            </ul>
          </li>
          <li>文档问答：
            <ul>
              <li>点击"文档问答"按钮，打开侧边栏</li>
              <li>在输入框中输入问题，按回车或点击"提问"</li>
              <li>AI将基于文档内容回答问题</li>
            </ul>
          </li>
          <li>全文总结：
            <ul>
              <li>点击"全文总结"按钮，打开侧边栏</li>
              <li>如有选中内容，将生成该内容的摘要；否则生成全文摘要</li>
              <li>点击"重新生成"可刷新摘要结果</li>
            </ul>
          </li>
        </ol>
      </div>
      <div class="section">
        <h3>常见问题</h3>
        <div class="qa-item">
          <div class="question">API设置无法保存？</div>
          <div class="answer">请确保填写了必要的API地址，如使用自定义模型需填写模型名称。</div>
        </div>
        <div class="qa-item">
          <div class="question">功能按钮点击无反应？</div>
          <div class="answer">请先完成API设置，确保API连通性正常。</div>
        </div>
        <div class="qa-item">
          <div class="question">处理结果不正确？</div>
          <div class="answer">尝试使用不同的模型，或提供更多上下文信息。</div>
        </div>
      </div>
    </div>
    <div class="help-footer">
      <button @click="closeHelp" class="btn-close">关闭</button>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const closeHelp = () => {
      if (window.Application) {
        window.Application.CloseDialog()
      }
    }
    
    return {
      closeHelp
    }
  }
}
</script>

<style scoped>
.help-container {
  padding: 0;
  font-family: 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

.help-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.help-header h2 {
  margin: 0;
  color: #2b579a;
}

.help-content {
  flex: 1;
  overflow-y: visible;
  padding-right: 10px;
}

.section {
  margin-bottom: 25px;
}

.section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2b579a;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

ul, ol {
  margin-top: 5px;
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.qa-item {
  margin-bottom: 15px;
}

.question {
  font-weight: bold;
  margin-bottom: 5px;
  color: #2b579a;
}

.answer {
  color: #333;
  line-height: 1.5;
}

.help-footer {
  margin-top: 20px;
  text-align: right;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn-close {
  padding: 8px 15px;
  background-color: #2b579a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style> 