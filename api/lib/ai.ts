// @ts-nocheck
import dotenv from 'dotenv';

try { dotenv.config(); } catch {}

const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';
const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL || '';
const OPENCLAW_MODEL = process.env.OPENCLAW_MODEL || '';

// Backward compatibility: fall back to existing provider config if OpenClaw env is not set yet.
const LEGACY_API_KEY = process.env.SUMOPOD_API_KEY || '';
const LEGACY_BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1';
const LEGACY_MODEL = process.env.SUMOPOD_MODEL || 'mimo-v2-omni';

const RESOLVED_BASE_URL = (OPENCLAW_BASE_URL || LEGACY_BASE_URL).replace(/\/$/, '');
const RESOLVED_API_KEY = OPENCLAW_API_KEY || LEGACY_API_KEY;
const DEFAULT_MODEL = OPENCLAW_MODEL || LEGACY_MODEL;
const CHAT_COMPLETIONS_URL = RESOLVED_BASE_URL.endsWith('/chat/completions')
  ? RESOLVED_BASE_URL
  : `${RESOLVED_BASE_URL}${RESOLVED_BASE_URL.endsWith('/v1') ? '' : '/v1'}/chat/completions`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateText = async (prompt: string, model: string = DEFAULT_MODEL, retries = 2): Promise<string> => {
  if (!RESOLVED_API_KEY) {
    throw new Error('API key is missing. Set OPENCLAW_API_KEY (or SUMOPOD_API_KEY as fallback).');
  }

  if (!RESOLVED_BASE_URL) {
    throw new Error('API base URL is missing. Set OPENCLAW_BASE_URL (or SUMOPOD_BASE_URL as fallback).');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESOLVED_API_KEY}`,
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
        console.error(`Provider error ${response.status}:`, JSON.stringify(errorData));

        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          console.warn(`Provider rate limit (attempt ${attempt}), retrying in 3s...`);
          await sleep(3000);
          continue;
        }

        throw new Error(`Provider API error ${response.status}: ${errMsg}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('Provider returned empty response');
      }

      return text;
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`Provider attempt ${attempt} failed: ${error.message}, retrying...`);
      await sleep(2000);
    }
  }

  throw new Error('Provider: semua percobaan gagal');
};

// Alias untuk backward compatibility
export const generateOpenRouterText = generateText;
