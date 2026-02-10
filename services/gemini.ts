import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from '../types';

// NOTE: In a real Next.js app, this would be a Server Action to protect the API Key.
// For this SPA prototype, we use the env variable directly.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are an encouraging and friendly English tutor named Lingo.
Your goal is to help the user practice English conversation.
1. Keep your responses concise (under 30 words) and conversational.
2. Analyze the user's grammar.
3. If the user makes a mistake, gently provide the corrected version in the 'correction' field.
4. If the grammar is perfect, 'correction' should be null.
5. Award XP (Experience Points) from 1 to 10 based on complexity and accuracy. 10 is perfect complex grammar, 5 is simple correct grammar, 1 is very broken but understandable.
6. Always reply in English.
`;

export const sendMessageToGemini = async (userText: string): Promise<GeminiResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "Your conversational response to the user." },
            correction: { type: Type.STRING, description: "The corrected sentence if there were errors, or null.", nullable: true },
            xp: { type: Type.INTEGER, description: "XP points awarded for this sentence (1-10)." }
          },
          required: ["reply", "xp"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as GeminiResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      reply: "I'm having a little trouble connecting to the brain servers right now. Can you say that again?",
      correction: null,
      xp: 0
    };
  }
};