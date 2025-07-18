// Comprehensive AI analysis combining DOM, accessibility, and design data

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
    const { domStyles, accessibilityResults, url, screenshot } = req.body;

    // TODO: Replace with actual Claude API key
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Prepare comprehensive analysis prompt
    const prompt = `
You are an expert web developer, UI/UX designer, and accessibility consultant analyzing a website for overall quality and user experience.

Website URL: ${url}

I have provided you with:
1. Complete DOM style analysis
2. Accessibility audit results from axe-core
3. Optional design screenshot for reference

Please provide a comprehensive analysis covering:

**Overall Design Quality:**
- Visual hierarchy and information architecture
- Typography consistency and readability
- Color usage and brand consistency
- Layout effectiveness and responsiveness
- Visual balance and composition

**User Experience Assessment:**
- Navigation clarity and usability
- Interactive element accessibility
- Content organization and flow
- Mobile responsiveness considerations
- Performance implications from CSS usage

**Accessibility Evaluation:**
- Review axe-core findings and provide context
- Identify additional accessibility concerns
- Suggest WCAG compliance improvements
- Recommend semantic HTML enhancements

**Technical Implementation:**
- CSS architecture and maintainability
- Design system opportunity identification
- Performance optimization suggestions
- Cross-browser compatibility considerations

**Prioritized Recommendations:**
- High-impact fixes for immediate attention
- Medium-term improvements for better UX
- Long-term strategic enhancements
- Specific implementation guidance

DOM Style Data:
${JSON.stringify(domStyles?.slice(0, 100), null, 2)} ${domStyles?.length > 100 ? '...(truncated)' : ''}

Accessibility Results:
${JSON.stringify(accessibilityResults, null, 2)}

Please provide actionable, specific recommendations with implementation guidance.
`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const claudeResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${claudeResult.error?.message || 'Unknown error'}`);
    }

    const analysis = claudeResult.content[0].text;

    return res.status(200).json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString(),
      metadata: {
        domElementsAnalyzed: domStyles?.length || 0,
        accessibilityViolations: accessibilityResults?.violations?.length || 0,
        url: url
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate AI analysis',
      details: error.message 
    });
  }
}