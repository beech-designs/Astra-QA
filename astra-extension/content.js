// content.js

class AstraAnalyzer {
  constructor() {
    this.backendUrl = 'https://astra-qa.vercel.app'; 
    this.domAnalysis = null;
    this.axeResults = null;
    this.screenshot = null;
    this.isCapturingScreenshot = false;
    
    this.initialize();
  }

  async initialize() {
    // html2canvas is loaded via manifest.json content_scripts
    this.createOverlay();
    this.setupEventListeners();
  }

  // html2canvas is loaded via manifest.json, just check availability
  async loadHTML2Canvas() {
    try {
      if (typeof html2canvas !== 'undefined') {
        console.log('html2canvas loaded successfully from local file');
        return true;
      } else {
        console.warn('html2canvas not available - may not be loaded correctly');
        return false;
      }
    } catch (error) {
      console.warn('html2canvas check error:', error);
      return false;
    }
  }

  // Capture screenshot of current page
  async captureScreenshot() {
    if (this.isCapturingScreenshot) {
      console.log('Screenshot capture already in progress');
      return this.screenshot;
    }

    this.isCapturingScreenshot = true;
    
    try {
      console.log('Starting screenshot capture...');
      
      // Hide the Astra overlay temporarily for clean screenshot
      const overlay = document.getElementById('astra-overlay');
      const wasVisible = overlay && overlay.style.display !== 'none';
      if (overlay && wasVisible) {
        overlay.style.display = 'none';
      }

      let screenshot = null;

      // Try html2canvas first (loaded via manifest.json)
      try {
        screenshot = await this.captureWithHTML2Canvas();
      } catch (error) {
        console.log('html2canvas failed, trying Chrome extension API...');
        
        // Fallback to Chrome extension API if available
        try {
          screenshot = await this.captureWithExtensionAPI();
        } catch (fallbackError) {
          console.log('Chrome extension API also failed');
        }
      }

      // Restore overlay visibility
      if (overlay && wasVisible) {
        overlay.style.display = 'block';
      }

      if (screenshot) {
        this.screenshot = screenshot;
        console.log('Screenshot captured successfully');
        return screenshot;
      } else {
        throw new Error('All screenshot methods failed');
      }

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      // Return null so AI analysis can continue without screenshot
      return null;
    } finally {
      this.isCapturingScreenshot = false;
    }
  }

  // Primary screenshot method using html2canvas (loaded via manifest.json)
  async captureWithHTML2Canvas() {
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas not loaded - check manifest.json configuration');
    }

