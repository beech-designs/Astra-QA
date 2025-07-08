document.getElementById('toggle-overlay').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tab = tabs[0];
        
        // Check if tab URL is restricted
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            alert('Astra cannot run on this page. Please try on a regular website.');
            return;
        }
        
        // Send message with error handling
        chrome.tabs.sendMessage(tab.id, {action: 'toggle'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Content script not ready, injecting...');
                // Try to inject the content script if it's not loaded
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['axe.min.js', 'content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        alert('Failed to load Astra. Please refresh the page and try again.');
                    } else {
                        // Wait a moment for script to initialize, then try again
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, {action: 'toggle'});
                        }, 100);
                    }
                });
            }
        });
        
        window.close();
    });
});