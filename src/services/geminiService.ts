import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const geminiService = {
  async chat(message: string, history: any[] = []) {
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are a cool music assistant for VibeStation. You are helpful, nostalgic about the PSP era, and knowledgeable about music.",
      },
    });
    
    const response = await chat.sendMessage({ message });
    return response.text;
  },

  async fastResponse(prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  },

  async think(prompt: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  },

  async transcribe(audioData: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: "Transcribe this audio exactly." },
          { inlineData: { data: audioData, mimeType: "audio/wav" } }
        ]
      }
    });
    return response.text;
  },

  async searchMusic(query: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for song: "${query}". Return JSON with: title, artist, album, year, description, coverUrl, listenLink. 
      CRITICAL: The 'listenLink' MUST be a direct URL to an audio file (like .mp3, .m4a, .ogg) that an HTML5 <audio> tag can play. 
      STRATEGY: Search for the song on public domain sites, archive.org, wikimedia commons, or look for 'direct mp3 download' or 'cdn audio stream' links. 
      Avoid landing pages, YouTube, or Spotify. If you can't find a direct audio link, leave 'listenLink' as null.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            album: { type: Type.STRING },
            year: { type: Type.STRING },
            description: { type: Type.STRING },
            coverUrl: { type: Type.STRING },
            listenLink: { type: Type.STRING }
          },
          required: ["title", "artist"]
        }
      },
    });
    
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse search result", e);
      return null;
    }
  }
};

export const videoService = {
  async generateVideo(prompt: string) {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    return operation;
  },

  async pollOperation(operation: any) {
    const ai = getAI();
    return await ai.operations.getVideosOperation({ operation });
  }
};
