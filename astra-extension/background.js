// background.js - Service Worker for Chrome Extension
// Handles screenshot capture fallback and keyboard shortcuts

console.log('Astra background service worker loaded');

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      switch (command) {
        case 'toggle-astra':
          chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle-astra'});
          break;
        case 'capture-screenshot':
          chrome.tabs.sendMessage(tabs[0].id, {action: 'capture-screenshot'});
          break;
      }
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'captureTab') {
    handleScreenshotCapture(sender.tab.id)
      .then(screenshot => {
        sendResponse({success: true, screenshot: screenshot});
      })
      .catch(error => {
        console.error('Screenshot capture failed:', error);
        sendResponse({success: false, error: error.message});
      });
    
    // Return true to indicate async response
    return true;
  }
});

// Capture screenshot using Chrome tabs API
async function handleScreenshotCapture(tabId) {
  try {
    console.log('Capturing screenshot for tab:', tabId);
    
    // Ensure the tab is active for screenshot
    await chrome.tabs.update(tabId, {active: true});
    
    // Small delay to ensure tab is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capture the tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 80
    });
    
    console.log('Screenshot captured successfully via Chrome API');
    return dataUrl;
    
  } catch (error) {
    console.error('Chrome tabs screenshot failed:', error);
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Astra extension installed:', details);
  
  if (details.reason === 'install') {
    // Open welcome page or show notification
    chrome.tabs.create({
      url: 'https://astra-qa.vercel.app'
    });
  }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip chrome:// pages and other restricted URLs
    if (!tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') && 
        !tab.url.startsWith('moz-extension://')) {
      
      // Ensure content script is injected
      chrome.scripting.executeScript({
        target: {tabId: tabId},
        files: ['content.js']
      }).catch(err => {
        console.log('Content script already injected or injection failed:', err.message);
      });
    }
  }
});

// Cleanup on extension suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('Astra background service worker suspended');
});

// Handle extension errors
chrome.runtime.onStartup.addListener(() => {
  console.log('Astra extension started');
});