// extension/content/content.js
class AstraQAContent {
  constructor() {
    this.issues = [];
    this.markers = [];
    this.analysisId = 0;
    this.tokenConfig = null;
    this.componentPatterns = null;
    this.aiEnabled = true;
    this.init();
  }

  async init() {
    await this.loadConfiguration();
    
    this.tokenAnalyzer = new TokenAnalyzer(this.tokenConfig);
    this.componentAnalyzer = new ComponentAnalyzer(this.componentPatterns);
    this.visualAnalyzer = new VisualAnalyzer();
    
    // Make instance globally available as astraQA
    window.astraQA = this;
    
    console.log('Astra QA Content Script initialized');
  }

  async loadConfiguration() {
    try {
      const result = await chrome.storage.sync.get([
        'tokenConfig', 
        'componentPatterns', 
        'aiEnabled',
        'analysisGoal',
        'focusAreas'
      ]);
      
      this.tokenConfig = result.tokenConfig || this.getDefaultTokenConfig();
      this.componentPatterns = result.componentPatterns || this.getDefaultComponentPatterns();
      this.aiEnabled = result.aiEnabled !== false;
      this.analysisGoal = result.analysisGoal || 'general_improvement';
      this.focusAreas = result.focusAreas || [];
    } catch (error) {
      console.error('Failed to load Astra QA configuration:', error);
      this.tokenConfig = this.getDefaultTokenConfig();
      this.componentPatterns = this.getDefaultComponentPatterns();
    }
  }

  getDefaultTokenConfig() {
    return {
      spacing: {
        "4": "4px", "8": "8px", "12": "12px", "16": "16px", "20": "20px",
        "24": "24px", "32": "32px", "40": "40px", "48": "48px", "64": "64px"
      },
      colors: {
        "primary-50": "#eff6ff", "primary-500": "#3b82f6", "primary-900": "#1e3a8a",
        "gray-50": "#f9fafb", "gray-500": "#6b7280", "gray-900": "#111827",
        "red-500": "#ef4444", "green-500": "#10b981"
      },
      typography: {
        "text-xs": { fontSize: "12px", lineHeight: "16px" },
        "text-sm": { fontSize: "14px", lineHeight: "20px" },
        "text-base": { fontSize: "16px", lineHeight: "24px" },
        "text-lg": { fontSize: "18px", lineHeight: "28px" }
      }
    };
  }

  getDefaultComponentPatterns() {
    return {
      button: {
        selectors: ['button', '.btn', '[role="button"]'],
        requiredAttributes: ['type'],
        classes: ['btn', 'button', 'btn-primary', 'btn-secondary'],
        accessibility: { focusable: true, hasAriaLabel: false }
      },
      input: {
        selectors: ['input', 'textarea', 'select'],
        requiredAttributes: ['id', 'name'],
        accessibility: { hasLabel: true, hasAriaDescribedBy: false }
      }
    };
  }

