// background.js - Chrome Extension Background Script
// Handles both API communication and extension icon/keyboard interactions

class AstraBackgroundService {
  constructor() {
    this.backendUrl = 'https://astra-qa.vercel.app'; // Update with your actual backend URL
    this.setupMessageListener();
    this.setupIconClickHandler();
    this.setupKeyboardShortcuts();
    this.setupInstallationHandler();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Background: Received message:', request);
      
      // Handle different API calls
      switch (request.action) {
        case 'healthCheck':
          this.healthCheck().then(sendResponse);
          break;
        case 'aiAnalysis':
          this.aiAnalysis(request.data).then(sendResponse);
          break;
        default:
          sendResponse({ error: 'Unknown action: ' + request.action });
      }
      
      return true; // Keep message channel open for async response
    });
  }

  setupIconClickHandler() {
    // Handle extension icon clicks - directly toggle overlay
    chrome.action.onClicked.addListener(async (tab) => {
      await this.toggleOverlay(tab);
    });
  }

  setupKeyboardShortcuts() {
    // Handle keyboard shortcut (Alt+A)
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === 'toggle-overlay') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await this.toggleOverlay(tab);
      }
    });
  }

  setupInstallationHandler() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '🔍 Astra Installed!',
          message: 'Click the extension icon or press Alt+A to analyze any webpage.',
          silent: true
        });
      }
    });
  }

  async toggleOverlay(tab) {
    // Check if the tab URL is restricted
    if (this.isRestrictedUrl(tab.url)) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Astra - Cannot Run Here',
        message: 'Astra cannot run on this page. Please try on a regular website.',
        silent: true
      });
      return;
    }

    try {
      // Try to send message to existing content script
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
    } catch (error) {
      // Content script not loaded, inject it
      try {
        console.log('Background: Injecting content scripts...');
        
        // Inject JavaScript files
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['axe.min.js', 'content.js']
        });
        
        // Inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['overlay.css']
        });
        
        // Wait for script initialization then toggle
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
          } catch (e) {
            console.error('Background: Failed to toggle after injection:', e);
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Astra - Error',
              message: 'Failed to initialize Astra. Please refresh and try again.',
              silent: true
            });
          }
        }, 100);
        
      } catch (injectionError) {
        console.error('Background: Failed to inject content script:', injectionError);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Astra - Injection Error',
          message: 'Failed to load Astra. Please refresh the page and try again.',
          silent: true
        });
      }
    }
  }

  isRestrictedUrl(url) {
    const restrictedProtocols = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:', 'data:', 'file://'];
    const restrictedDomains = ['chrome.google.com', 'addons.mozilla.org', 'microsoftedge.microsoft.com'];
    
    // Check protocols
    for (const protocol of restrictedProtocols) {
      if (url.startsWith(protocol)) {
        return true;
      }
    }
    
    // Check domains
    try {
      const domain = new URL(url).hostname;
      return restrictedDomains.some(restricted => domain.includes(restricted));
    } catch (e) {
      return true; // If URL is malformed, consider it restricted
    }
  }

  async healthCheck() {
    try {
      console.log('Background: Performing health check...');
      
      const response = await fetch(this.backendUrl + '/api/health', {
        method: 'GET',
        headers: {
          'User-Agent': 'Astra-Extension/1.0.0',
          'X-Extension-Request': 'true'
        }
      });

      console.log('Background: Health check response status:', response.status);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const result = await response.json();
      console.log('Background: Health check successful:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Background: Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  async aiAnalysis(data) {
    try {
      console.log('Background: Starting AI analysis...');
      console.log('Background: Payload size:', Math.round(JSON.stringify(data).length / 1024) + 'KB');
      
      const response = await fetch(this.backendUrl + '/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Astra-Extension/1.0.0',
          'X-Extension-Request': 'true'
        },
        body: JSON.stringify(data)
      });

      console.log('Background: AI analysis response status:', response.status);

      if (!response.ok) {
        let errorDetails = 'Unknown error';
        try {
          const errorBody = await response.json();
          errorDetails = errorBody.error || errorBody.message || errorBody.details || 'Server error';
        } catch (e) {
          errorDetails = await response.text();
        }
        throw new Error('HTTP ' + response.status + ': ' + errorDetails);
      }

      const result = await response.json();
      console.log('Background: AI analysis successful');
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Background: AI analysis failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize the background service
const astraBackgroundService = new AstraBackgroundService();
console.log('Astra background service initialized');