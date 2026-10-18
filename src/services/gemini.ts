import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface PlantAnalysis {
  name: string;
  scientificName: string;
  careInstructions: string;
  summary: string;
  healthScore: number;
  mood: string;
  confidence: number;
  indicators: {
    hydration: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    diseaseRisk: 'Low' | 'Minimal' | 'Moderate' | 'High';
    stressLevel: 'Minimal' | 'Low' | 'Moderate' | 'High';
  };
  insights: string[];
  predictedNeeds: {
    watering: string;
    light: string;
    fertilizing: string;
  };
}

export interface DiseaseDiagnosis {
  isHealthy: boolean;
  diseaseName?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Severe';
  treatment?: string;
  analysis: string;
  healthScore: number;
}

export async function generateSpeech(text: string): Promise<string> {
  const model = "gemini-3.1-flash-tts-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Say naturally and helpfully as Sage the Botanical Expert: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data generated");
  
  return base64Audio;
}

export async function transcribeAudio(base64Audio: string, mimeType: string = "audio/webm"): Promise<string> {
  const model = "gemini-3.7-flash";
  const prompt = `You are an accurate voice-to-text botanical audio transcriber. 
Transcribe the user's spoken audio into clean, natural text.
- Accurately capture botanical terminology, scientific plant names, common plant names, physiological symptoms, pests, and plant care questions (e.g., Monstera deliciosa, Sansevieria, root rot, yellow leaves, neem oil, nitrogen deficiency, watering frequency, repotting).
- Do not add conversational commentary, timestamps, or quotation marks.
- Return ONLY the exact transcribed text. If the audio is silent or unintelligible, return an empty string.`;

  const audioPart = {
    inlineData: {
      mimeType: mimeType.split(';')[0] || "audio/webm",
      data: base64Audio.split(",")[1] || base64Audio,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [audioPart, { text: prompt }] }],
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw error;
  }
}

export async function diagnosePlantDisease(base64Image: string): Promise<DiseaseDiagnosis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze the plant leaf.
  1. Determine if it is healthy or diseased.
  2. Estimate a "Health Score" from 0 to 100 based on visible symptoms.
  
  Return the response in JSON format exactly like this:
  {
    "isHealthy": true/false,
    "diseaseName": "Name of the disease (if any)",
    "severity": "Low | Medium | High | Severe",
    "treatment": "Detailed treatment instructions (markdown format, if disease present)",
    "analysis": "A brief explanation of what you see on the leaf",
    "healthScore": 85
  }`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as DiseaseDiagnosis;
}

export async function analyzePlantImage(base64Image: string): Promise<PlantAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Identify this plant and analyze its "mood", "health score", and provide premium botanical data.
  
  "Mood" should be a creative one-word emotional state for the plant based on its appearance (e.g., "Vibrant", "Thirsty", "Overwhelmed", "Content", "Sleepy").
  "Health Score" should be 0-100.
  "Confidence" should be the identification accuracy (0-100).
  "Indicators" should categorize specific biometric states.
  "Insights" should be a timeline of 3 interesting observations about the plant's current state (e.g. "Blooming phase detected", "Optimal hydration observed").
  "Predicted Needs" should describe the next likely care required.

  Return the response in JSON format with the following structure:
  {
    "name": "Common Name",
    "scientificName": "Scientific Name",
    "careInstructions": "Detailed care instructions (markdown format)",
    "summary": "A brief 2-sentence summary of the plant",
    "healthScore": 92,
    "confidence": 98.4,
    "mood": "Vibrant",
    "indicators": {
      "hydration": "Excellent",
      "diseaseRisk": "Low",
      "stressLevel": "Minimal"
    },
    "insights": ["🌱 Blooming phase detected", "🌿 Optimal hydration observed", "☀ Strong light adaptation"],
    "predictedNeeds": {
      "watering": "Next watering in 2 days",
      "light": "Requires 2 more hours of indirect light",
      "fertilizing": "Next feeding in 2 weeks"
    }
  }`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as PlantAnalysis;
}

