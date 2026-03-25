import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  
  // 1. List models via REST API
  try {
    console.log("Fetching available models...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach((m: any) => {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name} (${m.displayName})`);
      }
    });
  } catch (error: any) {
    console.error("Failed to list models:", error.message);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: accessing the model directly to test
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Test");
    console.log("gemini-pro works:", result.response.text());
  } catch (error: any) {
    console.error("gemini-pro failed:", error.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Test");
    console.log("gemini-flash-latest works:", result.response.text());
  } catch (error: any) {
    console.error("gemini-flash-latest failed:", error.message);
  }
}

listModels();
