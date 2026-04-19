// @ts-nocheck
import dotenv from 'dotenv';

try { dotenv.config(); } catch {}

const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY || '';
const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1';
const DEFAULT_MODEL = process.env.SUMOPOD_MODEL || 'mimo-v2-omni';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateText = async (prompt: string, model: string = DEFAULT_MODEL, retries = 2): Promise<string> => {
  if (!SUMOPOD_API_KEY) {
    throw new Error('SumoPod API Key is missing. Set SUMOPOD_API_KEY in environment variables.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${SUMOPOD_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUMOPOD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || errorData?.message || response.statusText || '';
        console.error(`SumoPod error ${response.status}:`, JSON.stringify(errorData));

        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          console.warn(`SumoPod rate limit (attempt ${attempt}), retrying in 3s...`);
          await sleep(3000);
          continue;
        }

        throw new Error(`SumoPod API error ${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('SumoPod returned empty response');
      }

      return text;
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`SumoPod attempt ${attempt} failed: ${error.message}, retrying...`);
      await sleep(2000);
    }
  }

  throw new Error('SumoPod: semua percobaan gagal');
};

// Alias untuk backward compatibility
export const generateOpenRouterText = generateText;
