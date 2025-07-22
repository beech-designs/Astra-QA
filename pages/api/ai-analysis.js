// pages/api/ai-analysis.js
// Enhanced with Claude Vision API for screenshot analysis

export default async function handler(req, res) {
  // Add CORS headers for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { domStyles, accessibilityResults, url, screenshot, viewport, timestamp } = req.body;

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Determine if we have visual analysis capabilities
    const hasScreenshot = screenshot && screenshot.startsWith('data:image/');
    const analysisType = hasScreenshot ? 'Visual + Technical Analysis' : 'Technical Analysis Only';

    console.log(`Starting ${analysisType} for ${url}`);

    // Prepare comprehensive analysis prompt
    const basePrompt = `
You are an expert web developer, UI/UX designer, and accessibility consultant analyzing a website for overall quality and user experience.

Website URL: ${url}
Analysis Type: ${analysisType}
Timestamp: ${timestamp || new Date().toISOString()}
${viewport ? `Viewport: ${viewport.width}x${viewport.height}` : ''}

I have provided you with:
1. Complete DOM style analysis (computed CSS properties)
2. Accessibility audit results from axe-core
${hasScreenshot ? '3. Visual screenshot of the live website' : ''}

Please provide a comprehensive analysis covering:

**Overall Design Quality:**
${hasScreenshot ? `
- Visual hierarchy and layout effectiveness (analyze the screenshot)
- Typography implementation vs. computed styles
- Color usage and visual consistency
- Spacing and alignment accuracy
- Component placement and visual balance
` : `
- CSS architecture and style consistency
- Typography system implementation
- Color and spacing token usage
- Component styling patterns
`}

**User Experience Assessment:**
- Navigation clarity and accessibility
- Interactive element implementation
- Content organization and structure
${hasScreenshot ? '- Visual flow and information hierarchy from screenshot' : ''}
- Mobile responsiveness considerations

**Accessibility Evaluation:**
- Review axe-core findings and provide context
- Identify additional accessibility concerns from DOM structure
- Suggest WCAG compliance improvements
- Recommend semantic HTML enhancements
${hasScreenshot ? '- Visual accessibility assessment (contrast, readability)' : ''}

**Technical Implementation:**
- CSS architecture and maintainability
- Performance implications from computed styles
- Cross-browser compatibility considerations
- Design system opportunity identification

**Prioritized Recommendations:**
- 🔴 High-impact fixes for immediate attention
- 🟡 Medium-term improvements for better UX
- 🟢 Long-term strategic enhancements
- 💡 Specific implementation guidance with CSS examples

DOM Style Data (showing first 100 elements):
${JSON.stringify(domStyles?.slice(0, 100) || [], null, 2)}
${domStyles?.length > 100 ? `\n...(${domStyles.length - 100} more elements analyzed)` : ''}

Accessibility Results:
${JSON.stringify(accessibilityResults || {}, null, 2)}

${hasScreenshot ? 'Please analyze both the visual screenshot AND the technical data to provide comprehensive insights. Look for discrepancies between what the CSS should produce and what is actually visible.' : 'Focus on the technical implementation and provide recommendations for improvement based on the DOM and accessibility data.'}

Provide specific, actionable recommendations with implementation guidance.
`;

    // Prepare messages array for Claude API
    const messages = [];
    
    if (hasScreenshot) {
      // Extract base64 data from data URL
      const base64Data = screenshot.split(',')[1];
      const mimeType = screenshot.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      
      console.log(`Processing screenshot: ${mimeType}, ${Math.round(base64Data.length / 1024)}KB`);
      
      // Use Claude Vision API with both image and text
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Data
            }
          },
          {
            type: 'text',
            text: basePrompt
          }
        ]
      });
    } else {
      // Text-only analysis
      messages.push({
        role: 'user',
        content: basePrompt
      });
    }

    // Call Claude API
    console.log('Calling Claude API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Supports vision
        max_tokens: 4000,
        messages: messages
      })
    });

    const claudeResult = await response.json();
    
    if (!response.ok) {
      console.error('Claude API error:', claudeResult);
      throw new Error(`Claude API error: ${claudeResult.error?.message || 'Unknown error'}`);
    }

    const analysis = claudeResult.content[0].text;
    console.log(`Analysis completed: ${analysis.length} characters`);

    return res.status(200).json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString(),
      analysisType: analysisType,
      metadata: {
        domElementsAnalyzed: domStyles?.length || 0,
        accessibilityViolations: accessibilityResults?.violations?.length || 0,
        hasScreenshot: hasScreenshot,
        screenshotSize: hasScreenshot ? Math.round(screenshot.length / 1024) + 'KB' : null,
        url: url,
        viewport: viewport
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Determine error type for better user experience
    let userMessage = 'Failed to generate AI analysis';
    let statusCode = 500;
    
    if (error.message.includes('Claude API')) {
      userMessage = 'AI service temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      userMessage = 'Analysis timed out - try with a smaller screenshot';
      statusCode = 408;
    } else if (error.message.includes('payload')) {
      userMessage = 'Request too large - screenshot may be too big';
      statusCode = 413;
    }
    
    return res.status(statusCode).json({ 
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}