  async startAnalysis(options = {}) {
    console.log('Starting Astra QA analysis...');
    
    this.clearPreviousResults();
    this.analysisId++;
    
    const startTime = performance.now();
    
    try {
      // Run all analyzers
      const tokenIssues = await this.analyzeTokens();
      const componentIssues = await this.analyzeComponents();
      const visualIssues = await this.analyzeVisuals();
      
      this.issues = [...tokenIssues, ...componentIssues, ...visualIssues];
      
      // Create visual markers for basic issues
      this.createMarkers();
      
      const endTime = performance.now();
      
      // Capture page context for AI analysis
      const pageContext = {
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      const basicResults = {
        analysisId: this.analysisId,
        issues: this.issues,
        summary: this.generateSummary(),
        performance: {
          duration: Math.round(endTime - startTime),
          elementsAnalyzed: this.getAnalyzedElementCount()
        },
        screenshot: await this.captureScreenshot(),
        pageContext: pageContext
      };
      
      // Send basic results to background script
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_COMPLETE',
        data: basicResults
      });
      
      console.log(`Astra QA basic analysis complete: ${this.issues.length} issues found`);
      
      if (this.aiEnabled) {
        console.log('Astra QA AI analysis will be processed in background...');
      }
      
    } catch (error) {
      console.error('Astra QA analysis failed:', error);
    }
  }

  async analyzeTokens() {
    const issues = [];
    const elements = document.querySelectorAll('*');
    
    for (const element of elements) {
      if (this.shouldSkipElement(element)) continue;
      const elementIssues = this.tokenAnalyzer.analyze(element);
      issues.push(...elementIssues);
    }
    return issues;
  }

  async analyzeComponents() {
    const issues = [];
    const elements = document.querySelectorAll('button, input, textarea, select, [role]');
    
    for (const element of elements) {
      const elementIssues = this.componentAnalyzer.analyze(element);
      issues.push(...elementIssues);
    }
    return issues;
  }

  async analyzeVisuals() {
    // Visual analysis would be implemented here
    return [];
  }

  shouldSkipElement(element) {
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'meta', 'link', 'title'].includes(tagName)) {
      return true;
    }
    
    const computed = getComputedStyle(element);
    if (computed.display === 'none' || computed.visibility === 'hidden') {
      return true;
    }
    
    if (element.classList.contains('astra-qa-marker')) {
      return true;
    }
    
    return false;
  }

  createMarkers() {
    this.clearMarkers();
    
    this.issues.forEach((issue, index) => {
      if (issue.element && this.isElementVisible(issue.element)) {
        const marker = this.createAstraQAMarker(issue, index);
        document.body.appendChild(marker);
        this.markers.push(marker);
      }
    });
  }

  createAstraQAMarker(issue, index) {
    const rect = issue.element.getBoundingClientRect();
    const marker = document.createElement('div');
    marker.className = `astra-qa-marker astra-qa-marker--${issue.severity || 'medium'} astra-qa-marker--${issue.type}`;
    marker.dataset.issueId = index;
    marker.dataset.aiPriority = issue.aiPriority || 'unknown';
    
    const baseColor = this.getMarkerColor(issue.type);
    const priorityIntensity = this.getPriorityIntensity(issue.aiPriority);
    
    marker.style.cssText = `
      position: fixed;
      top: ${rect.top + window.scrollY - 10}px;
      left: ${rect.left + window.scrollX - 10}px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${baseColor};
      border: 3px solid white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      cursor: pointer;
      z-index: 999999;
      font-size: 11px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s ease;
      opacity: ${priorityIntensity};
      transform: scale(${0.8 + (priorityIntensity * 0.4)});
    `;
    
    if (issue.aiPriority === 'CRITICAL') {
      marker.style.animation = 'astra-qa-pulse-critical 2s infinite';
      marker.innerHTML = `<span style="font-size: 8px;">⚠</span>`;
    } else {
      marker.textContent = index + 1;
    }
    
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.highlightIssue(index);
      chrome.runtime.sendMessage({
        type: 'ISSUE_CLICKED',
        issueId: index,
        issue: issue
      });
    });
    
    return marker;
  }

  getMarkerColor(type) {
    const colors = {
      token: '#ef4444',
      component: '#f59e0b', 
      visual: '#3b82f6',
      accessibility: '#8b5cf6',
      ai_detected: '#10b981'
    };
    return colors[type] || '#6b7280';
  }

  getPriorityIntensity(aiPriority) {
    const intensities = {
      'CRITICAL': 1.0,
      'HIGH': 0.9,
      'MEDIUM': 0.7,
      'LOW': 0.5,
      'unknown': 0.6
    };
    return intensities[aiPriority] || 0.6;
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  highlightIssue(issueId) {
    const issue = this.issues[issueId];
    if (!issue || !issue.element) return;
    
    document.querySelectorAll('.astra-qa-highlight').forEach(el => {
      el.classList.remove('astra-qa-highlight');
    });
    
    issue.element.classList.add('astra-qa-highlight');
    issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
      issue.element.classList.remove('astra-qa-highlight');
    }, 3000);
  }

  async captureScreenshot() {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        scrollX: 0,
        scrollY: 0,
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  clearPreviousResults() {
    this.issues = [];
    this.clearMarkers();
    document.querySelectorAll('.astra-qa-highlight').forEach(el => {
      el.classList.remove('astra-qa-highlight');
    });
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
    this.markers = [];
  }

  generateSummary() {
    const summary = {
      total: this.issues.length,
      byType: {},
      bySeverity: {}
    };
    
    this.issues.forEach(issue => {
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
      summary.bySeverity[issue.severity || 'medium'] = (summary.bySeverity[issue.severity || 'medium'] || 0) + 1;
    });
    
    return summary;
  }

  getAnalyzedElementCount() {
    return document.querySelectorAll('*').length;
  }
}

// Token Analyzer Class
class TokenAnalyzer {
  constructor(tokenConfig) {
    this.config = tokenConfig || {};
  }

  analyze(element) {
    const issues = [];
    const computed = getComputedStyle(element);
    
    const spacingIssues = this.analyzeSpacing(element, computed);
    issues.push(...spacingIssues);
    
    const colorIssues = this.analyzeColors(element, computed);
    issues.push(...colorIssues);
    
    const typographyIssues = this.analyzeTypography(element, computed);
    issues.push(...typographyIssues);
    
    return issues;
  }

