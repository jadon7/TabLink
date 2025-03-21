const translations = {
  'zh': {
    'title': '链接打开方式设置',
    'switchLang': 'EN',
    'saveSuccess': '设置已保存！',
    
    // popup.html
    'currentPageSetting': '当前网页打开方式:',
    'defaultOption': '不设置',
    'selfOption': '当前标签页',
    'blankOption': '新标签页面',
    'currentDomainLabel': '当前域名',
    'configGlobalRules': '配置全局规则',
    
    // options.html
    'shortcutTip': '快捷键提示',
    'shortcutDesc': '无论配置如何，您都可以使用快捷键强制在当前标签页打开链接：',
    'pressKey': '按住',
    'andClick': '键的同时点击链接',
    'selfTabDomainsLabel': '强制在当前标签页打开的网站列表：',
    'selfTabDomainsPlaceholder': '每行输入一个域名，例如：bilibili.com',
    'newTabDomainsLabel': '强制在新标签页打开的网站列表：',
    'newTabDomainsPlaceholder': '每行输入一个域名，例如：zhihu.com',
    'saveButton': '保存设置'
  },
  'en': {
    'title': 'Link Opening Settings',
    'switchLang': '中',
    'saveSuccess': 'Settings saved!',
    
    // popup.html
    'currentPageSetting': 'Open links on current page:',
    'defaultOption': 'Default',
    'selfOption': 'Current Tab',
    'blankOption': 'New Tab',
    'currentDomainLabel': 'Current Domain',
    'configGlobalRules': 'Configure Global Rules',
    
    // options.html
    'shortcutTip': 'Shortcut Tip',
    'shortcutDesc': 'Regardless of settings, you can force links to open in current tab by:',
    'pressKey': 'Hold',
    'andClick': 'key while clicking a link',
    'selfTabDomainsLabel': 'Websites to open in current tab:',
    'selfTabDomainsPlaceholder': 'Enter one domain per line, e.g.: example.com',
    'newTabDomainsLabel': 'Websites to open in new tab:',
    'newTabDomainsPlaceholder': 'Enter one domain per line, e.g.: google.com',
    'saveButton': 'Save Settings'
  }
};

let currentLang = 'zh';

function loadLanguagePreference() {
  chrome.storage.sync.get({ language: 'zh' }, function(items) {
    currentLang = items.language;
    applyTranslations();
  });
}

function toggleLanguage() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  
  chrome.storage.sync.set({ language: currentLang }, function() {
    console.log('Language preference saved: ' + currentLang);
  });
  
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      element.textContent = translations[currentLang][key];
    }
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[currentLang][key]) {
      element.placeholder = translations[currentLang][key];
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadLanguagePreference();
  
  const langSwitchBtn = document.getElementById('languageSwitch');
  if (langSwitchBtn) {
    langSwitchBtn.addEventListener('click', toggleLanguage);
  }
}); 