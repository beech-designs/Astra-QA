// pages/index.js
// Landing page for Astra Backend API

import React from 'react';
import Head from 'next/head';

export default function Home() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/analyze-design',
      description: 'Analyze design consistency using Claude AI',
      body: {
        domStyles: 'Array of DOM style objects',
        designScreenshot: 'Base64 encoded design image',
        pageScreenshot: 'Base64 encoded page screenshot',
        url: 'Website URL being analyzed'
      }
    },
    {
      method: 'POST',
      path: '/api/ai-analysis',
      description: 'Comprehensive AI analysis of website quality',
      body: {
        domStyles: 'Array of DOM style objects',
        accessibilityResults: 'axe-core audit results',
        url: 'Website URL being analyzed',
        screenshot: 'Optional design screenshot'
      }
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint',
      body: 'No body required'
    }
  ];

  const features = [
    {
      icon: '🎨',
      title: 'Design QA',
      description: 'AI-powered analysis of design consistency between intended design and live website implementation'
    },
    {
      icon: '♿',
      title: 'Accessibility Audit',
      description: 'Comprehensive accessibility validation using axe-core with WCAG compliance checking'
    },
    {
      icon: '🤖',
      title: 'AI Analysis',
      description: 'Claude-powered insights for UX quality, visual hierarchy, and technical implementation'
    },
    {
      icon: '🔧',
      title: 'DOM Extraction',
      description: 'Automatic extraction of computed styles, typography, spacing, and layout properties'
    },
    {
      icon: '📊',
      title: 'Structured Reports',
      description: 'Actionable recommendations with prioritized improvements and implementation guidance'
    }
  ];

  return (
    <>
      <Head>
        <title>Astra Backend API - AI Design & Accessibility Validation</title>
        <meta name="description" content="Backend API for Astra Chrome Extension - AI-powered design and accessibility validation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        lineHeight: '1.6',
        color: '#333',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '60px 40px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            margin: '0 0 16px 0'
          }}>
            🔍 Astra Backend API
          </h1>
          <p style={{
            fontSize: '1.25rem',
            margin: '0',
            opacity: '0.9'
          }}>
            AI-powered design and accessibility validation service
          </p>
        </header>

        {/* Features Grid */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#2d3748'
          }}>
            Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                background: '#f7fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '16px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#2d3748'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0',
                  fontSize: '0.95rem'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* API Endpoints */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#2d3748'
          }}>
            API Endpoints
          </h2>
          <div style={{
            display: 'grid',
            gap: '24px'
          }}>
            {endpoints.map((endpoint, index) => (
              <div key={index} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    background: endpoint.method === 'GET' ? '#48bb78' : '#4299e1',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginRight: '12px'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{
                    background: '#f7fafc',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    fontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
                  }}>
                    {endpoint.path}
                  </code>
                </div>
                <p style={{
                  margin: '0 0 16px 0',
                  color: '#4a5568'
                }}>
                  {endpoint.description}
                </p>
                {endpoint.body && typeof endpoint.body === 'object' && (
                  <div>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      color: '#2d3748'
                    }}>
                      Request Body:
                    </h4>
                    <pre style={{
                      background: '#f7fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      margin: '0'
                    }}>
                      {JSON.stringify(endpoint.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Usage Instructions */}
        <section style={{
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '24px',
            color: '#2d3748'
          }}>
            Usage
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: '#2d3748'
              }}>
                🔧 Chrome Extension
              </h3>
              <p style={{
                color: '#4a5568',
                margin: '0 0 16px 0'
              }}>
                This API is designed to work with the Astra Chrome Extension. Install the extension to start analyzing websites with AI-powered insights.
              </p>
              <ul style={{
                color: '#4a5568',
                paddingLeft: '20px'
              }}>
                <li>Automatic DOM style extraction</li>
                <li>Screenshot overlay comparison</li>
                <li>Real-time accessibility auditing</li>
                <li>AI-powered design analysis</li>
              </ul>
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: '#2d3748'
              }}>
                🤖 AI Integration
              </h3>
              <p style={{
                color: '#4a5568',
                margin: '0 0 16px 0'
              }}>
                Powered by Claude AI for intelligent analysis and actionable recommendations.
              </p>
              <ul style={{
                color: '#4a5568',
                paddingLeft: '20px'
              }}>
                <li>Design consistency validation</li>
                <li>Accessibility compliance checking</li>
                <li>UX quality assessment</li>
                <li>Technical implementation guidance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section style={{
          background: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#c53030'
          }}>
            ⚠️ Requirements
          </h2>
          <ul style={{
            color: '#742a2a',
            paddingLeft: '20px',
            margin: '0'
          }}>
            <li>Claude API key must be configured as environment variable</li>
            <li>CORS enabled for Chrome extension requests</li>
            <li>All requests must include proper Content-Type headers</li>
            <li>DOM style data should be properly formatted JSON</li>
          </ul>
        </section>

        {/* Status */}
        <section style={{
          background: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#276749'
          }}>
            ✅ Status
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            color: '#2f855a'
          }}>
            <div>
              <strong>✅ CORS:</strong> Enabled for Chrome extensions
            </div>
            <div>
              <strong>✅ API:</strong> All endpoints operational
            </div>
            <div>
              <strong>✅ AI:</strong> Claude integration ready
            </div>
            <div>
              <strong>✅ Health:</strong> Monitoring active
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '40px 0',
          borderTop: '1px solid #e2e8f0',
          color: '#718096'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            🔍 Astra Backend API - Powered by Claude AI
          </p>
          <p style={{ margin: '0', fontSize: '0.875rem' }}>
            Built for the Astra Chrome Extension - Version 1.0.0
          </p>
        </footer>
      </div>
    </>
  );
}