  analyzeSpacing(element, computed) {
    const issues = [];
    const spacingProperties = [
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
    ];
    
    spacingProperties.forEach(prop => {
      const value = computed[prop];
      if (value && value !== '0px' && !this.isValidSpacingToken(value)) {
        const suggested = this.findClosestSpacingToken(value);
        if (suggested) {
          issues.push({
            type: 'token',
            subtype: 'spacing',
            severity: 'medium',
            property: this.camelToKebab(prop),
            actual: value,
            suggested: suggested,
            element: element,
            message: `Non-standard spacing value: ${value}`,
            fix: `Use design token: ${suggested}`
          });
        }
      }
    });
    
    return issues;
  }

  analyzeColors(element, computed) {
    const issues = [];
    const colorProperties = ['color', 'backgroundColor', 'borderColor'];
    
    colorProperties.forEach(prop => {
      const value = computed[prop];
      if (value && value !== 'rgba(0, 0, 0, 0)' && !this.isValidColorToken(value)) {
        const suggested = this.findClosestColorToken(value);
        if (suggested) {
          issues.push({
            type: 'token',
            subtype: 'color',
            severity: 'medium',
            property: this.camelToKebab(prop),
            actual: value,
            suggested: suggested,
            element: element,
            message: `Non-standard color value: ${value}`,
            fix: `Use design token: ${suggested}`
          });
        }
      }
    });
    
    return issues;
  }

  analyzeTypography(element, computed) {
    const issues = [];
    
    const fontSize = computed.fontSize;
    const lineHeight = computed.lineHeight;
    
    if (!this.isValidTypographyToken(fontSize, lineHeight)) {
      const suggested = this.findClosestTypographyToken(fontSize, lineHeight);
      if (suggested) {
        issues.push({
          type: 'token',
          subtype: 'typography',
          severity: 'low',
          property: 'font-size',
          actual: `${fontSize} / ${lineHeight}`,
          suggested: suggested,
          element: element,
          message: `Non-standard typography values`,
          fix: `Use design token: ${suggested}`
        });
      }
    }
    
    return issues;
  }

  isValidSpacingToken(value) {
    return Object.values(this.config.spacing || {}).includes(value);
  }

  isValidColorToken(value) {
    const tokenColors = Object.values(this.config.colors || {});
    return tokenColors.some(tokenColor => this.colorsMatch(value, tokenColor));
  }

  isValidTypographyToken(fontSize, lineHeight) {
    return Object.values(this.config.typography || {}).some(token => 
      token.fontSize === fontSize && token.lineHeight === lineHeight
    );
  }

  findClosestSpacingToken(value) {
    const numValue = parseInt(value);
    const spacingValues = Object.entries(this.config.spacing || {});
    
    let closest = null;
    let closestDiff = Infinity;
    
    spacingValues.forEach(([key, tokenValue]) => {
      const tokenNum = parseInt(tokenValue);
      const diff = Math.abs(numValue - tokenNum);
      if (diff < closestDiff && diff <= 4) {
        closestDiff = diff;
        closest = tokenValue;
      }
    });
    
    return closest;
  }

  findClosestColorToken(value) {
    const rgb = this.parseColor(value);
    if (!rgb) return null;
    
    const colorEntries = Object.entries(this.config.colors || {});
    let closest = null;
    let closestDiff = Infinity;
    
    colorEntries.forEach(([key, tokenColor]) => {
      const tokenRgb = this.parseColor(tokenColor);
      if (tokenRgb) {
        const diff = this.colorDistance(rgb, tokenRgb);
        if (diff < closestDiff && diff < 50) {
          closestDiff = diff;
          closest = tokenColor;
        }
      }
    });
    
    return closest;
  }

  findClosestTypographyToken(fontSize, lineHeight) {
    const typographyEntries = Object.entries(this.config.typography || {});
    
    for (const [key, token] of typographyEntries) {
      if (token.fontSize === fontSize) {
        return `${key} (${token.fontSize}/${token.lineHeight})`;
      }
    }
    
    return null;
  }

  parseColor(color) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }
    
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    
    return null;
  }

  colorDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }

  colorsMatch(color1, color2) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    if (!rgb1 || !rgb2) return false;
    return this.colorDistance(rgb1, rgb2) < 10;
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// Component Analyzer Class  
class ComponentAnalyzer {
  constructor(componentPatterns) {
    this.patterns = componentPatterns || {};
  }

