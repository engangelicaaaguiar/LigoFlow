
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, CEFRLevel, GeminiContext } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// PERFORMANCE CONFIGURATION
// using gemini-3-flash-preview as the modern "Flash" equivalent for low latency
const MODEL_NAME = 'gemini-3-flash-preview'; 
const MAX_RETRIES = 2; // Reduced retries to fail fast

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getSystemInstruction = (ctx: GeminiContext) => {
  const { targetLevel, flowState, topic, userVocabularySize, userPastTopics } = ctx;
  const { currentMode, comboCount } = flowState;

  // 1. Base Pedagogy (CEFR)
  const pedagogies: Record<string, string> = {
    'A1': `Basic & Clear. Simple sentences.`,
    'A2': `Connector Style. Connect simple phrases ("and", "but").`,
    'B1': `Independent. Moderate speed. Express opinions.`,
    'B2': `Fluent Operational. Abstract themes. No hesitation allowed.`,
    'C1': `Strategist. Fast, nuanced, ironic.`,
    'C2': `Master. Native cultural references & advanced rhetoric.`,
  };

  // 2. DDA: Personality Injection based on Mode
  let ddaInstruction = "";
  if (currentMode === 'FIRE') {
    ddaInstruction = `
    [MODE: CHALLENGE / FIRE]
    - The user is ON FIRE (Combo: ${comboCount}). 
    - Increase speaking rate.
    - Be provocative. Challenge their opinion.
    `;
  } else if (currentMode === 'ZEN') {
    ddaInstruction = `
    [MODE: SUPPORT / ZEN]
    - The user is struggling.
    - Speak slower and more clearly.
    - Provide a HINT.
    `;
  } else {
    ddaInstruction = `[MODE: STANDARD] Maintain a balanced, helpful tutor persona.`;
  }

  // 3. User Memory & Context (The "Repository" Data)
  const contextInstruction = `
  [USER CONTEXT - "ACTIVE MEMORY"]
  - Unique Vocabulary Size: ${userVocabularySize} words.
  - Previous Interest Topics: ${userPastTopics.length > 0 ? userPastTopics.join(', ') : 'None yet'}.
  - INSTRUCTION: If the current topic relates to their Previous Interests, make a brief reference to connect the dots.
  - INSTRUCTION: If vocabulary size is < 500, use very frequent words. If > 2000, use synonyms.
  `;

  // 4. Topic Weaving & Soft Landing
  const weavingInstruction = `
  [TOPIC WEAVING - "${topic}"]
  - Connect the user's last answer to a new related sub-topic organically.
  - Keep conversation flowing.
  `;

  return `
Role: Strict English Tutor.
Target Level: ${targetLevel}.
${ddaInstruction}
${contextInstruction}
${weavingInstruction}
PEDAGOGY: ${pedagogies[targetLevel] || pedagogies['A1']}

OUTPUT (JSON):
- grammarScore, phoneticsScore, finalScore (0-10)
- correction (string|null)
- explanation (short string|null)
- reply (string) - MAX 30 WORDS. Concise and engaging.
- wordCount (int)

RULES:
1. **Score < 10**: FAIL. 'reply' MUST ask to repeat/correct.
2. **Score 10**: PASS. 'reply' continues conversation.
3. KEEP REPLIES SHORT. Speed is priority.
`;
};

export const sendMessageToGemini = async (
  text: string, 
  context: GeminiContext
): Promise<GeminiResponse> => {
  
  const systemInstruction = getSystemInstruction(context);
  // Payload Optimization: We strictly send only the current turn to minimize input tokens
  const prompt = `User Input: "${text}"`;
  const parts: any[] = [{ text: prompt }];

  // Exponential Backoff Loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
          // OPTIMIZATION 3: "Flash Turbo"
          // Limit output to 150 tokens for sub-2s generation
          maxOutputTokens: 150, 
          // Disable "Thinking" to ensure raw speed (Gemini 3 specific)
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              grammarScore: { type: Type.INTEGER },
              phoneticsScore: { type: Type.INTEGER },
              finalScore: { type: Type.INTEGER },
              correction: { type: Type.STRING, nullable: true },
              explanation: { type: Type.STRING, nullable: true },
              reply: { type: Type.STRING },
              wordCount: { type: Type.INTEGER }
            },
            required: ["grammarScore", "phoneticsScore", "finalScore", "reply", "wordCount"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response");
      
      const data = JSON.parse(responseText);

      return {
        reply: data.reply,
        assessment: {
          grammarScore: data.grammarScore,
          phoneticsScore: data.phoneticsScore,
          finalScore: data.finalScore,
          correction: data.correction,
          explanation: data.explanation,
          isPerfect: data.finalScore === 10,
          wordCount: data.wordCount
        }
      };

    } catch (error: any) {
      const isRetryable = 
        error.status === 503 || 
        error.status === 429 || 
        (error.message && (error.message.includes('503') || error.message.includes('429')));

      if (isRetryable && attempt < MAX_RETRIES) {
        const waitTime = 1000 * Math.pow(2, attempt);
        console.warn(`⚠️ Gemini High Demand. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      console.error("❌ Gemini Fatal Error:", error);
      break; 
    }
  }
  
  // Failover
  return {
    reply: "I'm having a little trouble hearing you. Can you say that again?",
    assessment: {
      grammarScore: 10, 
      phoneticsScore: 10,
      finalScore: 10,
      correction: "N/A",
      explanation: "Connection instability.",
      isPerfect: true,
      wordCount: 0
    }
  };
};
