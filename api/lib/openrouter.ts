// @ts-nocheck
import dotenv from 'dotenv';

// dotenv hanya untuk local dev, di Vercel env vars sudah tersedia langsung
try { dotenv.config(); } catch {}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'GenZTools';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateOpenRouterText = async (prompt: string, model: string, retries = 2): Promise<string> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key is missing');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": model,
          "messages": [
            { "role": "user", "content": prompt }
          ],
          "max_tokens": 4096,
          "temperature": 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || errorData?.message || response.statusText || '';

        console.error(`OpenRouter error ${response.status}:`, JSON.stringify(errorData));

        // Rate limit — tunggu lalu retry
        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          console.warn(`OpenRouter rate limit (attempt ${attempt}), retrying in 3s...`);
          await sleep(3000);
          continue;
        }

        throw new Error(`OpenRouter ${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('OpenRouter returned empty response');
      }

      return content;
    } catch (error: any) {
      // Retry on network errors
      if (attempt < retries && (error.message?.includes('fetch') || error.message?.includes('network'))) {
        console.warn(`OpenRouter network error (attempt ${attempt}), retrying...`);
        await sleep(2000);
        continue;
      }
      console.error('OpenRouter Generation Error:', error);
      throw error;
    }
  }

  throw new Error('OpenRouter: semua percobaan gagal');
};
