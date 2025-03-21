// 当页面加载完成时，从存储中获取设置并填充表单
document.addEventListener('DOMContentLoaded', () => {
  // 获取表单元素
  const selfTabDomainsInput = document.getElementById('selfTabDomains');
  const newTabDomainsInput = document.getElementById('newTabDomains');
  const saveButton = document.getElementById('save');
  const saveMessage = document.getElementById('saveMessage');
  
  // 从Chrome存储中加载设置
  chrome.storage.sync.get({
    selfTabDomains: '',  // 默认设置为空
    newTabDomains: ''
  }, (items) => {
    // 填充表单
    selfTabDomainsInput.value = items.selfTabDomains;
    newTabDomainsInput.value = items.newTabDomains;
  });
  
  // 标准化链接格式的函数
  const standardizeLinks = (linksText) => {
    if (!linksText.trim()) return '';
    
    // 分割多行文本为数组
    const links = linksText.split('\n');
    
    // 过滤并标准化每个链接
    const standardizedLinks = links
      .map(link => {
        // 去除前后空白
        link = link.trim();
        if (!link) return null;
        
        try {
          // 尝试创建URL对象（为没有协议的域名添加临时协议）
          let url;
          if (link.startsWith('http://') || link.startsWith('https://')) {
            url = new URL(link);
          } else {
            url = new URL('http://' + link);
          }
          
          // 只返回hostname部分（域名）
          return url.hostname;
        } catch (e) {
          // 如果不是有效URL，尝试基本清理
          // 移除协议部分
          link = link.replace(/^(https?:\/\/)?(www\.)?/i, '');
          // 移除路径和查询参数
          link = link.split('/')[0].split('?')[0].split('#')[0];
          
          // 如果清理后仍有内容，则返回
          return link || null;
        }
      })
      .filter(Boolean) // 移除空值
      .filter((link, index, self) => self.indexOf(link) === index); // 去除重复项
    
    // 将数组转回多行文本
    return standardizedLinks.join('\n');
  };
  
  // 保存设置
  saveButton.addEventListener('click', () => {
    // 获取输入值并标准化
    const selfTabDomains = standardizeLinks(selfTabDomainsInput.value);
    const newTabDomains = standardizeLinks(newTabDomainsInput.value);
    
    // 更新输入框显示标准化后的值
    selfTabDomainsInput.value = selfTabDomains;
    newTabDomainsInput.value = newTabDomains;
    
    // 保存到Chrome存储
    chrome.storage.sync.set({
      selfTabDomains: selfTabDomains,
      newTabDomains: newTabDomains
    }, () => {
      // 显示保存成功消息
      saveMessage.style.display = 'block';
      
      // 3秒后隐藏消息
      setTimeout(() => {
        saveMessage.style.display = 'none';
      }, 3000);
    });
  });
}); 