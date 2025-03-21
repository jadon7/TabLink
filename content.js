let selfTabDomains = [];
let newTabDomains = [];
let zKeyPressed = false;
let domainSettings = {};

function createToast() {
  if (document.getElementById('z-key-toast')) {
    return;
  }
  
  const toast = document.createElement('div');
  toast.id = 'z-key-toast';
  toast.textContent = '已激活: 点击链接将在当前标签页打开';
  
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  toast.style.color = 'white';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '4px';
  toast.style.fontSize = '14px';
  toast.style.fontFamily = 'Microsoft YaHei, sans-serif';
  toast.style.zIndex = '10000';
  toast.style.display = 'none';
  toast.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  toast.style.transition = 'opacity 0.3s ease-in-out';
  toast.style.pointerEvents = 'none';
  
  document.body.appendChild(toast);
}

function showToast() {
  const toast = document.getElementById('z-key-toast');
  if (toast) {
    toast.style.display = 'block';
    toast.style.opacity = '1';
  }
}

function hideToast() {
  const toast = document.getElementById('z-key-toast');
  if (toast) {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }
}

function loadSettings() {
  chrome.storage.sync.get({
    selfTabDomains: '',
    newTabDomains: '',
    domainSettings: {}
  }, (items) => {
    selfTabDomains = items.selfTabDomains.split('\n').filter(domain => domain.trim() !== '');
    newTabDomains = items.newTabDomains.split('\n').filter(domain => domain.trim() !== '');
    domainSettings = items.domainSettings || {};
    
    processLinks();
  });
}

function matchesDomain(url, domainList) {
  return domainList.some(domain => {
    const trimmedDomain = domain.trim();
    return trimmedDomain !== '' && url.includes(trimmedDomain);
  });
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

function shouldOpenInSelf(url) {
  const domain = getDomainFromUrl(url);
  
  if (domain && domain in domainSettings) {
    return domainSettings[domain] === 'self';
  }
  
  return matchesDomain(url, selfTabDomains);
}

function shouldOpenInBlank(url) {
  const domain = getDomainFromUrl(url);
  
  if (domain && domain in domainSettings) {
    return domainSettings[domain] === 'blank';
  }
  
  return matchesDomain(url, newTabDomains);
}

const observer = new MutationObserver((mutations) => {
  processLinks();
});

const config = { 
  childList: true, 
  subtree: true 
};

function processLinks() {
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    const url = href.startsWith('/') ? window.location.origin + href : href;
    
    if (shouldOpenInSelf(url)) {
      link.setAttribute('target', '_self');
    } 
    else if (shouldOpenInBlank(url)) {
      link.setAttribute('target', '_blank');
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'z') {
    zKeyPressed = true;
    showToast();
  }
}, true);

document.addEventListener('keyup', (event) => {
  if (event.key.toLowerCase() === 'z') {
    zKeyPressed = false;
    hideToast();
  }
}, true);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    zKeyPressed = false;
    hideToast();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  createToast();
  loadSettings();
  
  observer.observe(document.body, config);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createToast();
    loadSettings();
    observer.observe(document.body, config);
  });
} else {
  createToast();
  loadSettings();
  observer.observe(document.body, config);
}

document.addEventListener('click', (event) => {
  const isForceSelfTabShortcut = zKeyPressed;
  
  let target = event.target;
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }
  
  if (target && target.tagName === 'A') {
    const href = target.getAttribute('href');
    if (!href) return;
    
    const url = href.startsWith('/') ? window.location.origin + href : href;
    
    if (isForceSelfTabShortcut && target.getAttribute('target') === '_blank') {
      event.preventDefault();
      window.location.href = href;
      return;
    }
    
    if (shouldOpenInSelf(url) && target.getAttribute('target') === '_blank') {
      event.preventDefault();
      window.location.href = href;
    }
    else if (shouldOpenInBlank(url) && target.getAttribute('target') !== '_blank') {
      target.setAttribute('target', '_blank');
    }
  }
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshSettings') {
    loadSettings();
    sendResponse({ success: true });
  }
  return true;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.selfTabDomains) {
      selfTabDomains = changes.selfTabDomains.newValue.split('\n').filter(domain => domain.trim() !== '');
    }
    if (changes.newTabDomains) {
      newTabDomains = changes.newTabDomains.newValue.split('\n').filter(domain => domain.trim() !== '');
    }
    if (changes.domainSettings) {
      domainSettings = changes.domainSettings.newValue || {};
    }
    processLinks();
  }
}); 
