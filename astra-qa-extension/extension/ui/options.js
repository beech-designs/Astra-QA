class DesignQAOptions {
  constructor() {
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
  }

  setupEventListeners() {
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    document.getElementById('export-settings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('import-settings-btn').addEventListener('click', () => {
      document.getElementById('import-settings').click();
    });

    document.getElementById('import-settings').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['tokenConfig', 'componentPatterns']);
      
      const tokenConfig = result.tokenConfig || this.getDefaultTokenConfig();
      const componentPatterns = result.componentPatterns || this.getDefaultComponentPatterns();
      
      document.getElementById('token-config').value = JSON.stringify(tokenConfig, null, 2);
      document.getElementById('component-patterns').value = JSON.stringify(componentPatterns, null, 2);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showError('Failed to load settings');
    }
  }

  async saveSettings() {
    try {
      const tokenConfigText = document.getElementById('token-config').value;
      const componentPatternsText = document.getElementById('component-patterns').value;
      
      // Validate JSON
      const tokenConfig = JSON.parse(tokenConfigText);
      const componentPatterns = JSON.parse(componentPatternsText);
      
      // Save to storage
      await chrome.storage.sync.set({
        tokenConfig,
        componentPatterns
      });
      
      this.showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Error saving settings. Please check your JSON format.');
    }
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      const tokenConfig = this.getDefaultTokenConfig();
      const componentPatterns = this.getDefaultComponentPatterns();
      
      document.getElementById('token-config').value = JSON.stringify(tokenConfig, null, 2);
      document.getElementById('component-patterns').value = JSON.stringify(componentPatterns, null, 2);
    }
  }

  exportSettings() {
    try {
      const tokenConfig = JSON.parse(document.getElementById('token-config').value);
      const componentPatterns = JSON.parse(document.getElementById('component-patterns').value);
      
      const settings = {
        tokenConfig,
        componentPatterns,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'design-qa-settings.json';
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showError('Failed to export settings. Please check your JSON format.');
    }
  }

  importSettings(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
        if (settings.tokenConfig) {
          document.getElementById('token-config').value = JSON.stringify(settings.tokenConfig, null, 2);
        }
        
        if (settings.componentPatterns) {
          document.getElementById('component-patterns').value = JSON.stringify(settings.componentPatterns, null, 2);
        }
        
        this.showSuccess('Settings imported successfully!');
      } catch (error) {
        console.error('Failed to import settings:', error);
        this.showError('Failed to import settings. Invalid JSON file.');
      }
    };
    
    reader.readAsText(file);
  }

  getDefaultTokenConfig() {
    return {
      spacing: {
        "4": "4px",
        "8": "8px",
        "12": "12px", 
        "16": "16px",
        "20": "20px",
        "24": "24px",
        "32": "32px",
        "40": "40px",
        "48": "48px",
        "64": "64px"
      },
      colors: {
        "primary-50": "#eff6ff",
        "primary-500": "#3b82f6",
        "primary-900": "#1e3a8a",
        "gray-50": "#f9fafb",
        "gray-500": "#6b7280",
        "gray-900": "#111827",
        "red-500": "#ef4444",
        "green-500": "#10b981"
      },
      typography: {
        "text-xs": { fontSize: "12px", lineHeight: "16px" },
        "text-sm": { fontSize: "14px", lineHeight: "20px" },
        "text-base": { fontSize: "16px", lineHeight: "24px" },
        "text-lg": { fontSize: "18px", lineHeight: "28px" },
        "text-xl": { fontSize: "20px", lineHeight: "28px" },
        "text-2xl": { fontSize: "24px", lineHeight: "32px" }
      }
    };
  }

  getDefaultComponentPatterns() {
    return {
      button: {
        selectors: ['button', '.btn', '[role="button"]'],
        requiredAttributes: ['type'],
        classes: ['btn', 'button', 'btn-primary', 'btn-secondary'],
        accessibility: {
          focusable: true,
          hasAriaLabel: false
        }
      },
      input: {
        selectors: ['input', 'textarea', 'select'],
        requiredAttributes: ['id', 'name'],
        accessibility: {
          hasLabel: true,
          hasAriaDescribedBy: false
        }
      }
    };
  }

  showSuccess(message) {
    const element = document.getElementById('success-message');
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }

  showError(message) {
    const element = document.getElementById('error-message'); 
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  new DesignQAOptions();
});