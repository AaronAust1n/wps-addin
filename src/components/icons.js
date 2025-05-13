// WPS AI助手图标管理文件
function GetImage(control) {
  const eleId = control.Id
  switch (eleId) {
    case 'btnContinueText':
      return 'images/text_continue.svg'
    case 'btnProofreadText':
      return 'images/text_proofread.svg'
    case 'btnPolishText':
      return 'images/text_polish.svg'
    case 'btnDocumentQA':
      return 'images/qa.svg'
    case 'btnSummarizeDoc':
      return 'images/doc_summarize.svg'
    case 'btnHistory':
      return 'images/history.svg'
    case 'btnSettings':
      return 'images/settings.svg'
    case 'btnHelp':
      return 'images/help.svg'
    default:
      return 'images/icon.svg'
  }
}

// 导出GetImage函数供WPS调用
export default {
  GetImage
} 