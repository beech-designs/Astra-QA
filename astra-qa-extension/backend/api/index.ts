import { VercelRequest, VercelResponse } from '@vercel/node';
import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'POST') {
        const { input } = req.body;

        try {
            const response = await client.completions.create({
                model: 'claude',
                prompt: input,
                max_tokens: 100,
            });

            res.status(200).json({ output: response.completion });
        } catch (error) {
            res.status(500).json({ error: 'Error processing request' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}