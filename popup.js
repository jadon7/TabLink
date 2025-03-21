document.addEventListener('DOMContentLoaded', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const url = new URL(currentTab.url);
  const domain = url.hostname;
  
  document.getElementById('currentDomain').textContent = domain;
  
  const defaultOption = document.getElementById('defaultOption');
  const selfOption = document.getElementById('selfOption');
  const blankOption = document.getElementById('blankOption');
  const optionButtons = [defaultOption, selfOption, blankOption];
  
  const saveMessage = document.getElementById('saveMessage');
  const openOptions = document.getElementById('openOptions');
  
  let currentValue = 'default';
  
  const clearHighlights = () => {
    optionButtons.forEach(btn => btn.classList.remove('active'));
  };
  
  const setHighlight = (value) => {
    clearHighlights();
    optionButtons.forEach(button => {
      if (button.getAttribute('data-value') === value) {
        button.classList.add('active');
      }
    });
  };
  
  const saveSettings = (value) => {
    chrome.storage.sync.get({
      selfTabDomains: '',
      newTabDomains: '',
      domainSettings: {}
    }, (items) => {
      let selfTabDomains = items.selfTabDomains.split('\n').filter(d => d.trim() !== '');
      let newTabDomains = items.newTabDomains.split('\n').filter(d => d.trim() !== '');
      let domainSettings = items.domainSettings || {};
      
      if (value === 'default') {
        delete domainSettings[domain];
        
        selfTabDomains = selfTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        newTabDomains = newTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
      } 
      else if (value === 'self') {
        domainSettings[domain] = 'self';
        
        newTabDomains = newTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        if (!selfTabDomains.some(d => domain.includes(d) || d.includes(domain))) {
          selfTabDomains.push(domain);
        }
      } 
      else if (value === 'blank') {
        domainSettings[domain] = 'blank';
        
        selfTabDomains = selfTabDomains.filter(d => !domain.includes(d) && !d.includes(domain));
        if (!newTabDomains.some(d => domain.includes(d) || d.includes(domain))) {
          newTabDomains.push(domain);
        }
      }
      
      chrome.storage.sync.set({
        selfTabDomains: selfTabDomains.join('\n'),
        newTabDomains: newTabDomains.join('\n'),
        domainSettings: domainSettings
      }, () => {
        saveMessage.style.display = 'block';
        setTimeout(() => {
          saveMessage.style.display = 'none';
        }, 2000);
        
        chrome.tabs.sendMessage(currentTab.id, { action: 'refreshSettings' });
        
        loadCurrentSettings();
      });
    });
  };
  
  optionButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentValue = button.getAttribute('data-value');
      
      saveSettings(currentValue);
    });
  });
  
  const isDomainMatch = (domainList, targetDomain) => {
    if (!domainList || !targetDomain || domainList.length === 0) return false;
    
    if (domainList.includes(targetDomain)) return true;
    
    for (const d of domainList) {
      if (!d || !d.trim()) continue;
      
      if (targetDomain !== d && targetDomain.endsWith('.' + d)) return true;
      
      if (targetDomain !== d && d.endsWith('.' + targetDomain)) return true;
      
      if (d.startsWith('*.') && targetDomain.endsWith(d.substring(2))) return true;
    }
    
    return false;
  };
  
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
      
      for (const [d, setting] of Object.entries(domainSettings)) {
        if (setting === 'self' && !isDomainMatch(selfTabDomains, d)) {
          delete domainSettings[d];
          hasChanges = true;
          console.log(`从domainSettings中删除域名 ${d} 的'self'设置`);
        }
        else if (setting === 'blank' && !isDomainMatch(newTabDomains, d)) {
          delete domainSettings[d];
          hasChanges = true;
          console.log(`从domainSettings中删除域名 ${d} 的'blank'设置`);
        }
      }
      
      if (hasChanges) {
        chrome.storage.sync.set({ domainSettings }, () => {
          console.log('已同步domainSettings与全局规则');
          loadCurrentSettings();
        });
      }
    });
  };
  
  const loadCurrentSettings = () => {
    chrome.storage.sync.get({
      selfTabDomains: '',
      newTabDomains: '',
      domainSettings: {}
    }, (items) => {
      const selfTabDomains = items.selfTabDomains.split('\n').filter(d => d.trim() !== '');
      const newTabDomains = items.newTabDomains.split('\n').filter(d => d.trim() !== '');
      const domainSettings = items.domainSettings || {};
      
      currentValue = 'default';
      
      console.log(`检查配置 - 域名: ${domain}`);
      console.log(`domainSettings: `, domainSettings[domain]);
      console.log(`在selfTabDomains中: ${isDomainMatch(selfTabDomains, domain)}`);
      console.log(`在newTabDomains中: ${isDomainMatch(newTabDomains, domain)}`);
      
      if (domain in domainSettings) {
        currentValue = domainSettings[domain];
        console.log(`从domainSettings读取设置: ${currentValue}`);
        
        if ((currentValue === 'self' && !isDomainMatch(selfTabDomains, domain)) || 
            (currentValue === 'blank' && !isDomainMatch(newTabDomains, domain))) {
          console.log(`domainSettings与全局规则不一致，删除domainSettings中的设置`);
          delete domainSettings[domain];
          currentValue = 'default';
          
          chrome.storage.sync.set({ domainSettings }, () => {
            console.log('已删除domainSettings中不一致的设置');
          });
        }
      } 
      else if (isDomainMatch(selfTabDomains, domain)) {
        currentValue = 'self';
        console.log(`从selfTabDomains匹配规则: ${currentValue}`);
      } 
      else if (isDomainMatch(newTabDomains, domain)) {
        currentValue = 'blank';
        console.log(`从newTabDomains匹配规则: ${currentValue}`);
      }
      
      setHighlight(currentValue);
      
      console.log(`最终设置值: ${currentValue}`);
    });
  };
  

  syncDomainSettings(); 
  loadCurrentSettings();
  
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      if (changes.selfTabDomains || changes.newTabDomains) {
        console.log('检测到全局规则变化，同步domainSettings');
        syncDomainSettings();
      } else if (changes.domainSettings) {
        console.log('检测到domainSettings变化，刷新UI');
        loadCurrentSettings();
      }
    }
  });
  
  openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}); 