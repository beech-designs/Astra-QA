// Astra Content Script - Main Extension Logic
// This script runs on all web pages and provides the core functionality

class AstraExtension {
  constructor() {
    this.overlay = null;
    this.isActive = false;
    this.isReady = false;
    this.screenshot = null;
    this.axeResults = null;
    this.domAnalysis = null;
    this.backendUrl = 'https://astra-qa.vercel.app';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
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
        sendResponse({success: true});
      }
      return true;
    });
    
    this.isReady = true;
    console.log('Astra extension initialized and ready');
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'astra-overlay';
    this.overlay.className = 'astra-hidden';
    
    // Create the overlay structure using DOM methods instead of template literals
    const panel = document.createElement('div');
    panel.className = 'astra-panel';
    
    // Header
    const header = document.createElement('div');
    header.className = 'astra-header';
    header.innerHTML = '<div class="astra-title"><span class="astra-icon">🔍</span><span>Astra AI Design Validator</span></div>';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'astra-close';
    closeBtn.id = 'astra-close-btn';
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);
    
    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'astra-tabs';
    tabs.innerHTML = `
      <button class="astra-tab active" data-tab="design">Design QA</button>
      <button class="astra-tab" data-tab="accessibility">Accessibility</button>
      <button class="astra-tab" data-tab="analysis">AI Analysis</button>
    `;
    
    // Content area
    const content = document.createElement('div');
    content.className = 'astra-content';
    
    // Design tab
    const designTab = document.createElement('div');
    designTab.className = 'astra-tab-content active';
    designTab.id = 'design-tab';
    designTab.innerHTML = `
      <div class="astra-upload-section">
        <label for="design-upload" class="astra-upload-label">Upload Design Screenshot (PNG/JPG)</label>
        <input type="file" id="design-upload" accept="image/*" />
        <button class="astra-btn" id="analyze-design-btn">Analyze Design</button>
      </div>
      <div class="astra-overlay-controls" style="display: none;">
        <label>Overlay Opacity: <input type="range" id="overlay-opacity" min="0" max="100" value="50" /><span id="opacity-value">50%</span></label>
        <label>Horizontal Offset: <input type="range" id="horizontal-offset" min="-100" max="100" value="0" /></label>
        <label>Vertical Offset: <input type="range" id="vertical-offset" min="-100" max="100" value="0" /></label>
        <button class="astra-btn" id="toggle-overlay-btn">Toggle Overlay</button>
      </div>
      <div class="astra-results" id="design-results"></div>
    `;
    
    // Accessibility tab
    const accessibilityTab = document.createElement('div');
    accessibilityTab.className = 'astra-tab-content';
    accessibilityTab.id = 'accessibility-tab';
    accessibilityTab.innerHTML = `
      <button class="astra-btn" id="run-accessibility-btn">Run Accessibility Audit</button>
      <div class="astra-results" id="accessibility-results"></div>
    `;
    
    // AI Analysis tab
    const analysisTab = document.createElement('div');
    analysisTab.className = 'astra-tab-content';
    analysisTab.id = 'analysis-tab';
    analysisTab.innerHTML = `
      <button class="astra-btn" id="run-ai-analysis-btn">Generate AI Analysis</button>
      <div class="astra-results" id="analysis-results"></div>
    `;
    
    content.appendChild(designTab);
    content.appendChild(accessibilityTab);
    content.appendChild(analysisTab);
    
    panel.appendChild(header);
    panel.appendChild(tabs);
    panel.appendChild(content);
    
    // Design overlay image
    const designOverlay = document.createElement('div');
    designOverlay.className = 'astra-design-overlay';
    designOverlay.id = 'design-overlay-img';
    designOverlay.style.display = 'none';
    
    this.overlay.appendChild(panel);
    this.overlay.appendChild(designOverlay);
    
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
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
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

    document.getElementById('horizontal-offset').addEventListener('input', () => {
      this.updateOverlayPosition();
    });

    document.getElementById('vertical-offset').addEventListener('input', () => {
      this.updateOverlayPosition();
    });

    // Button event listeners
    document.getElementById('astra-close-btn').addEventListener('click', () => {
      this.toggle();
    });

    document.getElementById('analyze-design-btn').addEventListener('click', () => {
      this.analyzeDesign();
    });

    document.getElementById('toggle-overlay-btn').addEventListener('click', () => {
      this.toggleOverlayImage();
    });

    document.getElementById('run-accessibility-btn').addEventListener('click', () => {
      this.runAccessibilityAudit();
    });

    document.getElementById('run-ai-analysis-btn').addEventListener('click', () => {
      this.runAIAnalysis();
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
    overlayImg.style.backgroundImage = 'url(' + this.screenshot + ')';
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
    
    overlayImg.style.transform = 'translate(' + horizontalOffset + 'px, ' + verticalOffset + 'px)';
  }

  toggleOverlayImage() {
    const overlayImg = document.getElementById('design-overlay-img');
    overlayImg.style.display = overlayImg.style.display === 'none' ? 'block' : 'none';
  }

  // DOM Style Extraction (Optimized for Payload Size)
  extractDOMStyles() {
    const elements = document.querySelectorAll('*');
    const styleData = [];
    const MAX_ELEMENTS = 200;

    const prioritySelectors = [
      'h1, h2, h3, h4, h5, h6',
      'p, span, div',
      'button, a, input',
      'header, nav, main, section, footer',
      '[class*="btn"], [class*="button"]',
      '[class*="card"], [class*="modal"]',
      '[id], [class]'
    ];

    const priorityElements = new Set();
    prioritySelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (priorityElements.size < MAX_ELEMENTS) {
            priorityElements.add(el);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    const elementsToProcess = Array.from(priorityElements);
    
    elements.forEach(element => {
      if (elementsToProcess.length >= MAX_ELEMENTS) return;
      
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && !priorityElements.has(element)) {
        elementsToProcess.push(element);
      }
    });

    elementsToProcess.slice(0, MAX_ELEMENTS).forEach(element => {
      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      styleData.push({
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className ? element.className.substring(0, 100) : null,
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        typography: {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily.substring(0, 50),
          lineHeight: computed.lineHeight,
          color: computed.color
        },
        spacing: {
          margin: computed.margin,
          padding: computed.padding
        },
        layout: {
          display: computed.display,
          position: computed.position
        },
        visuals: {
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius
        }
      });
    });

    console.log('Extracted styles for ' + styleData.length + ' elements (limited for API)');
    return styleData;
  }

  // Accessibility Audit with Simplified Code Snippets
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
      resultsDiv.innerHTML = '<div class="astra-error">Error running accessibility audit: ' + error.message + '</div>';
    }
  }

  displayAccessibilityResults(results) {
    const resultsDiv = document.getElementById('accessibility-results');
    resultsDiv.innerHTML = '';

    // Create summary
    const summary = document.createElement('div');
    summary.className = 'astra-audit-summary';
    summary.innerHTML = `
      <h3>Accessibility Audit Results</h3>
      <div class="astra-stats">
        <span class="astra-stat astra-stat-pass">✅ ${results.passes.length} Passed</span>
        <span class="astra-stat astra-stat-violations">❌ ${results.violations.length} Violations</span>
        <span class="astra-stat astra-stat-incomplete">⚠️ ${results.incomplete.length} Incomplete</span>
      </div>
    `;

    const exportBtn = document.createElement('button');
    exportBtn.className = 'astra-btn astra-export-btn';
    exportBtn.textContent = '📥 Export Full Report';
    exportBtn.addEventListener('click', () => this.exportAccessibilityReport());
    summary.appendChild(exportBtn);

    resultsDiv.appendChild(summary);

    // Create violations section
    const violationsSection = document.createElement('div');
    violationsSection.className = 'astra-violations';
    
    const violationsHeader = document.createElement('h4');
    violationsHeader.textContent = 'Violations Found:';
    violationsSection.appendChild(violationsHeader);

    if (results.violations.length === 0) {
      const noViolations = document.createElement('p');
      noViolations.className = 'astra-no-violations';
      noViolations.textContent = '🎉 No violations found! Your site is accessible.';
      violationsSection.appendChild(noViolations);
    } else {
      // Process each violation
      results.violations.forEach((violation, violationIndex) => {
        const violationDiv = this.createViolationElement(violation, violationIndex);
        violationsSection.appendChild(violationDiv);
      });
    }

    resultsDiv.appendChild(violationsSection);
  }

  createViolationElement(violation, violationIndex) {
    const violationDiv = document.createElement('div');
    violationDiv.className = 'astra-violation';

    // Header with title and impact
    const header = document.createElement('div');
    header.className = 'astra-violation-header';
    
    const title = document.createElement('h4');
    title.textContent = violation.description;
    
    const impact = document.createElement('span');
    impact.className = 'astra-impact astra-impact-' + violation.impact;
    impact.textContent = violation.impact.toUpperCase();
    
    header.appendChild(title);
    header.appendChild(impact);

    // Info section
    const info = document.createElement('div');
    info.className = 'astra-violation-info';
    info.innerHTML = `
      <p><strong>Help:</strong> ${violation.help}</p>
      <p><strong>Affected Elements:</strong> ${violation.nodes.length}</p>
      <a href="${violation.helpUrl}" target="_blank" class="astra-help-link">📖 Learn More</a>
    `;

    // Examples section
    const examples = document.createElement('div');
    examples.className = 'astra-violation-examples';
    
    const examplesTitle = document.createElement('h5');
    examplesTitle.textContent = 'Code Examples & Fixes:';
    examples.appendChild(examplesTitle);

    // Process up to 3 examples
    violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
      const element = document.querySelector(node.target[0]);
      if (element) {
        const exampleDiv = this.createCodeExample(element, violation, node);
        examples.appendChild(exampleDiv);
      }
    });

    if (violation.nodes.length > 3) {
      const moreExamples = document.createElement('p');
      moreExamples.className = 'astra-more-examples';
      moreExamples.textContent = '... and ' + (violation.nodes.length - 3) + ' more similar issues';
      examples.appendChild(moreExamples);
    }

    violationDiv.appendChild(header);
    violationDiv.appendChild(info);
    violationDiv.appendChild(examples);

    return violationDiv;
  }

  createCodeExample(element, violation, node) {
    const exampleDiv = document.createElement('div');
    exampleDiv.className = 'astra-violation-example';

    const originalCode = this.getElementHTML(element);
    const fixedCode = this.generateFixedHTML(element, violation);

    // Current code section
    const currentSection = document.createElement('div');
    currentSection.className = 'astra-code-section';
    
    const currentHeader = document.createElement('div');
    currentHeader.className = 'astra-code-header';
    currentHeader.innerHTML = '<span class="astra-code-label">❌ Current Code (Problematic):</span>';
    
    const currentCopyBtn = document.createElement('button');
    currentCopyBtn.className = 'astra-copy-btn';
    currentCopyBtn.textContent = '📋 Copy';
    currentCopyBtn.addEventListener('click', () => this.copyToClipboard(originalCode, currentCopyBtn));
    currentHeader.appendChild(currentCopyBtn);
    
    const currentCode = document.createElement('pre');
    currentCode.className = 'astra-code-block astra-code-error';
    currentCode.innerHTML = '<code>' + this.escapeHTML(originalCode) + '</code>';
    
    currentSection.appendChild(currentHeader);
    currentSection.appendChild(currentCode);

    // Fixed code section
    const fixedSection = document.createElement('div');
    fixedSection.className = 'astra-code-section';
    
    const fixedHeader = document.createElement('div');
    fixedHeader.className = 'astra-code-header';
    fixedHeader.innerHTML = '<span class="astra-code-label">✅ Fixed Code (Recommended):</span>';
    
    const fixedCopyBtn = document.createElement('button');
    fixedCopyBtn.className = 'astra-copy-btn';
    fixedCopyBtn.textContent = '📋 Copy';
    fixedCopyBtn.addEventListener('click', () => this.copyToClipboard(fixedCode, fixedCopyBtn));
    fixedHeader.appendChild(fixedCopyBtn);
    
    const fixedCodeBlock = document.createElement('pre');
    fixedCodeBlock.className = 'astra-code-block astra-code-success';
    fixedCodeBlock.innerHTML = '<code>' + this.escapeHTML(fixedCode) + '</code>';
    
    fixedSection.appendChild(fixedHeader);
    fixedSection.appendChild(fixedCodeBlock);

    // Details section
    const details = document.createElement('div');
    details.className = 'astra-violation-details';
    details.innerHTML = `
      <p><strong>Issue:</strong> ${node.failureSummary || 'Accessibility violation detected'}</p>
      <p><strong>Location:</strong> <code>${node.target[0]}</code></p>
    `;

    exampleDiv.appendChild(currentSection);
    exampleDiv.appendChild(fixedSection);
    exampleDiv.appendChild(details);

    return exampleDiv;
  }

  getElementHTML(element) {
    if (!element) return 'Element not found';
    
    const clone = element.cloneNode(true);
    
    // Remove script tags and event handlers for security
    clone.querySelectorAll('script').forEach(script => script.remove());
    
    const attributesToRemove = ['onclick', 'onload', 'onerror'];
    attributesToRemove.forEach(attr => {
      if (clone.hasAttribute(attr)) {
        clone.removeAttribute(attr);
      }
    });
    
    let html = clone.outerHTML;
    if (html.length > 500) {
      return html.substring(0, 500) + '...';
    }
    
    return html;
  }

  generateFixedHTML(element, violation) {
    if (!element) return 'Element not found';
    
    const clone = element.cloneNode(true);
    const ruleId = violation.id;
    
    switch (ruleId) {
      case 'color-contrast':
        clone.style.color = '#000000';
        clone.style.backgroundColor = '#ffffff';
        return '<!-- Fixed: Improved color contrast -->\n' + clone.outerHTML;
        
      case 'image-alt':
        if (clone.tagName === 'IMG') {
          clone.setAttribute('alt', 'Descriptive alt text here');
        }
        return '<!-- Fixed: Added descriptive alt text -->\n' + clone.outerHTML;
        
      case 'button-name':
        if (!clone.getAttribute('aria-label') && !clone.textContent.trim()) {
          clone.setAttribute('aria-label', 'Descriptive button label');
        }
        return '<!-- Fixed: Added accessible name -->\n' + clone.outerHTML;
        
      case 'link-name':
        if (!clone.textContent.trim()) {
          clone.setAttribute('aria-label', 'Descriptive link text');
        }
        return '<!-- Fixed: Added descriptive link text -->\n' + clone.outerHTML;
        
      case 'form-field-multiple-labels':
      case 'label':
        if (clone.tagName === 'INPUT') {
          const id = clone.id || 'input-' + Math.random().toString(36).substr(2, 9);
          clone.id = id;
          return '<!-- Fixed: Added proper label association -->\n<label for="' + id + '">Input Label</label>\n' + clone.outerHTML;
        }
        return '<!-- Fixed: Added proper labeling -->\n' + clone.outerHTML;
        
      default:
        clone.setAttribute('aria-label', 'Descriptive label');
        return '<!-- Fixed: Added accessibility attributes -->\n' + clone.outerHTML;
    }
  }

  async runAIAnalysis() {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Generating AI analysis...</div>';

    try {
      const analysisData = {
        domStyles: this.domAnalysis || this.extractDOMStyles(),
        accessibilityResults: this.axeResults,
        url: window.location.href,
        screenshot: this.screenshot ? this.screenshot.substring(0, 10000) : null
      };

      const payloadSize = JSON.stringify(analysisData).length;
      console.log('Payload size: ' + Math.round(payloadSize / 1024) + 'KB');
      
      if (payloadSize > 1000000) {
        analysisData.domStyles = analysisData.domStyles.slice(0, 100);
        analysisData.screenshot = null;
        console.log('Reduced payload size due to size limits');
      }

      console.log('Sending AI analysis request via background script...');
      
      // Use background script to make the API call (bypasses ad blockers)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'aiAnalysis',
          data: analysisData
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Background script response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Background script request failed');
      }

      this.displayAIResults(response.data);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      // Check if it's a background script communication error
      if (error.message.includes('runtime') || error.message.includes('Extension context')) {
        resultsDiv.innerHTML = `
          <div class="astra-error">
            <h4>🔧 Extension Communication Error</h4>
            <p>Cannot communicate with background script. Please try:</p>
            <ul>
              <li>Reload the extension in chrome://extensions/</li>
              <li>Refresh this page</li>
              <li>Check browser console for errors</li>
            </ul>
            <button class="astra-btn" onclick="window.location.reload()">Reload Page</button>
          </div>
        `;
      } else {
        // Show the enhanced error display
        this.showServerError(error.message);
      }
    }
  }

  async analyzeDesign() {
    const resultsDiv = document.getElementById('design-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Analyzing design...</div>';

    try {
      this.domAnalysis = this.extractDOMStyles();
      
      const analysisData = {
        domStyles: this.domAnalysis,
        designScreenshot: this.screenshot ? this.screenshot.substring(0, 50000) : null,
        url: window.location.href
      };

      const payloadSize = JSON.stringify(analysisData).length;
      if (payloadSize > 800000) {
        analysisData.domStyles = analysisData.domStyles.slice(0, 150);
        analysisData.designScreenshot = null;
      }

      console.log('Sending design analysis request via background script...');
      
      // Use background script to make the API call (bypasses ad blockers)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'designAnalysis',
          data: analysisData
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Background script response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Background script request failed');
      }

      this.displayDesignResults(response.data);
    } catch (error) {
      console.error('Design Analysis Error:', error);
      resultsDiv.innerHTML = '<div class="astra-error">Error: ' + error.message + '</div>';
    }
  }

  async testBackendConnection() {
    console.log('Testing backend connection via background script...');
    
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Testing backend connection...</div>';
    
    try {
      console.log('🔍 Sending health check via background script...');
      
      // Use background script for health check (bypasses ad blockers)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'healthCheck'
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Background script health check response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Health check failed');
      }

      const healthResult = response.data;
      
      // Check website blocking characteristics
      const currentDomain = window.location.hostname;
      const isHTTPS = window.location.protocol === 'https:';
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspHeader = cspMeta ? cspMeta.content : 'No CSP meta tag found';
      
      console.log('Current domain:', currentDomain);
      console.log('Is HTTPS:', isHTTPS);
      console.log('CSP Policy:', cspHeader);
      
      // Success! Show results
      resultsDiv.innerHTML = `
        <div class="astra-analysis-result">
          <h3>✅ Connection Test Successful!</h3>
          <div class="astra-analysis-content">
            <h4>🎉 Ad Blocker Bypass Working!</h4>
            <p>Using background script successfully bypassed client-side blocking.</p>
            
            <h5>Backend Status:</h5>
            <ul>
              <li><strong>Status:</strong> ${healthResult.status}</li>
              <li><strong>Service:</strong> ${healthResult.service}</li>
              <li><strong>CORS:</strong> ${healthResult.cors || 'Enabled'}</li>
              <li><strong>Timestamp:</strong> ${healthResult.timestamp}</li>
            </ul>
            
            <h5>Website Info:</h5>
            <ul>
              <li><strong>Domain:</strong> ${currentDomain}</li>
              <li><strong>Protocol:</strong> ${window.location.protocol}</li>
              <li><strong>Security Level:</strong> ${this.assessSiteSecurity()}</li>
              <li><strong>CSP:</strong> ${cspHeader.includes('connect-src') ? 'Has connect-src policy' : 'No connect-src restrictions'}</li>
            </ul>
            
            <p><strong>✅ The extension is now using a background script to bypass ad blockers and other client-side blocking!</strong></p>
            
            <div class="astra-debug-actions">
              <button class="astra-btn" onclick="window.astraExtension.runAIAnalysis()">Try AI Analysis</button>
              <button class="astra-btn" onclick="window.astraExtension.tryMockAnalysis()">Mock Analysis</button>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Analyze the error type
      let errorAnalysis = '';
      let blockingType = 'Unknown';
      
      if (error.message.includes('runtime') || error.message.includes('Extension context')) {
        blockingType = 'Extension Communication Error';
        errorAnalysis = `
          <h4>🔧 Extension Communication Error</h4>
          <p>Cannot communicate with the background script.</p>
          <h5>Solutions:</h5>
          <ul>
            <li><strong>Reload Extension:</strong> Go to chrome://extensions/ and reload Astra</li>
            <li><strong>Refresh Page:</strong> Reload this webpage</li>
            <li><strong>Check Console:</strong> Look for errors in browser console</li>
            <li><strong>Reinstall Extension:</strong> Remove and reinstall if problems persist</li>
          </ul>
        `;
      } else if (error.message.includes('500')) {
        blockingType = 'Backend Server Error';
        errorAnalysis = `
          <h4>🚨 Backend Server Error</h4>
          <p>The backend API is reachable but failing to process requests.</p>
          <h5>Common Causes:</h5>
          <ul>
            <li><strong>Missing Claude API Key:</strong> Check Vercel environment variables</li>
            <li><strong>Claude API Issues:</strong> The AI service might be down</li>
            <li><strong>Backend Code Error:</strong> Check Vercel function logs</li>
            <li><strong>Memory/Timeout:</strong> Request might be too large</li>
          </ul>
        `;
      } else {
        blockingType = 'Network/Connection Error';
        errorAnalysis = `
          <h4>🌐 Network/Connection Error</h4>
          <p>Still having connection issues even with background script bypass.</p>
          <h5>Possible Causes:</h5>
          <ul>
            <li><strong>Network Firewall:</strong> Corporate/institutional blocking</li>
            <li><strong>DNS Issues:</strong> Cannot resolve backend domain</li>
            <li><strong>Backend Down:</strong> Vercel deployment might be offline</li>
            <li><strong>Extension Permissions:</strong> Missing required permissions</li>
          </ul>
        `;
      }
      
      resultsDiv.innerHTML = `
        <div class="astra-error">
          <h3>❌ Connection Test Failed</h3>
          <p><strong>Error Type:</strong> ${blockingType}</p>
          <p><strong>Error Message:</strong> ${error.message}</p>
          
          ${errorAnalysis}
          
          <div class="astra-debug-actions">
            <button class="astra-btn" onclick="window.astraExtension.tryMockAnalysis()">Try Mock Analysis</button>
            <button class="astra-btn" onclick="window.astraExtension.viewDebugInfo()">View Debug Info</button>
            <button class="astra-btn" onclick="window.location.reload()">Reload Page</button>
          </div>
        </div>
      `;
    }
  }

  showServerError(errorDetails) {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = `
      <div class="astra-error">
        <h4>🚨 Backend Server Error (500)</h4>
        <p><strong>Issue:</strong> The backend API is failing to process your request.</p>
        <p><strong>Error Details:</strong> ${errorDetails}</p>
        
        <h5>Common Causes:</h5>
        <ul>
          <li><strong>Missing ANTHROPIC API Key:</strong> Check if ANTHROPIC_API_KEY is set in Vercel environment variables</li>
          <li><strong>Claude API Issues:</strong> The Claude API might be down or returning errors</li>
          <li><strong>Backend Code Error:</strong> There might be a bug in the API endpoint</li>
          <li><strong>Payload Issues:</strong> The request data might be malformed</li>
        </ul>
        
        <div class="astra-debug-actions">
          <button class="astra-btn" onclick="window.astraExtension.testBackendConnection()">Test Backend Health</button>
          <button class="astra-btn" onclick="window.astraExtension.tryMockAnalysis()">Try Mock Analysis</button>
          <button class="astra-btn" onclick="window.astraExtension.viewPayload()">View Request Data</button>
        </div>
      </div>
    `;
  }

  async testBackendConnection() {
    console.log('Testing backend connection...');
    
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Testing backend connection...</div>';
    
    try {
      // Test 1: Basic health check
      console.log('🔍 Test 1: Basic health check');
      const healthResponse = await fetch(this.backendUrl + '/api/health');
      const healthResult = await healthResponse.json();
      
      console.log('Health check result:', healthResult);
      
      if (!healthResponse.ok) {
        throw new Error('Health check failed: ' + healthResponse.status);
      }
      
      // Test 2: Check if current website is blocking requests
      console.log('🔍 Test 2: Website blocking check');
      const currentDomain = window.location.hostname;
      const isHTTPS = window.location.protocol === 'https:';
      
      console.log('Current domain:', currentDomain);
      console.log('Is HTTPS:', isHTTPS);
      console.log('User agent:', navigator.userAgent);
      
      // Test 3: Check CSP headers
      console.log('🔍 Test 3: Content Security Policy check');
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspHeader = cspMeta ? cspMeta.content : 'No CSP meta tag found';
      console.log('CSP Policy:', cspHeader);
      
      // Test 4: Try a simple API call
      console.log('🔍 Test 4: Simple API test');
      const testData = {
        domStyles: [{ tag: 'test', id: 'test' }],
        accessibilityResults: null,
        url: window.location.href,
        screenshot: null
      };
      
      const testResponse = await fetch(this.backendUrl + '/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Test API response status:', testResponse.status);
      
      if (!testResponse.ok) {
        const errorBody = await testResponse.text();
        console.log('Test API error body:', errorBody);
        throw new Error('API test failed: ' + testResponse.status + ' - ' + errorBody);
      }
      
      const testResult = await testResponse.json();
      console.log('Test API result:', testResult);
      
      // If we get here, everything works
      resultsDiv.innerHTML = `
        <div class="astra-analysis-result">
          <h3>✅ Connection Test Successful!</h3>
          <div class="astra-analysis-content">
            <p><strong>Backend Status:</strong> ${healthResult.status}</p>
            <p><strong>Service:</strong> ${healthResult.service}</p>
            <p><strong>Current Domain:</strong> ${currentDomain}</p>
            <p><strong>Protocol:</strong> ${window.location.protocol}</p>
            <p><strong>CSP Status:</strong> ${cspHeader.includes('connect-src') ? 'Has connect-src policy' : 'No connect-src restrictions'}</p>
            
            <h4>✅ All tests passed!</h4>
            <p>Your backend is working correctly. The 500 error might be due to:</p>
            <ul>
              <li>Missing or invalid Claude API key</li>
              <li>Large payload size causing timeouts</li>
              <li>Claude API rate limiting</li>
              <li>Specific DOM content causing processing errors</li>
            </ul>
            
            <button class="astra-btn" onclick="window.astraExtension.tryMockAnalysis()">Try Mock Analysis</button>
            <button class="astra-btn" onclick="window.astraExtension.runAIAnalysis()">Retry AI Analysis</button>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Analyze the error to provide specific guidance
      let errorAnalysis = '';
      let blockingType = 'Unknown';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        blockingType = 'Network/CORS Blocking';
        errorAnalysis = `
          <h4>🚫 Network/CORS Blocking Detected</h4>
          <p>The website or network is blocking external API requests.</p>
          <h5>Common Causes:</h5>
          <ul>
            <li><strong>Corporate Firewall:</strong> Your company network might block external APIs</li>
            <li><strong>Website CSP:</strong> The current website has strict Content Security Policy</li>
            <li><strong>Ad Blocker:</strong> Browser extensions might be blocking the request</li>
            <li><strong>HTTPS/HTTP Mixed Content:</strong> Security restrictions on mixed protocols</li>
          </ul>
        `;
      } else if (error.message.includes('500')) {
        blockingType = 'Backend Server Error';
        errorAnalysis = `
          <h4>🚨 Backend Server Error</h4>
          <p>The backend API is reachable but failing to process requests.</p>
          <h5>Likely Causes:</h5>
          <ul>
            <li><strong>Missing Claude API Key:</strong> Check Vercel environment variables</li>
            <li><strong>Claude API Issues:</strong> The AI service might be down</li>
            <li><strong>Payload Processing Error:</strong> The request data is causing backend errors</li>
            <li><strong>Memory/Timeout Limits:</strong> Request is too large or taking too long</li>
          </ul>
        `;
      } else if (error.message.includes('403') || error.message.includes('blocked')) {
        blockingType = 'Website Security Blocking';
        errorAnalysis = `
          <h4>🛡️ Website Security Blocking</h4>
          <p>The current website (${window.location.hostname}) is blocking external requests.</p>
          <h5>What's Happening:</h5>
          <ul>
            <li><strong>CSP Policy:</strong> Content Security Policy restrictions</li>
            <li><strong>CORS Headers:</strong> Cross-Origin Resource Sharing blocked</li>
            <li><strong>Security Headers:</strong> X-Frame-Options or similar restrictions</li>
            <li><strong>Website Firewall:</strong> The site's security system is blocking requests</li>
          </ul>
        `;
      }
      
      resultsDiv.innerHTML = `
        <div class="astra-error">
          <h3>❌ Connection Test Failed</h3>
          <p><strong>Error Type:</strong> ${blockingType}</p>
          <p><strong>Error Message:</strong> ${error.message}</p>
          
          ${errorAnalysis}
          
          <h5>🔧 Troubleshooting Steps:</h5>
          <ol>
            <li><strong>Try a different website:</strong> Test on a simple site like <code>example.com</code></li>
            <li><strong>Check your network:</strong> Try on a different network (mobile hotspot)</li>
            <li><strong>Disable ad blockers:</strong> Temporarily disable other extensions</li>
            <li><strong>Test in incognito mode:</strong> Open the extension in private browsing</li>
            <li><strong>Check backend logs:</strong> View Vercel function logs for errors</li>
          </ol>
          
          <div class="astra-debug-actions">
            <button class="astra-btn" onclick="window.astraExtension.tryMockAnalysis()">Try Mock Analysis</button>
            <button class="astra-btn" onclick="window.astraExtension.testOnDifferentSite()">Test on Different Site</button>
            <button class="astra-btn" onclick="window.astraExtension.viewDebugInfo()">View Debug Info</button>
          </div>
        </div>
      `;
    }
  }

  testOnDifferentSite() {
    alert(`
🔍 Testing on Different Sites

Try opening these sites and testing the extension:

✅ Simple sites (least likely to block):
• https://example.com
• https://httpbin.org
• https://jsonplaceholder.typicode.com

⚠️ Medium security sites:
• https://github.com
• https://stackoverflow.com

❌ High security sites (likely to block):
• Banking websites
• Corporate intranets
• Government sites

Current site: ${window.location.hostname}
Security level: ${this.assessSiteSecurity()}
    `);
  }

  assessSiteSecurity() {
    const hostname = window.location.hostname;
    
    // Check for high-security domains
    if (hostname.includes('bank') || hostname.includes('gov') || hostname.includes('secure')) {
      return 'HIGH (likely to block external requests)';
    }
    
    // Check for corporate domains
    if (hostname.includes('corp') || hostname.includes('intranet') || hostname.includes('internal')) {
      return 'HIGH (corporate network restrictions)';
    }
    
    // Check for CDN or simple sites
    if (hostname.includes('example') || hostname.includes('test') || hostname.includes('demo')) {
      return 'LOW (unlikely to block)';
    }
    
    // Check HTTPS
    if (window.location.protocol === 'https:') {
      return 'MEDIUM (HTTPS site with potential CSP)';
    }
    
    return 'MEDIUM (standard website)';
  }

  viewDebugInfo() {
    const debugInfo = {
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      backendUrl: this.backendUrl,
      timestamp: new Date().toISOString(),
      cspPolicy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'None',
      securityLevel: this.assessSiteSecurity(),
      domStylesCount: this.domAnalysis ? this.domAnalysis.length : 0,
      hasAccessibilityResults: !!this.axeResults,
      hasScreenshot: !!this.screenshot
    };
    
    console.log('🔍 Debug Information:', debugInfo);
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)).then(() => {
      alert('Debug information copied to clipboard!\n\nShare this with support if needed.');
    }).catch(() => {
      alert('Debug Information:\n\n' + JSON.stringify(debugInfo, null, 2));
    });
  }

  tryMockAnalysis() {
    console.log('Displaying mock analysis...');
    
    const mockResult = {
      success: true,
      analysis: `
        <h4>🤖 Mock AI Analysis</h4>
        <p><strong>Website:</strong> ${window.location.href}</p>
        
        <h5>Overall Assessment:</h5>
        <p>Your website structure looks good! Here are some AI-powered observations:</p>
        
        <h5>Design Quality:</h5>
        <ul>
          <li>✅ Typography appears consistent across elements</li>
          <li>✅ Color usage follows a coherent scheme</li>
          <li>⚠️ Some spacing inconsistencies detected</li>
          <li>✅ Interactive elements are properly styled</li>
        </ul>
        
        <h5>Accessibility:</h5>
        <ul>
          <li>✅ Good semantic structure with proper headings</li>
          <li>⚠️ Some images may need better alt text</li>
          <li>✅ Color contrast appears adequate</li>
          <li>⚠️ Consider adding more ARIA labels</li>
        </ul>
        
        <h5>Recommendations:</h5>
        <ol>
          <li><strong>Standardize spacing:</strong> Use consistent margin/padding tokens</li>
          <li><strong>Enhance accessibility:</strong> Add descriptive alt text to all images</li>
          <li><strong>Improve forms:</strong> Ensure all form inputs have proper labels</li>
          <li><strong>Mobile optimization:</strong> Test responsive design on various screen sizes</li>
        </ol>
        
        <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <p><strong>💡 Note:</strong> This is a mock analysis. To get real AI insights, configure your Claude API key in the backend.</p>
        </div>
      `,
      timestamp: new Date().toISOString()
    };
    
    this.displayAIResults(mockResult);
  }

  viewPayload() {
    const analysisData = {
      domStyles: this.domAnalysis || this.extractDOMStyles(),
      accessibilityResults: this.axeResults,
      url: window.location.href,
      screenshot: this.screenshot ? this.screenshot.substring(0, 100) + '...' : null
    };
    
    const payloadSize = JSON.stringify(analysisData).length;
    
    console.log('Request payload:', analysisData);
    console.log('Payload size:', Math.round(payloadSize / 1024) + 'KB');
    
    const payloadWindow = window.open('', '_blank', 'width=800,height=600');
    payloadWindow.document.write(`
      <html>
        <head><title>Astra - Request Payload Debug</title></head>
        <body style="font-family: monospace; padding: 20px;">
          <h2>Request Payload Debug</h2>
          <p><strong>Size:</strong> ${Math.round(payloadSize / 1024)}KB</p>
          <p><strong>URL:</strong> ${this.backendUrl}/api/ai-analysis</p>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${JSON.stringify(analysisData, null, 2)}</pre>
        </body>
      </html>
    `);
  }

  async analyzeDesign() {
    const resultsDiv = document.getElementById('design-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Analyzing design...</div>';

    try {
      this.domAnalysis = this.extractDOMStyles();
      
      const analysisData = {
        domStyles: this.domAnalysis,
        designScreenshot: this.screenshot ? this.screenshot.substring(0, 50000) : null,
        url: window.location.href
      };

      const payloadSize = JSON.stringify(analysisData).length;
      if (payloadSize > 800000) {
        analysisData.domStyles = analysisData.domStyles.slice(0, 150);
        analysisData.designScreenshot = null;
      }

      const response = await fetch(this.backendUrl + '/api/analyze-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const result = await response.json();
      this.displayDesignResults(result);
    } catch (error) {
      console.error('Design Analysis Error:', error);
      resultsDiv.innerHTML = '<div class="astra-error">Error: ' + error.message + '</div>';
    }
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

  exportAccessibilityReport() {
    if (!this.axeResults) {
      alert('No accessibility results to export. Please run an audit first.');
      return;
    }

    const report = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      summary: {
        violations: this.axeResults.violations.length,
        passes: this.axeResults.passes.length,
        incomplete: this.axeResults.incomplete.length
      },
      violations: this.axeResults.violations.map(violation => ({
        id: violation.id,
        description: violation.description,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          failureSummary: node.failureSummary,
          html: this.getElementHTML(document.querySelector(node.target[0])),
          fixedHtml: this.generateFixedHTML(document.querySelector(node.target[0]), violation)
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-report-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async copyToClipboard(text, buttonElement) {
    if (!text || !buttonElement) return;
    
    const originalText = buttonElement.textContent;
    const originalBgColor = buttonElement.style.backgroundColor;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopyToClipboard(text);
      }
      
      buttonElement.textContent = '✅ Copied!';
      buttonElement.style.backgroundColor = '#48bb78';
      
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.backgroundColor = originalBgColor;
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      try {
        this.fallbackCopyToClipboard(text);
        buttonElement.textContent = '✅ Copied!';
        setTimeout(() => {
          buttonElement.textContent = originalText;
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        buttonElement.textContent = '❌ Failed';
        buttonElement.style.backgroundColor = '#dc2626';
        setTimeout(() => {
          buttonElement.textContent = originalText;
          buttonElement.style.backgroundColor = originalBgColor;
        }, 2000);
      }
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Fallback copy command failed');
    }
  }
}

// Initialize the extension with error handling
try {
  if (!window.astraExtension) {
    window.astraExtension = new AstraExtension();
    console.log('Astra extension initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Astra extension:', error);
  window.astraExtension = {
    toggle: () => alert('Extension failed to initialize. Please reload the page.'),
    runAccessibilityAudit: () => alert('Extension failed to initialize. Please reload the page.'),
    runAIAnalysis: () => alert('Extension failed to initialize. Please reload the page.'),
    analyzeDesign: () => alert('Extension failed to initialize. Please reload the page.'),
    toggleOverlayImage: () => alert('Extension failed to initialize. Please reload the page.'),
    copyToClipboard: () => alert('Extension failed to initialize. Please reload the page.'),
    exportAccessibilityReport: () => alert('Extension failed to initialize. Please reload the page.')
  };
}