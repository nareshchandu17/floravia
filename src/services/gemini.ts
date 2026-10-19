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
  const response = await fetch('/api/gemini/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to synthesize speech on server.');
  }

  const data = await response.json();
  return data.audio;
}

export async function transcribeAudio(base64Audio: string, mimeType: string = "audio/webm"): Promise<string> {
  const response = await fetch('/api/gemini/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: base64Audio, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to transcribe audio on server.');
  }

  const data = await response.json();
  return data.text || '';
}

export async function diagnosePlantDisease(base64Image: string): Promise<DiseaseDiagnosis> {
  const response = await fetch('/api/gemini/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to diagnose plant disease on server.');
  }

  return response.json() as Promise<DiseaseDiagnosis>;
}

export async function analyzePlantImage(base64Image: string): Promise<PlantAnalysis> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze plant image on server.');
  }

  return response.json() as Promise<PlantAnalysis>;
}

export async function generateThreadTitle(message: string, base64Image?: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, image: base64Image }),
    });

    if (!response.ok) {
      return message.slice(0, 30) || 'Visual Analysis';
    }

    const data = await response.json();
    return (data.title || 'Botanical Session').trim().slice(0, 50);
  } catch (err) {
    console.error('Failed to generate title:', err);
    return message.slice(0, 30) || 'Visual Analysis';
  }
}

export async function* chatWithGardeningExpert(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  gardenContext: string = '',
  base64Image?: string,
  isVoiceActive: boolean = false
): AsyncGenerator<{ text: string }> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      gardenContext,
      image: base64Image,
      isVoiceActive,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Chat service temporarily unavailable on server.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream returned from chat endpoint.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') return;

      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          yield { text: parsed.text };
        }
      } catch (e: any) {
        if (e.message && e.message !== 'Unexpected end of JSON input') {
          throw e;
        }
      }
    }
  }
}