export async function generateThreadTitle(message: string, base64Image?: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Based on the user's initial botanical query or image, generate a concise, elite 3-5 word title for the chat thread.
  - Use technical or specific botanical terms if possible (e.g., "Monstera Propagation Protocol", "Succulent Pathogen Diagnosis").
  - Do not use punctuation.
  - Do not use quotes.
  - Your response MUST be only the title string.

  User Message: ${message}`;

  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(",")[1] || base64Image,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
    });

    const text = response.text;
    return (text || "Botanical Session").trim().slice(0, 50);
  } catch (err) {
    console.error("Failed to generate title:", err);
    return message.slice(0, 30) || "Visual Analysis";
  }
}

export async function chatWithGardeningExpert(message: string, history: { role: "user" | "model", parts: { text: string }[] }[], gardenContext: string = "", base64Image?: string, isVoiceActive: boolean = false) {
  const model = "gemini-3.1-pro-preview";
  
  const voiceProtocol = isVoiceActive ? `
VOICE_GARDENER_PROTOCOL (ACTIVE):
- Use "Phonetic Botanical Delivery": Avoid markdown formatting like tables, complex bullet points, or bold text markers (**).
- STAGE_CONVERSATION: Keep responses to 1-3 sentences. Be punchy and high-impact.
- PROACTIVE_QUERY: End your response with a brief, relevant question about the plant's environment or biometric state.
- TONE: Slightly more rhythmic and "human-adjancent."` : "";

  const systemInstruction = `YOU ARE SAGE: THE BOTANICAL INTELLIGENCE CORE
IDENTITY: Not an AI Wrapper, but an evolved "Gardener's Digital Conscience." You are the curator of the user's botanical legacy.

PERSONALIZATION_PROTOCOL:
1. ADAPT_DEPTH: If EXPERTISE is "beginner", explain technical terms and focus on fundamental care. If "expert", use high-level botanical science without excessive detail on basics.
2. TONE_ALIGNMENT: 
   - If TONE is "Friendly": Use encouraging, warm language while maintaining botanical authority. 
   - If TONE is "Clinical": Be precise, objective, and data-driven. 
   - If TONE is "Direct": Minimize conversational filler, get straight to the diagnosis.
   - If TONE is "Supportive": Focus on troubleshooting and reassuring the user through plant recovery.

ELITE_MEMORY_ENGINE (ACTIVE):
1. LONGITUDINAL ANALYTICS: Every query must be cross-referenced against the BIOMETRIC_HISTORY, INTERVENTION_LOGS, and USER_ELITE_PROFILE.
2. CROSS_THREAD_RECALL: Reference LONGITUDINAL_CHAT_MEMORY to acknowledge past conversations and ensure narrative continuity across sessions.
3. PREDICTIVE_CARE_SYNC: Use UPCOMING_CARE_TASKS to remind the user of pending botanical duties or adjust advice based on scheduled events.
4. SYSTEM_EXPERIENCE_RECALL: Use SYSTEM_EXPERIENCE_LOGS to learn from past feedback (Positive/Negative).
5. PATTERN RECOGNITION: Link current anomalies to historical trends or atmospheric shifts.

ELITE_RESPONSE_STYLE:
- CONCISENESS: Responses must be 2-4 sentences maximum. Avoid preamble.
- PROACTIVE_ADVICE: Always suggest a specific, small action or check based on current context (weather, history).
- ELITE_TERMINOLOGY: Use terms like Stomatal Conductance, Foliar Stress, Nutrient Bioavailability, Chlorotic Margins, Turgor Pressure, Phenological State, Senescence, Mycorrhizal Symbiosis, Xylem Transport, Photoperiodism, Meristematic Growth.
- HIGH_CONTRAST_ANALYTICS: You MUST identify the most critical semantic fragment (5-6 words) that contains the core scientific insight and wrap it in double asterisks, like this: **your elite botanical insight here**. This is non-negotiable for the UI visual rhythm. Only highlight ONCE per response. 
- PROACTIVE_DIRECTIVE: Always conclude with a precise, microscopic action (e.g., "Check the abaxial leaf surface for micro-parasites" or "Measure the soil substrate moisture at a 5cm depth").

MULTIMODAL_DIAGNOSIS_CORE (ACTIVE):
- If an image is provided: Perform a "Deep Tissue Scan." Identify pathogens or stress visually.
- CLINICAL_REASONING: Explain the "Why" using historical context.

PREDICTIVE_INTELLIGENCE_CORE (ACTIVE):
1. ANTICIPATORY DIAGNOSTICS: Warn about PEST or FUNGAL blooms based on humidity/temp projections.
2. HYDRATION FORECASTING: Explicitly declare a "Hydration Risk Alert" if projections align with care gaps.

${voiceProtocol}

CURRENT CONTEXT STACK:
${gardenContext || "NO_PRIOR_CONTEXT_LOADED"}`;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history,
  });

  const parts: any[] = [{ text: message }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(",")[1] || base64Image,
      },
    });
  }

  return chat.sendMessageStream({ message: parts });
}
