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
    this.backendUrl = 'https://astra-qa.vercel.app'; // Updated to actual deployment URL
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
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
        sendResponse({success: true});
      }
      return true; // Keep message channel open for async response
    });
    
    // Mark extension as ready
    this.isReady = true;
    console.log('Astra extension initialized and ready');
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
          <button class="astra-close" id="astra-close-btn">×</button>
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
              <button class="astra-btn" id="analyze-design-btn">
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
              <button class="astra-btn" id="toggle-overlay-btn">
                Toggle Overlay
              </button>
            </div>
            
            <div class="astra-results" id="design-results"></div>
          </div>
          
          <!-- Accessibility Tab -->
          <div class="astra-tab-content" id="accessibility-tab">
            <button class="astra-btn" id="run-accessibility-btn">
              Run Accessibility Audit
            </button>
            <div class="astra-results" id="accessibility-results"></div>
          </div>
          
          <!-- AI Analysis Tab -->
          <div class="astra-tab-content" id="analysis-tab">
            <button class="astra-btn" id="run-ai-analysis-btn">
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

  // DOM Style Extraction (Optimized for Payload Size)
  extractDOMStyles() {
    const elements = document.querySelectorAll('*');
    const styleData = [];
    const MAX_ELEMENTS = 200; // Limit to 200 most important elements

    // Priority selectors - these are most important for design analysis
    const prioritySelectors = [
      'h1, h2, h3, h4, h5, h6',           // Headings
      'p, span, div',                      // Text elements
      'button, a, input',                  // Interactive elements
      'header, nav, main, section, footer', // Semantic elements
      '[class*="btn"], [class*="button"]', // Button-like elements
      '[class*="card"], [class*="modal"]', // Common components
      '[id], [class]'                      // Elements with specific styling
    ];

    // Get priority elements first
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

    // Convert Set to Array and add remaining elements if needed
    const elementsToProcess = Array.from(priorityElements);
    
    // Fill remaining slots with other visible elements
    elements.forEach(element => {
      if (elementsToProcess.length >= MAX_ELEMENTS) return;
      
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && !priorityElements.has(element)) {
        elementsToProcess.push(element);
      }
    });

    // Extract styles for selected elements only
    elementsToProcess.slice(0, MAX_ELEMENTS).forEach(element => {
      const computed = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Only extract essential styles
      styleData.push({
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className ? element.className.substring(0, 100) : null, // Limit class names
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        typography: {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily.substring(0, 50), // Limit font family string
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

    console.log(`Extracted styles for ${styleData.length} elements (limited for API)`);
    return styleData;
  }

  // Accessibility Audit with Code Snippets
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
    
    const violationsHtml = results.violations.map((violation, violationIndex) => {
      const violationExamples = violation.nodes.slice(0, 3).map((node, nodeIndex) => {
        const element = document.querySelector(node.target[0]);
        const originalCode = element ? this.getElementHTML(element) : 'Element not found';
        const fixedCode = this.generateFixedHTML(element, violation);
        
        return `
          <div class="astra-violation-example">
            <div class="astra-code-section">
              <div class="astra-code-header">
                <span class="astra-code-label">❌ Current Code (Problematic):</span>
                <button class="astra-copy-btn" onclick="window.astraExtension.copyToClipboard(\`${this.escapeForJS(originalCode)}\`, this)">
                  📋 Copy
                </button>
              </div>
              <pre class="astra-code-block astra-code-error"><code>${this.escapeHTML(originalCode)}</code></pre>
            </div>
            
            <div class="astra-code-section">
              <div class="astra-code-header">
                <span class="astra-code-label">✅ Fixed Code (Recommended):</span>
                <button class="astra-copy-btn" onclick="window.astraExtension.copyToClipboard(\`${this.escapeForJS(fixedCode)}\`, this)">
                  📋 Copy
                </button>
              </div>
              <pre class="astra-code-block astra-code-success"><code>${this.escapeHTML(fixedCode)}</code></pre>
            </div>
            
            <div class="astra-violation-details">
              <p><strong>Issue:</strong> ${node.failureSummary || 'Accessibility violation detected'}</p>
              <p><strong>Location:</strong> <code>${node.target[0]}</code></p>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="astra-violation">
          <div class="astra-violation-header">
            <h4>${violation.description}</h4>
            <span class="astra-impact astra-impact-${violation.impact}">${violation.impact.toUpperCase()}</span>
          </div>
          
          <div class="astra-violation-info">
            <p><strong>Help:</strong> ${violation.help}</p>
            <p><strong>Affected Elements:</strong> ${violation.nodes.length}</p>
            <a href="${violation.helpUrl}" target="_blank" class="astra-help-link">📖 Learn More</a>
          </div>
          
          <div class="astra-violation-examples">
            <h5>Code Examples & Fixes:</h5>
            ${violationExamples}
            ${violation.nodes.length > 3 ? `<p class="astra-more-examples">... and ${violation.nodes.length - 3} more similar issues</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    resultsDiv.innerHTML = `
      <div class="astra-audit-summary">
        <h3>Accessibility Audit Results</h3>
        <div class="astra-stats">
          <span class="astra-stat astra-stat-pass">✅ ${results.passes.length} Passed</span>
          <span class="astra-stat astra-stat-violations">❌ ${results.violations.length} Violations</span>
          <span class="astra-stat astra-stat-incomplete">⚠️ ${results.incomplete.length} Incomplete</span>
        </div>
        <button class="astra-btn astra-export-btn" onclick="window.astraExtension.exportAccessibilityReport()">
          📥 Export Full Report
        </button>
      </div>
      <div class="astra-violations">
        <h4>Violations Found:</h4>
        ${violationsHtml || '<p class="astra-no-violations">🎉 No violations found! Your site is accessible.</p>'}
      </div>
    `;
  }

  // Get clean HTML for an element
  getElementHTML(element) {
    if (!element) return 'Element not found';
    
    // Create a clone to avoid modifying the original
    const clone = element.cloneNode(true);
    
    // Remove script tags and event handlers for security
    clone.querySelectorAll('script').forEach(script => script.remove());
    
    // Clean up attributes
    const attributesToRemove = ['onclick', 'onload', 'onerror'];
    attributesToRemove.forEach(attr => {
      if (clone.hasAttribute(attr)) {
        clone.removeAttribute(attr);
      }
    });
    
    // Return the outer HTML, truncated if too long
    let html = clone.outerHTML;
    if (html.length > 500) {
      const truncated = html.substring(0, 500) + '...';
      // Try to close any unclosed tags
      const openTags = truncated.match(/<(\w+)[^>]*>/g) || [];
      const closeTags = truncated.match(/<\/(\w+)>/g) || [];
      
      if (openTags.length > closeTags.length) {
        const lastOpenTag = openTags[openTags.length - 1];
        const tagName = lastOpenTag.match(/<(\w+)/)[1];
        return truncated + `</${tagName}>`;
      }
      return truncated;
    }
    
    return html;
  }

  // Generate fixed HTML based on violation type
  generateFixedHTML(element, violation) {
    if (!element) return 'Element not found';
    
    const clone = element.cloneNode(true);
    const ruleId = violation.id;
    
    // Apply fixes based on common violation types
    switch (ruleId) {
      case 'color-contrast':
        // Suggest better contrast
        clone.style.color = '#000000'; // High contrast text
        clone.style.backgroundColor = '#ffffff'; // High contrast background
        return `<!-- Fixed: Improved color contrast -->\n${clone.outerHTML}`;
        
      case 'image-alt':
        // Add alt text
        if (clone.tagName === 'IMG') {
          clone.setAttribute('alt', 'Descriptive alt text here');
        }
        return `<!-- Fixed: Added descriptive alt text -->\n${clone.outerHTML}`;
        
      case 'button-name':
        // Add accessible name
        if (!clone.getAttribute('aria-label') && !clone.textContent.trim()) {
          clone.setAttribute('aria-label', 'Descriptive button label');
        }
        return `<!-- Fixed: Added accessible name -->\n${clone.outerHTML}`;
        
      case 'link-name':
        // Add link text or aria-label
        if (!clone.textContent.trim()) {
          clone.setAttribute('aria-label', 'Descriptive link text');
        }
        return `<!-- Fixed: Added descriptive link text -->\n${clone.outerHTML}`;
        
      case 'form-field-multiple-labels':
      case 'label':
        // Add proper label association
        if (clone.tagName === 'INPUT') {
          const id = clone.id || 'input-' + Math.random().toString(36).substr(2, 9);
          clone.id = id;
          return `<!-- Fixed: Added proper label association -->\n<label for="${id}">Input Label</label>\n${clone.outerHTML}`;
        }
        return `<!-- Fixed: Added proper labeling -->\n${clone.outerHTML}`;
        
      case 'heading-order':
        // Fix heading hierarchy
        const currentLevel = parseInt(clone.tagName.charAt(1));
        const suggestedLevel = Math.max(1, currentLevel - 1);
        const newTag = `h${suggestedLevel}`;
        const newElement = document.createElement(newTag);
        newElement.innerHTML = clone.innerHTML;
        // Copy attributes
        Array.from(clone.attributes).forEach(attr => {
          newElement.setAttribute(attr.name, attr.value);
        });
        return `<!-- Fixed: Corrected heading hierarchy -->\n${newElement.outerHTML}`;
        
      case 'landmark-one-main':
        // Add main landmark
        if (clone.tagName === 'DIV') {
          clone.setAttribute('role', 'main');
        }
        return `<!-- Fixed: Added main landmark -->\n${clone.outerHTML}`;
        
      case 'region':
        // Add landmark roles
        clone.setAttribute('role', 'region');
        clone.setAttribute('aria-labelledby', 'section-heading');
        return `<!-- Fixed: Added landmark role -->\n${clone.outerHTML}`;
        
      case 'list':
        // Fix list structure
        if (clone.tagName === 'UL' || clone.tagName === 'OL') {
          // Ensure list items are properly nested
          const listItems = clone.querySelectorAll('li');
          if (listItems.length === 0) {
            clone.innerHTML = '<li>List item content here</li>';
          }
        }
        return `<!-- Fixed: Proper list structure -->\n${clone.outerHTML}`;
        
      case 'aria-valid-attr-value':
      case 'aria-allowed-attr':
        // Remove invalid ARIA attributes
        const ariaAttrs = Array.from(clone.attributes).filter(attr => attr.name.startsWith('aria-'));
        ariaAttrs.forEach(attr => {
          if (attr.value === '' || attr.value === 'true' || attr.value === 'false') {
            // Keep boolean attributes
          } else {
            clone.removeAttribute(attr.name);
          }
        });
        return `<!-- Fixed: Corrected ARIA attributes -->\n${clone.outerHTML}`;
        
      default:
        // Generic accessibility improvement
        clone.setAttribute('role', 'button');
        clone.setAttribute('tabindex', '0');
        return `<!-- Fixed: Added basic accessibility attributes -->\n${clone.outerHTML}`;
    }
  }

  // Updated runAIAnalysis method with payload size check
  async runAIAnalysis() {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Generating AI analysis...</div>';

    try {
      const analysisData = {
        domStyles: this.domAnalysis || this.extractDOMStyles(),
        accessibilityResults: this.axeResults,
        url: window.location.href,
        screenshot: this.screenshot ? this.screenshot.substring(0, 10000) : null // Limit screenshot size
      };

      // Check payload size (approximate)
      const payloadSize = JSON.stringify(analysisData).length;
      console.log(`Payload size: ${Math.round(payloadSize / 1024)}KB`);
      
      if (payloadSize > 1000000) { // ~1MB limit
        // Further reduce data if still too large
        analysisData.domStyles = analysisData.domStyles.slice(0, 100);
        analysisData.screenshot = null; // Remove screenshot if payload too large
        console.log('Reduced payload size due to size limits');
      }

      const response = await fetch(`${this.backendUrl}/api/ai-analysis`, {
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
      console.error('AI Analysis Error:', error);
      resultsDiv.innerHTML = `<div class="astra-error">Error: ${error.message}</div>`;
    }
  }

  // Updated analyzeDesign method with size limits
  async analyzeDesign() {
    const resultsDiv = document.getElementById('design-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Analyzing design...</div>';

    try {
      // Extract DOM styles with limits
      this.domAnalysis = this.extractDOMStyles();
      
      const analysisData = {
        domStyles: this.domAnalysis,
        designScreenshot: this.screenshot ? this.screenshot.substring(0, 50000) : null, // Limit screenshot
        url: window.location.href
      };

      // Check and reduce payload if needed
      const payloadSize = JSON.stringify(analysisData).length;
      if (payloadSize > 800000) { // ~800KB limit for design analysis
        analysisData.domStyles = analysisData.domStyles.slice(0, 150);
        analysisData.designScreenshot = null;
      }

      const response = await fetch(`${this.backendUrl}/api/analyze-design`, {
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
      this.displayDesignResults(result);
    } catch (error) {
      console.error('Design Analysis Error:', error);
      resultsDiv.innerHTML = `<div class="astra-error">Error: ${error.message}</div>`;
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

  // Export full accessibility report
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
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Utility functions for HTML processing
  escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeForJS(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')    // Backslashes first (important order!)
      .replace(/`/g, '\\`')      // Template literal backticks
      .replace(/\$/g, '\\$')     // Template literal variables
      .replace(/'/g, "\\'")      // Single quotes
      .replace(/"/g, '\\"')      // Double quotes
      .replace(/\n/g, '\\n')     // Newlines
      .replace(/\r/g, '\\r')     // Carriage returns
      .replace(/\t/g, '\\t');    // Tabs
  }

  // Safe clipboard operation with better error handling
  async copyToClipboard(text, buttonElement) {
    if (!text || !buttonElement) return;
    
    const originalText = buttonElement.textContent;
    const originalBgColor = buttonElement.style.backgroundColor;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        this.fallbackCopyToClipboard(text);
      }
      
      // Success feedback
      buttonElement.textContent = '✅ Copied!';
      buttonElement.style.backgroundColor = '#48bb78';
      
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.backgroundColor = originalBgColor;
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Try fallback method
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

  // Fallback copy method for older browsers
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

// Initialize the extension (only once) with error handling
try {
  if (!window.astraExtension) {
    window.astraExtension = new AstraExtension();
    console.log('Astra extension initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Astra extension:', error);
  // Create a fallback object to prevent undefined errors
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