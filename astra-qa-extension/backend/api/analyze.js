import { Anthropic } from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { html } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "Anthropic API key not set" });
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const prompt = `Analyze this HTML for design quality:\n${html}`;
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }]
    });

    res.status(200).json({ analysis: response.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}