// Astra Content Script - Main Extension Logic
// This script runs on all web pages and provides the core functionality

class AstraExtension {
  constructor() {
    this.overlay = null;
    this.isActive = false;
    this.screenshot = null;
    this.axeResults = null;
    this.domAnalysis = null;
    this.backendUrl = 'https://astra-qa.vercel.app';
    
    this.init();
  }

  init() {
    // Create overlay UI
    this.createOverlay();
    
    // Listen for keyboard shortcut (Alt+A)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.code === 'KeyA') {
        this.toggle();
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggle') {
        this.toggle();
      }
    });
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'astra-overlay';
    this.overlay.className = 'astra-hidden';
    
    this.overlay.innerHTML = `
      <div class="astra-panel">
        <div class="astra-header">
          <div class="astra-title">
            <span class="astra-icon">🔍</span>
            <span>Astra AI Design Validator</span>
          </div>
          <button class="astra-close" onclick="window.astraExtension.toggle()">×</button>
        </div>
        
        <div class="astra-tabs">
          <button class="astra-tab active" data-tab="design">Design QA</button>
          <button class="astra-tab" data-tab="accessibility">Accessibility</button>
          <button class="astra-tab" data-tab="analysis">AI Analysis</button>
        </div>
        
        <div class="astra-content">
          <!-- Design QA Tab -->
          <div class="astra-tab-content active" id="design-tab">
            <div class="astra-upload-section">
              <label for="design-upload" class="astra-upload-label">
                Upload Design Screenshot (PNG/JPG)
              </label>
              <input type="file" id="design-upload" accept="image/*" />
              <button class="astra-btn" onclick="window.astraExtension.analyzeDesign()">
                Analyze Design
              </button>
            </div>
            
            <div class="astra-overlay-controls" style="display: none;">
              <label>Overlay Opacity: 
                <input type="range" id="overlay-opacity" min="0" max="100" value="50" />
                <span id="opacity-value">50%</span>
              </label>
              <label>Horizontal Offset: 
                <input type="range" id="horizontal-offset" min="-100" max="100" value="0" />
              </label>
              <label>Vertical Offset: 
                <input type="range" id="vertical-offset" min="-100" max="100" value="0" />
              </label>
              <button class="astra-btn" onclick="window.astraExtension.toggleOverlayImage()">
                Toggle Overlay
              </button>
            </div>
            
            <div class="astra-results" id="design-results"></div>
          </div>
          
          <!-- Accessibility Tab -->
          <div class="astra-tab-content" id="accessibility-tab">
            <button class="astra-btn" onclick="window.astraExtension.runAccessibilityAudit()">
              Run Accessibility Audit
            </button>
            <div class="astra-results" id="accessibility-results"></div>
          </div>
          
          <!-- AI Analysis Tab -->
          <div class="astra-tab-content" id="analysis-tab">
            <button class="astra-btn" onclick="window.astraExtension.runAIAnalysis()">
              Generate AI Analysis
            </button>
            <div class="astra-results" id="analysis-results"></div>
          </div>
        </div>
      </div>
      
      <div class="astra-design-overlay" id="design-overlay-img" style="display: none;"></div>
    `;
    
    document.body.appendChild(this.overlay);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.overlay.querySelectorAll('.astra-tab');
    const tabContents = this.overlay.querySelectorAll('.astra-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
      });
    });

    // File upload handling
    document.getElementById('design-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleScreenshotUpload(file);
      }
    });

    // Overlay controls
    document.getElementById('overlay-opacity').addEventListener('input', (e) => {
      const opacity = e.target.value;
      document.getElementById('opacity-value').textContent = opacity + '%';
      this.updateOverlayOpacity(opacity);
    });

    document.getElementById('horizontal-offset').addEventListener('input', (e) => {
      this.updateOverlayPosition();
    });

    document.getElementById('vertical-offset').addEventListener('input', (e) => {
      this.updateOverlayPosition();
    });
  }

  toggle() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.overlay.classList.remove('astra-hidden');
    } else {
      this.overlay.classList.add('astra-hidden');
    }
  }

  handleScreenshotUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.screenshot = e.target.result;
      this.createOverlayImage();
      document.querySelector('.astra-overlay-controls').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  createOverlayImage() {
    const overlayImg = document.getElementById('design-overlay-img');
    overlayImg.style.backgroundImage = `url(${this.screenshot})`;
    overlayImg.style.backgroundSize = 'contain';
    overlayImg.style.backgroundRepeat = 'no-repeat';
    overlayImg.style.backgroundPosition = 'top left';
  }

  updateOverlayOpacity(opacity) {
    const overlayImg = document.getElementById('design-overlay-img');
    overlayImg.style.opacity = opacity / 100;
  }

  updateOverlayPosition() {
    const horizontalOffset = document.getElementById('horizontal-offset').value;
    const verticalOffset = document.getElementById('vertical-offset').value;
    const overlayImg = document.getElementById('design-overlay-img');
    
    overlayImg.style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;
  }

  toggleOverlayImage() {
    const overlayImg = document.getElementById('design-overlay-img');
    overlayImg.style.display = overlayImg.style.display === 'none' ? 'block' : 'none';
  }

  // DOM Style Extraction
  extractDOMStyles() {
    const elements = document.querySelectorAll('*');
    const styleData = [];

    elements.forEach(element => {
      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Only extract styles for visible elements
      if (rect.width > 0 && rect.height > 0) {
        styleData.push({
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          typography: {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontFamily: computed.fontFamily,
            lineHeight: computed.lineHeight,
            color: computed.color
          },
          spacing: {
            margin: computed.margin,
            padding: computed.padding,
            gap: computed.gap
          },
          layout: {
            display: computed.display,
            position: computed.position,
            flexDirection: computed.flexDirection,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems
          },
          visuals: {
            backgroundColor: computed.backgroundColor,
            border: computed.border,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow
          }
        });
      }
    });

    return styleData;
  }

  // Accessibility Audit
  async runAccessibilityAudit() {
    const resultsDiv = document.getElementById('accessibility-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Running accessibility audit...</div>';

    try {
      if (typeof axe === 'undefined') {
        throw new Error('axe-core not loaded');
      }

      const results = await axe.run();
      this.axeResults = results;
      this.displayAccessibilityResults(results);
    } catch (error) {
      resultsDiv.innerHTML = `<div class="astra-error">Error running accessibility audit: ${error.message}</div>`;
    }
  }

  displayAccessibilityResults(results) {
    const resultsDiv = document.getElementById('accessibility-results');
    
    const violationsHtml = results.violations.map(violation => `
      <div class="astra-violation">
        <h4>${violation.description}</h4>
        <p><strong>Impact:</strong> ${violation.impact}</p>
        <p><strong>Help:</strong> ${violation.help}</p>
        <p><strong>Affected Elements:</strong> ${violation.nodes.length}</p>
        <details>
          <summary>More Info</summary>
          <a href="${violation.helpUrl}" target="_blank">Learn more</a>
        </details>
      </div>
    `).join('');

    resultsDiv.innerHTML = `
      <div class="astra-audit-summary">
        <h3>Accessibility Audit Results</h3>
        <div class="astra-stats">
          <span class="astra-stat">✅ ${results.passes.length} Passed</span>
          <span class="astra-stat">❌ ${results.violations.length} Violations</span>
          <span class="astra-stat">⚠️ ${results.incomplete.length} Incomplete</span>
        </div>
      </div>
      <div class="astra-violations">
        <h4>Violations Found:</h4>
        ${violationsHtml || '<p>No violations found!</p>'}
      </div>
    `;
  }

  // Design Analysis
  async analyzeDesign() {
    const resultsDiv = document.getElementById('design-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Analyzing design...</div>';

    try {
      // Extract DOM styles
      this.domAnalysis = this.extractDOMStyles();
      
      // Take screenshot of current page
      const pageScreenshot = await this.capturePageScreenshot();
      
      const analysisData = {
        domStyles: this.domAnalysis,
        designScreenshot: this.screenshot,
        pageScreenshot: pageScreenshot,
        url: window.location.href
      };

      // Send to backend for Claude analysis
      const response = await fetch(`${this.backendUrl}/api/analyze-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });

      const result = await response.json();
      this.displayDesignResults(result);
    } catch (error) {
      resultsDiv.innerHTML = `<div class="astra-error">Error analyzing design: ${error.message}</div>`;
    }
  }

  async capturePageScreenshot() {
    // TODO: Implement html2canvas or similar for page screenshot
    // For now, return a placeholder
    return 'data:image/png;base64,placeholder';
  }

  displayDesignResults(result) {
    const resultsDiv = document.getElementById('design-results');
    
    resultsDiv.innerHTML = `
      <div class="astra-analysis-result">
        <h3>Design Analysis Results</h3>
        <div class="astra-analysis-content">
          ${result.analysis || 'Analysis completed successfully'}
        </div>
      </div>
    `;
  }

  // AI Analysis
  async runAIAnalysis() {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Generating AI analysis...</div>';

    try {
      const analysisData = {
        domStyles: this.domAnalysis || this.extractDOMStyles(),
        accessibilityResults: this.axeResults,
        url: window.location.href,
        screenshot: this.screenshot
      };

      const response = await fetch(`${this.backendUrl}/api/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });

      const result = await response.json();
      this.displayAIResults(result);
    } catch (error) {
      resultsDiv.innerHTML = `<div class="astra-error">Error generating AI analysis: ${error.message}</div>`;
    }
  }

  displayAIResults(result) {
    const resultsDiv = document.getElementById('analysis-results');
    
    resultsDiv.innerHTML = `
      <div class="astra-ai-analysis">
        <h3>AI-Powered Analysis</h3>
        <div class="astra-analysis-content">
          ${result.analysis || 'AI analysis completed successfully'}
        </div>
      </div>
    `;
  }
}

// Initialize the extension
window.astraExtension = new AstraExtension();