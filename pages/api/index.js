// pages/index.js
// Simple landing page for the API

import React from 'react';

export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto' 
    }}>
      <h1>🔍 Astra Backend API</h1>
      <p>Backend service for the Astra Chrome Extension - AI-powered design and accessibility validation.</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>POST /api/analyze-design</strong> - Analyze design consistency using Claude</li>
        <li><strong>POST /api/ai-analysis</strong> - Comprehensive AI analysis of website quality</li>
        <li><strong>GET /api/health</strong> - Health check endpoint</li>
      </ul>
      
      <h2>Usage:</h2>
      <p>This API is designed to be used with the Astra Chrome Extension. Install the extension to start analyzing websites with AI-powered insights.</p>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px' 
      }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ DOM style extraction and analysis</li>
          <li>✅ Accessibility audit integration</li>
          <li>✅ Claude AI-powered insights</li>
          <li>✅ Design screenshot comparison</li>
          <li>✅ Actionable recommendations</li>
        </ul>
      </div>
    </div>
  );
}