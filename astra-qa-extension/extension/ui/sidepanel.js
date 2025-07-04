class AstraQASidePanel {
  constructor() {
    this.currentResults = null;
    this.aiAnalysis = null;
    this.currentFilter = 'all';
    this.currentSort = 'priority';
    this.currentTabId = null;
    this.aiEnabled = true;
    this.aiSettings = {};
    this.isVercelDeployment = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.getCurrentTab();
    await this.loadAISettings();
    this.showWelcomeState();
    this.updateAIBadge();
    console.log('Astra QA Side Panel initialized');
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab?.id;
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  async loadAISettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AI_SETTINGS' });
      this.aiSettings = response;
      this.aiEnabled = response.aiEnabled;
      this.isVercelDeployment = response.isVercelDeployment;
      this.updateAIBadge();
      this.updateDeploymentUI();
    } catch (error) {
      console.error('Failed to load Astra QA settings:', error);
    }
  }

  setupEventListeners() {
    // Analysis controls
    document.getElementById('sidepanel-start-analysis')?.addEventListener('click', () => {
      this.startAnalysis();
    });

    // AI settings
    document.getElementById('sidepanel-ai-settings')?.addEventListener('click', () => {
      this.showAISettings();
    });

    // Filter and sort controls
    document.querySelectorAll('.sidepanel-filter').forEach(button => {
      button.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.type);
      });
    });

    document.getElementById('sidepanel-issue-sort')?.addEventListener('change', (e) => {
      this.setSort(e.target.value);
    });

    // Modal controls
    document.getElementById('sidepanel-close-modal')?.addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('sidepanel-close-ai-settings')?.addEventListener('click', () => {
      this.hideAISettings();
    });

    document.getElementById('sidepanel-save-ai-settings')?.addEventListener('click', () => {
      this.saveAISettings();
    });

    document.getElementById('sidepanel-test-ai-connection')?.addEventListener('click', () => {
      this.testAIConnection();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('sidepanel-modal')) {
        this.hideModal();
        this.hideAISettings();
      }
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'ANALYSIS_RESULTS':
        if (message.tabId === this.currentTabId) {
          this.displayBasicResults(message.data);
        }
        break;
      case 'AI_ANALYSIS_COMPLETE':
        if (message.tabId === this.currentTabId) {
          this.displayAIResults(message.data);
        }
        break;
      case 'AI_ANALYSIS_ERROR':
        if (message.tabId === this.currentTabId) {
          this.displayAIError(message.data);
        }
        break;
      case 'ISSUE_CLICKED':
        this.showIssueDetail(message.issue);
        break;
    }
  }

  async startAnalysis() {
    this.showLoadingState();
    this.updateLoadingStep('basic', true);

    try {
      await chrome.runtime.sendMessage({
        type: 'START_ANALYSIS',
        tabId: this.currentTabId,
        options: {
          aiEnabled: this.aiEnabled,
          analysisGoal: document.getElementById('sidepanel-analysis-goal')?.value || 'general_improvement'
        }
      });
    } catch (error) {
      console.error('Failed to start Astra QA analysis:', error);
      this.showError('Failed to start Astra QA analysis. Please refresh the page and try again.');
    }
  }

  displayBasicResults(results) {
    this.currentResults = results;
    this.showResultsState();

    // Update summary stats
    document.getElementById('sidepanel-total-issues').textContent = results.summary.total;
    document.getElementById('sidepanel-critical-issues').textContent = results.summary.bySeverity.high || 0;

    // Show basic analysis complete
    this.updateAIStatus('basic-complete');

    // Display screenshot
    if (results.screenshot) {
      document.getElementById('sidepanel-page-screenshot').src = results.screenshot;
    }

    // Render issues list
    this.renderIssuesList(results.issues);

    // If AI is enabled, show AI processing status
    if (this.aiEnabled) {
      this.updateLoadingStep('ai', true);
      this.updateAIStatus('ai-processing');
    } else {
      this.updateAIStatus('ai-disabled');
    }
  }

  displayAIResults(results) {
    this.currentResults = results;
    this.aiAnalysis = results.aiAnalysis;

    // Update AI score
    if (this.aiAnalysis?.overallScore) {
      document.getElementById('sidepanel-ai-score').textContent = this.aiAnalysis.overallScore.score.toFixed(1);
    }

    // Show AI analysis complete
    this.updateLoadingStep('ai', false, true);
    this.updateAIStatus('ai-complete');

    // Display AI insights
    this.displayAIInsights();

    // Re-render issues list with AI enhancements
    this.renderIssuesList(results.issues, true);

    console.log('Astra QA AI analysis complete:', this.aiAnalysis);
  }

  updateAIStatus(status, errorMessage = null) {
    const statusElement = document.getElementById('sidepanel-ai-status-indicator');
    if (!statusElement) return;

    switch (status) {
      case 'basic-complete':
        statusElement.innerHTML = `
          <span class="sidepanel-status-icon">⏳</span>
          <span>Waiting for Astra QA AI analysis...</span>
        `;
        break;
      case 'ai-processing':
        statusElement.innerHTML = `
          <div class="sidepanel-spinner-small"></div>
          <span>Astra QA analyzing insights...</span>
        `;
        break;
      case 'ai-complete':
        statusElement.innerHTML = `
          <span class="sidepanel-status-icon">✨</span>
          <span>Astra QA analysis complete</span>
        `;
        break;
      case 'ai-error':
        statusElement.innerHTML = `
          <span class="sidepanel-status-icon">❌</span>
          <span>Astra QA analysis failed: ${errorMessage || 'Unknown error'}</span>
        `;
        break;
      case 'ai-disabled':
        statusElement.innerHTML = `
          <span class="sidepanel-status-icon">⚪</span>
          <span>Astra QA AI analysis disabled</span>
        `;
        break;
    }
  }

  updateAIBadge() {
    const badge = document.getElementById('sidepanel-ai-status-badge');
    if (!badge) return;

    if (this.aiEnabled) {
      badge.style.opacity = '1';
      badge.title = 'Astra QA AI analysis enabled';
    } else {
      badge.style.opacity = '0.5';
      badge.title = 'Astra QA AI analysis disabled';
    }
  }

  updateDeploymentUI() {
    const deploymentIndicator = document.getElementById('sidepanel-deployment-indicator');
    if (deploymentIndicator) {
      if (this.isVercelDeployment) {
        deploymentIndicator.textContent = '⚡ Vercel';
        deploymentIndicator.className = 'sidepanel-deployment-badge sidepanel-deployment-vercel';
      } else {
        deploymentIndicator.textContent = '🖥️ Local';
        deploymentIndicator.className = 'sidepanel-deployment-badge sidepanel-deployment-local';
      }
    }
  }

  showWelcomeState() {
    this.hideAllStates();
    document.getElementById('sidepanel-welcome-state').classList.remove('hidden');
  }

  showLoadingState() {
    this.hideAllStates();
    document.getElementById('sidepanel-loading-state').classList.remove('hidden');
  }

  showResultsState() {
    this.hideAllStates();
    document.getElementById('sidepanel-results-state').classList.remove('hidden');
  }

  hideAllStates() {
    document.getElementById('sidepanel-welcome-state').classList.add('hidden');
    document.getElementById('sidepanel-loading-state').classList.add('hidden');
    document.getElementById('sidepanel-results-state').classList.add('hidden');
  }

  showModal() {
    document.getElementById('sidepanel-issue-detail-modal').classList.remove('hidden');
  }

  hideModal() {
    document.getElementById('sidepanel-issue-detail-modal').classList.add('hidden');
  }

  showAISettings() {
    document.getElementById('sidepanel-ai-settings-modal').classList.remove('hidden');
  }

  hideAISettings() {
    document.getElementById('sidepanel-ai-settings-modal').classList.add('hidden');
  }

  renderIssuesList(issues) {
    const container = document.getElementById('sidepanel-issues-list');
    const filteredIssues = this.filterIssues(issues);

    if (filteredIssues.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    container.innerHTML = filteredIssues.map((issue, index) =>
      this.getIssueItemHTML(issue, index)
    ).join('');
  }

  filterIssues(issues) {
    if (this.currentFilter === 'all') {
      return issues;
    }
    return issues.filter(issue => issue.type === this.currentFilter);
  }

  getIssueItemHTML(issue, index) {
    const markerColor = this.getMarkerColor(issue.type);
    const severityClass = `sidepanel-issue-severity--${issue.severity || 'medium'}`;

    return `
      <div class="sidepanel-issue-item" data-issue-index="${index}">
        <div class="sidepanel-issue-marker sidepanel-issue-marker--${issue.type}" style="background: ${markerColor}">
          ${index + 1}
        </div>
        <div class="sidepanel-issue-content ${severityClass}">
          <div class="sidepanel-issue-title">${issue.title || 'Untitled Issue'}</div>
          <div class="sidepanel-issue-description">${issue.description || ''}</div>
          <div class="sidepanel-issue-meta">
            <span class="sidepanel-issue-type">${issue.type}</span>
            <span class="sidepanel-issue-severity">${issue.severity || 'medium'}</span>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize Astra QA side panel
document.addEventListener('DOMContentLoaded', () => {
  new AstraQASidePanel();
});