    try {
      console.log('Capturing with html2canvas...');
      
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 0.6, // Reduce scale for smaller file size
        logging: false,
        ignoreElements: (element) => {
          // Skip Astra overlay and any elements with astra- class
          return element.id === 'astra-overlay' || 
                 (element.className && element.className.includes('astra-'));
        }
      });

      // Convert to base64 with compression
      const dataURL = canvas.toDataURL('image/jpeg', 0.7); // 70% quality for smaller size
      
      console.log(`Screenshot captured: ${Math.round(dataURL.length / 1024)}KB`);
      return dataURL;

    } catch (error) {
      console.error('html2canvas capture failed:', error);
      throw error; // Re-throw to trigger fallback methods
    }
  }

  // Fallback screenshot method using Chrome extension API
  async captureWithExtensionAPI() {
    try {
      console.log('Attempting Chrome extension screenshot...');
      
      // This requires additional permissions in manifest.json
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Chrome extension context not available');
      }

      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'captureTab'
        }, (response) => {
          if (response && response.screenshot) {
            console.log('Chrome extension screenshot successful');
            resolve(response.screenshot);
          } else {
            console.log('Chrome extension screenshot failed');
            resolve(null);
          }
        });
      });

    } catch (error) {
      console.error('Extension API capture failed:', error);
      return null;
    }
  }

  // Enhanced AI Analysis with screenshot integration
  async runAIAnalysis() {
    const resultsDiv = document.getElementById('analysis-results');
    const loadingStates = [
      'Extracting DOM styles...',
      'Capturing page screenshot...',
      'Analyzing accessibility...',
      'Sending to AI for analysis...',
      'Generating insights...'
    ];
    
    let currentState = 0;
    
    // Show loading with progress
    const updateLoading = (message) => {
      resultsDiv.innerHTML = `
        <div class="astra-loading">
          <div class="astra-loading-spinner"></div>
          <div class="astra-loading-text">${message}</div>
          <div class="astra-loading-progress">
            <div class="astra-progress-bar" style="width: ${((currentState + 1) / loadingStates.length) * 100}%"></div>
          </div>
        </div>
      `;
      currentState++;
    };

    try {
      // Step 1: Extract DOM styles (existing functionality)
      updateLoading(loadingStates[0]);
      if (!this.domAnalysis) {
        this.domAnalysis = this.extractDOMStyles();
      }

      // Step 2: Capture screenshot (NEW)
      updateLoading(loadingStates[1]);
      await this.captureScreenshot();

      // Step 3: Run accessibility audit (existing functionality)  
      updateLoading(loadingStates[2]);
      if (!this.axeResults) {
        await this.runAxeAudit();
      }

      // Step 4: Prepare and send data
      updateLoading(loadingStates[3]);
      const analysisData = {
        domStyles: this.domAnalysis || [],
        accessibilityResults: this.axeResults || {},
        url: window.location.href,
        screenshot: this.screenshot, // Include screenshot in existing API call
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      // Check payload size and optimize if needed
      const payloadSize = JSON.stringify(analysisData).length;
      console.log(`Analysis payload size: ${Math.round(payloadSize / 1024)}KB`);
      
      if (payloadSize > 1000000) { // 1MB limit
        console.log('Optimizing payload size...');
        
        // Reduce DOM styles if too large
        if (analysisData.domStyles.length > 200) {
          analysisData.domStyles = analysisData.domStyles.slice(0, 200);
        }
        
        // Compress screenshot if too large
        if (this.screenshot && this.screenshot.length > 500000) {
          analysisData.screenshot = await this.compressScreenshot(this.screenshot);
        }
      }

      // Step 5: Send to backend API
      updateLoading(loadingStates[4]);
      const response = await fetch(this.backendUrl + '/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.displayAIResults(result);

    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      // Show error with option to try without screenshot
      resultsDiv.innerHTML = `
        <div class="astra-error">
          <h4>Analysis Error</h4>
          <p>Error: ${error.message}</p>
          <div class="astra-error-actions">
            <button onclick="astraAnalyzer.runAIAnalysisWithoutScreenshot()" class="astra-button-secondary">
              Try Without Screenshot
            </button>
            <button onclick="astraAnalyzer.runAIAnalysis()" class="astra-button-primary">
              Retry Analysis
            </button>
          </div>
        </div>
      `;
    }
  }

  // Fallback method to run analysis without screenshot
  async runAIAnalysisWithoutScreenshot() {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Running analysis without screenshot...</div>';

    try {
      const analysisData = {
        domStyles: this.domAnalysis || this.extractDOMStyles(),
        accessibilityResults: this.axeResults,
        url: window.location.href,
        screenshot: null, // Explicitly null
        note: 'Analysis completed without screenshot due to capture failure'
      };

      const response = await fetch(this.backendUrl + '/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.displayAIResults(result);

    } catch (error) {
      console.error('Fallback analysis failed:', error);
      resultsDiv.innerHTML = `<div class="astra-error">Analysis failed: ${error.message}</div>`;
    }
  }

  // Compress screenshot if it's too large
  async compressScreenshot(screenshot) {
    try {
      const img = new Image();
      img.src = screenshot;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Reduce dimensions
      canvas.width = img.width * 0.7;
      canvas.height = img.height * 0.7;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Return with lower quality
      return canvas.toDataURL('image/jpeg', 0.5);
    } catch (error) {
      console.error('Screenshot compression failed:', error);
      return screenshot; // Return original if compression fails
    }
  }

  // Enhanced display of AI results with screenshot info
  displayAIResults(result) {
    const resultsDiv = document.getElementById('analysis-results');
    const hasScreenshot = this.screenshot ? '📸 Visual Analysis' : '📝 Text Analysis Only';
    
    resultsDiv.innerHTML = `
      <div class="astra-ai-analysis">
        <div class="astra-analysis-header">
          <h3>🤖 AI-Powered Analysis</h3>
          <div class="astra-analysis-meta">
            <span class="astra-meta-item">${hasScreenshot}</span>
            <span class="astra-meta-item">🕐 ${new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="astra-analysis-content">
          ${result.analysis || 'Analysis completed successfully'}
        </div>
        ${this.screenshot ? this.createScreenshotPreview() : ''}
      </div>
    `;
  }

  // Create screenshot preview section
  createScreenshotPreview() {
    return `
      <div class="astra-screenshot-section">
        <h4>📷 Captured Screenshot</h4>
        <div class="astra-screenshot-preview">
          <img src="${this.screenshot}" alt="Page Screenshot" style="max-width: 100%; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </div>
        <div class="astra-screenshot-actions">
          <button onclick="astraAnalyzer.downloadScreenshot()" class="astra-button-secondary">
            Download Screenshot
          </button>
        </div>
      </div>
    `;
  }

  // Download screenshot functionality
  downloadScreenshot() {
    if (!this.screenshot) {
      alert('No screenshot available to download');
      return;
    }

    const link = document.createElement('a');
    link.download = `astra-screenshot-${Date.now()}.jpg`;
    link.href = this.screenshot;
    link.click();
  }

  // ... rest of your existing methods (extractDOMStyles, runAxeAudit, etc.) remain unchanged
  
}