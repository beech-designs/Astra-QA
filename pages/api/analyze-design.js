// Analyzes design screenshot vs DOM styles using Claude

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
    const { domStyles, designScreenshot, pageScreenshot, url } = req.body;

    // TODO: Replace with actual Claude API key
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    // Prepare the analysis prompt for Claude
    const prompt = `
You are an expert UI/UX designer and web developer analyzing a website for design consistency and quality. 

I have provided you with:
1. DOM style data extracted from the live website
2. A design screenshot (intended design)
3. The website URL: ${url}

Please analyze the following aspects:

**Design Consistency Analysis:**
- Compare the DOM styles against the visual design intent
- Identify spacing inconsistencies (margins, padding, gaps)
- Flag typography mismatches (font sizes, weights, line heights)
- Check color usage and brand consistency
- Evaluate layout alignment and positioning

**Visual Hierarchy Assessment:**
- Analyze the information hierarchy
- Check if important elements have proper visual weight
- Assess readability and scanability
- Evaluate button and interactive element styling

**Design System Compliance:**
- Look for inconsistent spacing tokens
- Identify non-standard font sizes or weights
- Flag inconsistent border radius, shadows, or effects
- Check for proper use of colors and contrast

**Recommendations:**
- Provide specific, actionable improvements
- Suggest design system tokens where applicable
- Recommend accessibility improvements
- Prioritize issues by impact

DOM Style Data:
${JSON.stringify(domStyles, null, 2)}

Please provide a structured analysis with specific recommendations for improvement.
`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Design analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze design',
      details: error.message 
    });
  }
}