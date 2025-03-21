// 在页面加载时获取当前标签页信息
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const url = new URL(currentTab.url);
  const domain = url.hostname;
  
  // 显示当前域名
  document.getElementById('currentDomain').textContent = domain;
  
  // 获取选项按钮
  const defaultOption = document.getElementById('defaultOption');
  const selfOption = document.getElementById('selfOption');
  const blankOption = document.getElementById('blankOption');
  const optionButtons = [defaultOption, selfOption, blankOption];
  
  // 获取其他元素
  const saveMessage = document.getElementById('saveMessage');
  const openOptions = document.getElementById('openOptions');
  
  // 当前选中的值
  let currentValue = 'default';
  
  // 清除所有按钮高亮状态
  const clearHighlights = () => {
    optionButtons.forEach(btn => btn.classList.remove('active'));
  };
  
  // 设置指定按钮高亮
  const setHighlight = (value) => {
    clearHighlights();
    optionButtons.forEach(button => {
      if (button.getAttribute('data-value') === value) {
        button.classList.add('active');
      }
    });
  };
  
  // 保存当前页面设置的函数
  const saveSettings = (value) => {
    chrome.storage.sync.get({
      selfTabDomains: '',
      newTabDomains: '',
      domainSettings: {}
    }, (items) => {
      let selfTabDomains = items.selfTabDomains.split('\n').filter(d => d.trim() !== '');
      let newTabDomains = items.newTabDomains.split('\n').filter(d => d.trim() !== '');
      let domainSettings = items.domainSettings || {};
      
      // 如果设置为默认，则删除任何特殊设置
      if (value === 'default') {
        delete domainSettings[domain];
        
        // 从两个列表中都移除当前域名
        selfTabDomains = selfTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        newTabDomains = newTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
      } 
      // 如果设置为当前标签页打开
      else if (value === 'self') {
        domainSettings[domain] = 'self';
        
        // 从新标签页列表移除，并确保在当前标签页列表中
        newTabDomains = newTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        if (!selfTabDomains.some(d => domain.includes(d) || d.includes(domain))) {
          selfTabDomains.push(domain);
        }
      } 
      // 如果设置为新标签页打开
      else if (value === 'blank') {
        domainSettings[domain] = 'blank';
        
        // 从当前标签页列表移除，并确保在新标签页列表中
        selfTabDomains = selfTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        if (!newTabDomains.some(d => domain.includes(d) || d.includes(domain))) {
          newTabDomains.push(domain);
        }
      }
      
      // 保存设置
      chrome.storage.sync.set({
        selfTabDomains: selfTabDomains.join('\n'),
        newTabDomains: newTabDomains.join('\n'),
        domainSettings: domainSettings
      }, () => {
        // 显示保存成功消息
        saveMessage.style.display = 'block';
        setTimeout(() => {
          saveMessage.style.display = 'none';
        }, 2000);
        
        // 通知内容脚本刷新设置
        chrome.tabs.sendMessage(currentTab.id, { action: 'refreshSettings' });
        
        // 刷新UI高亮状态
        loadCurrentSettings();
      });
    });
  };
  
  // 设置按钮点击处理
  optionButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 更新当前值
      currentValue = button.getAttribute('data-value');
      
      // 自动保存设置
      saveSettings(currentValue);
    });
  });
  
  // 检查域名是否匹配规则
  const isDomainMatch = (domainList, targetDomain) => {
    if (!domainList || !targetDomain || domainList.length === 0) return false;
    
    // 精确匹配当前域名
    if (domainList.includes(targetDomain)) return true;
    
    for (const d of domainList) {
      if (!d || !d.trim()) continue;
      
      // 子域名匹配（targetDomain是d的子域名）
      if (targetDomain !== d && targetDomain.endsWith('.' + d)) return true;
      
      // 顶级域名匹配（d是targetDomain的子域名）
      if (targetDomain !== d && d.endsWith('.' + targetDomain)) return true;
      
      // 通配符域名匹配
      if (d.startsWith('*.') && targetDomain.endsWith(d.substring(2))) return true;
    }
    
    return false;
  };
  
  // 同步domainSettings和全局规则设置
  const syncDomainSettings = () => {
    chrome.storage.sync.get({
      selfTabDomains: '',
      newTabDomains: '',
      domainSettings: {}
    }, (items) => {
      const selfTabDomains = items.selfTabDomains.split('\n').filter(d => d.trim() !== '');
      const newTabDomains = items.newTabDomains.split('\n').filter(d => d.trim() !== '');
      let domainSettings = items.domainSettings || {};
      let hasChanges = false;
      
      // 遍历所有domainSettings，确保每个域名的设置与全局规则一致
      for (const [d, setting] of Object.entries(domainSettings)) {
        // 如果设置为self但不在selfTabDomains中，删除此设置
        if (setting === 'self' && !isDomainMatch(selfTabDomains, d)) {
          delete domainSettings[d];
          hasChanges = true;
          console.log(`从domainSettings中删除域名 ${d} 的'self'设置`);
        }
        // 如果设置为blank但不在newTabDomains中，删除此设置
        else if (setting === 'blank' && !isDomainMatch(newTabDomains, d)) {
          delete domainSettings[d];
          hasChanges = true;
          console.log(`从domainSettings中删除域名 ${d} 的'blank'设置`);
        }
      }
      
      // 如果有更改，保存更新后的domainSettings
      if (hasChanges) {
        chrome.storage.sync.set({ domainSettings }, () => {
          console.log('已同步domainSettings与全局规则');
          loadCurrentSettings();
        });
      }
    });
  };
  
  // 加载当前页面的设置
  const loadCurrentSettings = () => {
    chrome.storage.sync.get({
      selfTabDomains: '',
      newTabDomains: '',
      domainSettings: {}
    }, (items) => {
      const selfTabDomains = items.selfTabDomains.split('\n').filter(d => d.trim() !== '');
      const newTabDomains = items.newTabDomains.split('\n').filter(d => d.trim() !== '');
      const domainSettings = items.domainSettings || {};
      
      // 默认值设为default
      currentValue = 'default';
      
      console.log(`检查配置 - 域名: ${domain}`);
      console.log(`domainSettings: `, domainSettings[domain]);
      console.log(`在selfTabDomains中: ${isDomainMatch(selfTabDomains, domain)}`);
      console.log(`在newTabDomains中: ${isDomainMatch(newTabDomains, domain)}`);
      
      // 检查当前域名是否已有特定设置
      if (domain in domainSettings) {
        currentValue = domainSettings[domain];
        console.log(`从domainSettings读取设置: ${currentValue}`);
        
        // 检查设置是否与全局规则一致
        if ((currentValue === 'self' && !isDomainMatch(selfTabDomains, domain)) || 
            (currentValue === 'blank' && !isDomainMatch(newTabDomains, domain))) {
          console.log(`domainSettings与全局规则不一致，删除domainSettings中的设置`);
          delete domainSettings[domain];
          currentValue = 'default';
          
          // 保存更新后的domainSettings
          chrome.storage.sync.set({ domainSettings }, () => {
            console.log('已删除domainSettings中不一致的设置');
          });
        }
      } 
      // 或者检查是否在全局规则中
      else if (isDomainMatch(selfTabDomains, domain)) {
        currentValue = 'self';
        console.log(`从selfTabDomains匹配规则: ${currentValue}`);
      } 
      else if (isDomainMatch(newTabDomains, domain)) {
        currentValue = 'blank';
        console.log(`从newTabDomains匹配规则: ${currentValue}`);
      }
      
      // 设置当前选中的按钮
      setHighlight(currentValue);
      
      console.log(`最终设置值: ${currentValue}`);
    });
  };
  
  // 立即加载设置，确保每次打开浮层都会读取最新配置
  syncDomainSettings(); // 先同步设置
  loadCurrentSettings(); // 然后加载当前设置
  
  // 监听存储变化，当全局配置更改时更新UI
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      // 检查是否有与我们相关的变化（selfTabDomains、newTabDomains或domainSettings）
      if (changes.selfTabDomains || changes.newTabDomains) {
        console.log('检测到全局规则变化，同步domainSettings');
        syncDomainSettings();
      } else if (changes.domainSettings) {
        console.log('检测到domainSettings变化，刷新UI');
        loadCurrentSettings();
      }
    }
  });
  
  // 打开选项页面
  openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}); 