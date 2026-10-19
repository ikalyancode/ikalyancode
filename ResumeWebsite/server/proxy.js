import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());
app.use(cors());

// Simple health/help endpoint to make browser visits clearer (GET)
app.get('/api/ai-proxy', (req, res) => {
  res.json({ status: 'ok', message: 'POST JSON { message:string, model?:string } to this endpoint' });
});

const PORT = process.env.PORT || 8787;

app.post('/api/ai-proxy', async (req, res) => {
  const { message, model } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server API key not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({ model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (err) {
    console.error('proxy error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Local proxy listening on http://localhost:${PORT}/api/ai-proxy`));
