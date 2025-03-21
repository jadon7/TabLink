chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('链接打开方式管理扩展已安装');
  } else if (details.reason === 'update') {
    console.log('链接打开方式管理扩展已更新');
  }
});
