import { GoogleGenAI } from "@google/genai";

// Vercel / Serverless function example.
// POST JSON { message: string, model?: string }
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, model } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server API key not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({ model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const response = await chat.sendMessage({ message });
    return res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error('ai-proxy error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
