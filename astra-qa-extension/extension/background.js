// This file contains the background script for the extension, which runs in the background and manages events such as browser actions and messages from content scripts.

class AstraQABackground {
  constructor() {
    this.analysisResults = new Map();
    this.aiEnabled = true;
    this.backendUrl = '';
    this.setupEventListeners();
    this.loadSettings();
    console.log('Astra QA Background Service initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'aiEnabled', 
        'backendUrl', 
        'vercelDeploymentUrl'
      ]);
      
      this.aiEnabled = result.aiEnabled !== false;
      
      // Priority: user-configured URL > Vercel deployment URL > localhost fallback
      this.backendUrl = result.backendUrl || 
                       result.vercelDeploymentUrl || 
                       'https://astra-qa.vercel.app';
      
      console.log('Astra QA Backend URL configured:', this.backendUrl);
    } catch (error) {
      console.error('Failed to load Astra QA settings:', error);
      this.backendUrl = 'https://astra-qa.vercel.app';
    }
  }

  setupEventListeners() {
    chrome.action.onClicked.addListener((tab) => {
      chrome.sidePanel.open({ tabId: tab.id });
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.analysisResults.delete(tabId);
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'START_ANALYSIS':
          await this.startAnalysis(sender.tab.id, message.options || {});
          sendResponse({ success: true });
          break;

        case 'ANALYSIS_COMPLETE':
          await this.processAnalysisResults(sender.tab.id, message.data);
          sendResponse({ success: true });
          break;

        case 'GET_ANALYSIS_RESULTS':
          const results = this.analysisResults.get(message.tabId) || null;
          sendResponse({ results });
          break;

        case 'HIGHLIGHT_ISSUE':
          await this.highlightIssueOnPage(sender.tab?.id || message.tabId, message.issueId);
          sendResponse({ success: true });
          break;

        case 'GET_AI_SETTINGS':
          sendResponse({
            aiEnabled: this.aiEnabled,
            backendUrl: this.backendUrl,
            isVercelDeployment: this.backendUrl.includes('vercel.app')
          });
          break;

        case 'UPDATE_AI_SETTINGS':
          await this.updateAISettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'TEST_BACKEND_CONNECTION':
          const connectionResult = await this.testBackendConnection(message.url);
          sendResponse(connectionResult);
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Astra QA Background script error:', error);
      sendResponse({ error: error.message });
    }
  }

  async startAnalysis(tabId, options = {}) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (options) => {
          if (window.astraQA) {
            window.astraQA.startAnalysis(options);
          }
        },
        args: [options]
      });
    } catch (error) {
      console.error('Failed to start Astra QA analysis:', error);
    }
  }

  async processAnalysisResults(tabId, basicResults) {
    this.analysisResults.set(tabId, {
      ...basicResults,
      aiAnalysis: null,
      aiStatus: 'pending'
    });

    this.notifySidePanel(tabId, 'ANALYSIS_RESULTS', {
      ...basicResults,
      aiAnalysis: null,
      aiStatus: 'pending'
    });

    if (this.aiEnabled) {
      try {
        console.log('Astra QA enhancing analysis with AI...');
        const aiAnalysis = await this.getAstraQAAIAnalysis(basicResults);
        
        const enhancedResults = {
          ...basicResults,
          aiAnalysis,
          aiStatus: 'complete'
        };
        
        this.analysisResults.set(tabId, enhancedResults);
        this.notifySidePanel(tabId, 'AI_ANALYSIS_COMPLETE', enhancedResults);
        
      } catch (error) {
        console.error('Astra QA AI analysis failed:', error);
        
        const resultsWithError = {
          ...basicResults,
          aiAnalysis: null,
          aiStatus: 'error',
          aiError: error.message
        };
        
        this.analysisResults.set(tabId, resultsWithError);
        this.notifySidePanel(tabId, 'AI_ANALYSIS_ERROR', resultsWithError);
      }
    }
  }

  async getAstraQAAIAnalysis(basicResults) {
    const analysisPayload = {
      screenshot: basicResults.screenshot,
      pageContext: {
        url: basicResults.pageContext?.url || 'unknown',
        title: basicResults.pageContext?.title || 'Unknown Page',
        viewport: basicResults.pageContext?.viewport
      },
      designSystem: await this.getDesignSystemConfig(),
      detectedIssues: basicResults.issues || [],
      userPreferences: await this.getUserPreferences()
    };

    console.log('Sending analysis to Astra QA backend:', this.backendUrl);

    const response = await fetch(`${this.backendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisPayload)
    });

    if (!response.ok) {
      let errorMessage = 'Astra QA backend analysis failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.analysis;
  }

  async testBackendConnection(url = null) {
    const testUrl = url || this.backendUrl;
    
    try {
      console.log('Testing Astra QA connection to:', testUrl);
      
      const response = await fetch(`${testUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to Astra QA backend');
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Astra QA connection test error:', error);
      return { success: false, error: error.message };
    }
  }

  notifySidePanel(tabId, event, data) {
    chrome.tabs.sendMessage(tabId, { event, data });
  }

  async updateAISettings(settings) {
    try {
      const { aiEnabled, backendUrl } = settings;
      
      if (aiEnabled !== undefined) {
        this.aiEnabled = aiEnabled;
      }
      
      if (backendUrl) {
        this.backendUrl = backendUrl;
      }
      
      await chrome.storage.sync.set({
        aiEnabled: this.aiEnabled,
        backendUrl: this.backendUrl
      });
      
      console.log('Astra QA settings updated:', {
        aiEnabled: this.aiEnabled,
        backendUrl: this.backendUrl
      });
    } catch (error) {
      console.error('Failed to update Astra QA settings:', error);
    }
  }

  async getDesignSystemConfig() {
    // Placeholder for fetching design system configuration
    return {};
  }

  async getUserPreferences() {
    // Placeholder for fetching user preferences
    return {};
  }
}

// Instantiate the background service class
new AstraQABackground();

// Additional event listeners can be added here as needed.