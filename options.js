document.addEventListener('DOMContentLoaded', () => {
  const selfTabDomainsInput = document.getElementById('selfTabDomains');
  const newTabDomainsInput = document.getElementById('newTabDomains');
  const saveButton = document.getElementById('save');
  const saveMessage = document.getElementById('saveMessage');
  
  chrome.storage.sync.get({
    selfTabDomains: '',  
    newTabDomains: ''
  }, (items) => {
    selfTabDomainsInput.value = items.selfTabDomains;
    newTabDomainsInput.value = items.newTabDomains;
  });
  
  const standardizeLinks = (linksText) => {
    if (!linksText.trim()) return '';
    
    const links = linksText.split('\n');
    
    const standardizedLinks = links
      .map(link => {
        link = link.trim();
        if (!link) return null;
        
        try {
          let url;
          if (link.startsWith('http://') || link.startsWith('https://')) {
            url = new URL(link);
          } else {
            url = new URL('http://' + link);
          }
          
          return url.hostname;
        } catch (e) {
          link = link.replace(/^(https?:\/\/)?(www\.)?/i, '');
          link = link.split('/')[0].split('?')[0].split('#')[0];
          
          return link || null;
        }
      })
      .filter(Boolean) 
      .filter((link, index, self) => self.indexOf(link) === index); 
    
    return standardizedLinks.join('\n');
  };
  
  saveButton.addEventListener('click', () => {
    const selfTabDomains = standardizeLinks(selfTabDomainsInput.value);
    const newTabDomains = standardizeLinks(newTabDomainsInput.value);
    
    selfTabDomainsInput.value = selfTabDomains;
    newTabDomainsInput.value = newTabDomains;
    
    chrome.storage.sync.set({
      selfTabDomains: selfTabDomains,
      newTabDomains: newTabDomains
    }, () => {
      saveMessage.style.display = 'block';
      
      setTimeout(() => {
        saveMessage.style.display = 'none';
      }, 3000);
    });
  });
}); 