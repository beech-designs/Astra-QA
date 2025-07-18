// background.js - Chrome Extension Background Script
// This script runs in the background and can make API calls that bypass client-side blocking

class AstraBackgroundService {
  constructor() {
    this.backendUrl = 'https://astra-qa.vercel.app';
    this.setupMessageListener();
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
        case 'designAnalysis':
          this.designAnalysis(request.data).then(sendResponse);
          break;
        default:
          sendResponse({ error: 'Unknown action: ' + request.action });
      }
      
      return true; // Keep message channel open for async response
    });
  }

  async healthCheck() {
    try {
      console.log('Background: Performing health check...');
      
      const response = await fetch(this.backendUrl + '/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Astra-Extension/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error('Health check failed: ' + response.status);
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

  async designAnalysis(data) {
    try {
      console.log('Background: Starting design analysis...');
      console.log('Background: Payload size:', Math.round(JSON.stringify(data).length / 1024) + 'KB');
      
      const response = await fetch(this.backendUrl + '/api/analyze-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Astra-Extension/1.0.0',
          'X-Extension-Request': 'true'
        },
        body: JSON.stringify(data)
      });

      console.log('Background: Design analysis response status:', response.status);

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
      console.log('Background: Design analysis successful');
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Background: Design analysis failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize the background service
const astraBackgroundService = new AstraBackgroundService();
console.log('Astra background service initialized');