  analyze(element) {
    const issues = [];
    
    for (const [componentType, pattern] of Object.entries(this.patterns)) {
      if (this.matchesPattern(element, pattern)) {
        const componentIssues = this.validateComponent(element, componentType, pattern);
        issues.push(...componentIssues);
      }
    }
    
    return issues;
  }

  matchesPattern(element, pattern) {
    return pattern.selectors.some(selector => {
      if (selector.startsWith('.')) {
        return element.classList.contains(selector.slice(1));
      } else if (selector.startsWith('[')) {
        const attr = selector.match(/\[(.+?)(?:=|])/)[1];
        return element.hasAttribute(attr);
      } else {
        return element.tagName.toLowerCase() === selector;
      }
    });
  }

  validateComponent(element, componentType, pattern) {
    const issues = [];
    
    if (pattern.requiredAttributes) {
      pattern.requiredAttributes.forEach(attr => {
        if (!element.hasAttribute(attr)) {
          issues.push({
            type: 'component',
            subtype: 'attribute',
            severity: 'high',
            component: componentType,
            element: element,
            message: `Missing required attribute: ${attr}`,
            fix: `Add ${attr} attribute to ${componentType}`
          });
        }
      });
    }
    
    if (pattern.classes) {
      const hasDesignSystemClass = pattern.classes.some(cls => 
        element.classList.contains(cls)
      );
      
      if (!hasDesignSystemClass) {
        issues.push({
          type: 'component',
          subtype: 'class',
          severity: 'medium',
          component: componentType,
          element: element,
          message: `Element not using design system classes`,
          fix: `Use one of: ${pattern.classes.join(', ')}`
        });
      }
    }
    
    if (pattern.accessibility) {
      const accessibilityIssues = this.validateAccessibility(element, pattern.accessibility, componentType);
      issues.push(...accessibilityIssues);
    }
    
    return issues;
  }

  validateAccessibility(element, accessibilityRules, componentType) {
    const issues = [];
    
    if (accessibilityRules.focusable) {
      const tabIndex = element.getAttribute('tabindex');
      const isFocusable = element.matches('button, input, textarea, select, a[href]') || 
                         (tabIndex !== null && parseInt(tabIndex) >= 0);
      
      if (!isFocusable) {
        issues.push({
          type: 'component',
          subtype: 'accessibility',
          severity: 'high',
          component: componentType,
          element: element,
          message: `Element should be focusable`,
          fix: `Add tabindex="0" or use focusable element`
        });
      }
    }
    
    if (accessibilityRules.hasAriaLabel) {
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        issues.push({
          type: 'component',
          subtype: 'accessibility',
          severity: 'medium',
          component: componentType,
          element: element,
          message: `Missing aria-label or aria-labelledby`,
          fix: `Add aria-label or aria-labelledby attribute`
        });
      }
    }
    
    if (accessibilityRules.hasLabel && element.matches('input, textarea, select')) {
      const id = element.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      
      if (!hasLabel) {
        issues.push({
          type: 'component',
          subtype: 'accessibility',
          severity: 'high',
          component: componentType,
          element: element,
          message: `Form element missing associated label`,
          fix: `Add <label for="${id || 'element-id'}"> or wrap in <label>`
        });
      }
    }
    
    return issues;
  }
}

// Visual Analyzer Class (placeholder)
class VisualAnalyzer {
  constructor() {
    this.referenceImages = new Map();
  }

  async analyze(element) {
    return [];
  }

  async captureElement(element) {
    return await html2canvas(element, {
      useCORS: true,
      allowTaint: true
    });
  }

  compareWithReference(current, reference) {
    return {
      similarity: 1.0,
      differences: []
    };
  }
}

// Initialize Astra QA content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AstraQAContent();
  });
} else {
  new AstraQAContent();
}

// Add Astra QA-specific CSS animations
const astraQAStyle = document.createElement('style');
astraQAStyle.textContent = `
  @keyframes astra-qa-pulse-critical {
    0%, 100% {
      box-shadow: 0 2px 12px rgba(239, 68, 68, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.8);
      transform: scale(1.1);
    }
  }
  
  .astra-qa-marker--ai_detected {
    border-color: #10b981 !important;
  }
  
  .astra-qa-marker[data-ai-priority="CRITICAL"] {
    border-width: 4px !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) !important;
  }
  
  .astra-qa-highlight {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
    background: rgba(59, 130, 246, 0.1) !important;
    animation: astra-qa-pulse 2s ease-in-out !important;
  }

  @keyframes astra-qa-pulse {
    0%, 100% {
      outline-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    50% {
      outline-color: #1d4ed8;
      background: rgba(59, 130, 246, 0.2);
    }
  }
`;
document.head.appendChild(astraQAStyle);