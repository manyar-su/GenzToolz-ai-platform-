import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
  }
});
