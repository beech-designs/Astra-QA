// Astra Content Script - Main Extension Logic
// This script runs on all web pages and provides the core functionality

class AstraExtension {
  constructor() {
    this.overlay = null;
    this.isActive = false;
    this.isReady = false;
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
    
    // Tabs (removed Design QA tab)
    const tabs = document.createElement('div');
    tabs.className = 'astra-tabs';
    tabs.innerHTML = `
      <button class="astra-tab active" data-tab="accessibility">Accessibility</button>
      <button class="astra-tab" data-tab="analysis">AI Analysis</button>
    `;
    
    // Content area
    const content = document.createElement('div');
    content.className = 'astra-content';
    
    // Accessibility tab (now the default active tab)
    const accessibilityTab = document.createElement('div');
    accessibilityTab.className = 'astra-tab-content active';
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
    
    content.appendChild(accessibilityTab);
    content.appendChild(analysisTab);
    
    panel.appendChild(header);
    panel.appendChild(tabs);
    panel.appendChild(content);
    
    this.overlay.appendChild(panel);
    
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

    // Button event listeners
    document.getElementById('astra-close-btn').addEventListener('click', () => {
      this.toggle();
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

  extractDOMStyles() {
    const elements = document.querySelectorAll('*');
    const styles = [];
    
    elements.forEach((el, index) => {
      if (index > 500) return; // Limit to first 500 elements
      
      const computedStyle = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Skip hidden elements
      if (rect.width === 0 && rect.height === 0) return;
      
      const styleData = {
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        id: el.id,
        rect: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left)
        },
        styles: {
          fontSize: computedStyle.fontSize,
          fontFamily: computedStyle.fontFamily,
          fontWeight: computedStyle.fontWeight,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          margin: computedStyle.margin,
          padding: computedStyle.padding,
          border: computedStyle.border,
          borderRadius: computedStyle.borderRadius,
          display: computedStyle.display,
          position: computedStyle.position,
          zIndex: computedStyle.zIndex
        }
      };
      
      styles.push(styleData);
    });
    
    return styles;
  }

  async runAccessibilityAudit() {
    const resultsDiv = document.getElementById('accessibility-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Running accessibility audit...</div>';

    try {
      // Check if axe is loaded
      if (typeof window.axe === 'undefined') {
        throw new Error('axe-core library not loaded');
      }

      const results = await window.axe.run(document);
      this.axeResults = results;
      this.displayAccessibilityResults(results);
      
    } catch (error) {
      console.error('Accessibility audit error:', error);
      resultsDiv.innerHTML = `
        <div class="astra-error">
          <h4>❌ Accessibility Audit Failed</h4>
          <p>Error: ${error.message}</p>
          <p>Make sure axe-core is loaded properly.</p>
        </div>
      `;
    }
  }

  displayAccessibilityResults(results) {
    const resultsDiv = document.getElementById('accessibility-results');
    
    const summary = document.createElement('div');
    summary.className = 'astra-audit-summary';
    
    const passedCount = results.passes.length;
    const violationCount = results.violations.length;
    const incompleteCount = results.incomplete.length;
    
    summary.innerHTML = `
      <h3>♿ Accessibility Audit Results</h3>
      <div class="astra-stats">
        <div class="astra-stat">✅ Passed: ${passedCount}</div>
        <div class="astra-stat">❌ Violations: ${violationCount}</div>
        <div class="astra-stat">⚠️ Incomplete: ${incompleteCount}</div>
      </div>
    `;
    
    resultsDiv.appendChild(summary);
    
    if (violationCount === 0) {
      const noViolations = document.createElement('div');
      noViolations.className = 'astra-no-violations';
      noViolations.innerHTML = '🎉 No accessibility violations found!';
      resultsDiv.appendChild(noViolations);
      return;
    }
    
    // Display violations
    results.violations.forEach(violation => {
      const violationDiv = this.createViolationDisplay(violation);
      resultsDiv.appendChild(violationDiv);
    });
  }

  createViolationDisplay(violation) {
    const violationDiv = document.createElement('div');
    violationDiv.className = 'astra-violation';

    const header = document.createElement('div');
    header.className = 'astra-violation-header';

    const title = document.createElement('h4');
    title.textContent = violation.description;

    const impact = document.createElement('span');
    impact.className = 'astra-impact astra-impact-' + violation.impact;
    impact.textContent = violation.impact.toUpperCase();

    header.appendChild(title);
    header.appendChild(impact);

    const info = document.createElement('div');
    info.className = 'astra-violation-info';
    info.innerHTML = `
      <p><strong>Help:</strong> ${violation.help}</p>
      <p><strong>Rule ID:</strong> <code>${violation.id}</code></p>
      <p><strong>Elements affected:</strong> ${violation.nodes.length}</p>
    `;

    // Show up to 3 examples
    const examples = document.createElement('div');
    examples.className = 'astra-violation-examples';

    violation.nodes.slice(0, 3).forEach((node, index) => {
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
        // Add high contrast styles
        clone.style.cssText += '; color: #000000; background-color: #ffffff;';
        break;
      case 'link-name':
        if (clone.tagName === 'A' && !clone.textContent.trim()) {
          clone.setAttribute('aria-label', 'Descriptive link text needed');
          clone.textContent = 'Link text';
        }
        break;
      case 'button-name':
        if (clone.tagName === 'BUTTON' && !clone.textContent.trim()) {
          clone.textContent = 'Button label';
        }
        break;
      case 'image-alt':
        if (clone.tagName === 'IMG') {
          clone.setAttribute('alt', 'Descriptive alt text needed');
        }
        break;
      case 'label':
        if (clone.tagName === 'INPUT') {
          clone.setAttribute('aria-label', 'Input label needed');
        }
        break;
      case 'heading-order':
        const currentLevel = parseInt(clone.tagName.substring(1));
        const correctLevel = Math.max(1, currentLevel - 1);
        const newHeading = document.createElement('h' + correctLevel);
        newHeading.innerHTML = clone.innerHTML;
        clone.replaceWith(newHeading);
        return newHeading.outerHTML;
      default:
        // Generic accessibility improvement
        if (!clone.getAttribute('role') && !clone.getAttribute('aria-label')) {
          clone.setAttribute('aria-label', 'Accessibility improvement needed');
        }
    }
    
    let html = clone.outerHTML;
    if (html.length > 500) {
      return html.substring(0, 500) + '...';
    }
    
    return html;
  }

  copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.textContent;
      button.textContent = '✅ Copied!';
      button.style.backgroundColor = '#10b981';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      button.textContent = '❌ Failed';
      setTimeout(() => {
        button.textContent = '📋 Copy';
      }, 2000);
    });
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async runAIAnalysis() {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<div class="astra-loading">Generating AI analysis...</div>';

    try {
      this.domAnalysis = this.extractDOMStyles();
      
      const analysisData = {
        domStyles: this.domAnalysis,
        accessibilityResults: this.axeResults,
        url: window.location.href
      };

      const payloadSize = JSON.stringify(analysisData).length;
      console.log('Payload size: ' + Math.round(payloadSize / 1024) + 'KB');
      
      if (payloadSize > 1000000) {
        analysisData.domStyles = analysisData.domStyles.slice(0, 100);
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

  displayAIResults(data) {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '';

    const timestamp = new Date(data.timestamp).toLocaleString();
    
    const header = document.createElement('div');
    header.className = 'astra-analysis-header';
    header.innerHTML = `
      <h3>🤖 AI Analysis Results</h3>
      <p class="astra-timestamp">Generated: ${timestamp}</p>
    `;
    resultsDiv.appendChild(header);

    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'astra-analysis-content';
    analysisDiv.innerHTML = data.analysis;
    resultsDiv.appendChild(analysisDiv);
  }

  showServerError(errorMessage) {
    const resultsDiv = document.getElementById('analysis-results');
    
    // Parse common error types
    let errorType = 'Unknown Error';
    let troubleshooting = [];
    
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
      errorType = '🌐 Network Connection Error';
      troubleshooting = [
        'Check your internet connection',
        'Verify the backend URL is correct',
        'Try again in a few moments'
      ];
    } else if (errorMessage.includes('500')) {
      errorType = '🔧 Server Error';
      troubleshooting = [
        'Backend server is experiencing issues',
        'Check Vercel function logs',
        'Verify Claude API key is configured'
      ];
    } else if (errorMessage.includes('timeout')) {
      errorType = '⏱️ Request Timeout';
      troubleshooting = [
        'Request took too long to process',
        'Try with less data or simpler content',
        'Check server performance'
      ];
    } else if (errorMessage.includes('API key')) {
      errorType = '🔑 API Configuration Error';
      troubleshooting = [
        'Claude API key not configured',
        'Check environment variables in Vercel',
        'Verify API key has proper permissions'
      ];
    }
    
    resultsDiv.innerHTML = `
      <div class="astra-error">
        <h4>${errorType}</h4>
        <p><strong>Details:</strong> ${errorMessage}</p>
        <div class="astra-troubleshooting">
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            ${troubleshooting.map(item => '<li>' + item + '</li>').join('')}
          </ul>
        </div>
        <div class="astra-error-actions">
          <button class="astra-btn" onclick="this.closest('.astra-tab-content').querySelector('#run-ai-analysis-btn').click()">
            🔄 Try Again
          </button>
          <button class="astra-btn" onclick="console.log('Backend URL: ${this.backendUrl}')">
            🔍 Debug Info
          </button>
        </div>
      </div>
    `;
  }

  showMockAIAnalysis() {
    const mockResult = {
      analysis: `
        <div class="astra-ai-mock">
          <h4>🎯 Mock AI Analysis (Demo Mode)</h4>
          <p><strong>Note:</strong> This is simulated analysis data for demonstration purposes.</p>
          
          <h5>🎨 Visual Design Assessment</h5>
          <ul>
            <li><strong>Typography:</strong> Good font hierarchy detected. Consider increasing line-height for better readability.</li>
            <li><strong>Color Scheme:</strong> Adequate contrast ratios. Some secondary text could benefit from darker colors.</li>
            <li><strong>Spacing:</strong> Consistent margin/padding patterns. Minor inconsistencies in component spacing detected.</li>
          </ul>
          
          <h5>📱 Responsive Design</h5>
          <ul>
            <li>Layout adapts well to different screen sizes</li>
            <li>Text scales appropriately</li>
            <li>Interactive elements maintain proper touch targets</li>
          </ul>
          
          <h5>⚡ Performance Considerations</h5>
          <ul>
            <li>Optimize image sizes for better loading performance</li>
            <li>Consider lazy loading for below-the-fold content</li>
            <li>Minimize render-blocking resources</li>
          </ul>
          
          <p class="astra-mock-note">💡 To get real AI insights, configure your Claude API key in the backend.</p>
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
      url: window.location.href
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
}

// Initialize extension when DOM is ready
if (typeof window !== 'undefined') {
  new AstraExtension();
}