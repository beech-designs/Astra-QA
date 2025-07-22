// pages/index.js
// Landing page for Astra Backend API

import React from 'react';
import Head from 'next/head';

export default function Home() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/ai-analysis',
      description: 'Comprehensive AI analysis of website quality',
      body: {
        domStyles: 'Array of DOM style objects',
        accessibilityResults: 'axe-core audit results',
        url: 'Website URL being analyzed'
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
        <title>Astra API - AI Website Analysis Backend</title>
        <meta name="description" content="Backend API for Astra Chrome Extension - AI-powered website analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.6',
        color: '#2d3748',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '20px 0'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '32px' }}>🔍</span>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Astra API
              </h1>
            </div>
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              ✅ Service Active
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'white'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              margin: '0 0 24px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              AI-Powered Website Analysis
            </h2>
            <p style={{
              fontSize: '1.25rem',
              opacity: '0.9',
              margin: '0 0 40px 0',
              maxWidth: '600px',
              margin: '0 auto 40px auto'
            }}>
              Backend API for Astra Chrome Extension. Comprehensive accessibility auditing and AI-powered website analysis using Claude.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <a
                href="#api-endpoints"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                📚 View API Docs
              </a>
              <a
                href="#features"
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f8f9ff';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚡ Features
              </a>
            </div>
          </div>
        </section>

        <div style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          margin: '0',
          padding: '60px 24px'
        }}>
          {/* Features Section */}
          <section id="features" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '80px'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '60px',
              color: '#2d3748'
            }}>
              Capabilities
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px'
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    background: '#f7fafc',
                    padding: '32px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: '3rem',
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
                    margin: '0'
                  }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* API Endpoints */}
          <section id="api-endpoints" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '80px'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '60px',
              color: '#2d3748'
            }}>
              API Endpoints
            </h2>
            <div style={{
              display: 'grid',
              gap: '24px'
            }}>
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
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
                  <li>Load any website</li>
                  <li>Click the Astra extension icon or press Alt+A</li>
                  <li>Run accessibility audits with axe-core</li>
                  <li>Generate AI analysis reports</li>
                </ul>
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#2d3748'
                }}>
                  🛠️ Direct API Usage
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0 0 16px 0'
                }}>
                  Use the API endpoints directly in your applications for programmatic website analysis.
                </p>
                <pre style={{
                  background: '#2d3748',
                  color: '#e2e8f0',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {`// Example API call
fetch('/api/ai-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domStyles: [...],
    accessibilityResults: {...},
    url: 'https://example.com'
  })
})`}
                </pre>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '60px'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#c53030'
            }}>
              ⚙️ Configuration Required
            </h3>
            <p style={{
              color: '#742a2a',
              margin: '0 0 16px 0'
            }}>
              To use AI analysis features, configure the following environment variable:
            </p>
            <code style={{
              background: '#fed7d7',
              color: '#742a2a',
              padding: '8px 12px',
              borderRadius: '6px',
              display: 'block',
              fontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
            }}>
              CLAUDE_API_KEY=your_claude_api_key_here
            </code>
            <p style={{
              color: '#742a2a',
              margin: '16px 0 0 0',
              fontSize: '0.875rem'
            }}>
              Get your Claude API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{color: '#c53030', textDecoration: 'underline'}}>Anthropic Console</a>
            </p>
          </section>

          {/* Footer */}
          <footer style={{
            textAlign: 'center',
            padding: '40px 0',
            borderTop: '1px solid #e2e8f0',
            color: '#718096'
          }}>
            <p style={{ margin: '0' }}>
              🔍 Astra API - Powered by Claude AI & Next.js
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
              Built for accessibility and AI-powered website analysis
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}