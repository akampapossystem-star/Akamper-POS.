
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Product, OrderItem } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseOrderWithAI = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following customer order request and return it in JSON format. 
      Customer request: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: "Name of the customer if mentioned" },
            tableName: { type: Type.STRING, description: "Table number or name if mentioned" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Product name" },
                  quantity: { type: Type.NUMBER, description: "Quantity" }
                },
                required: ["name", "quantity"]
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return null;
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini Order Parse Error:", error);
    return null;
  }
};

export const getComplementarySuggestions = async (cartItems: OrderItem[], allProducts: Product[]) => {
  if (cartItems.length === 0) return [];
  const cartDescription = cartItems.map(i => i.product.name).join(", ");
  const menuDescription = allProducts
    .map(p => `${p.name} (Cat: ${p.category}, Stock: ${p.stock}, Popularity: ${p.popularity})`)
    .join("\n");

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a smart restaurant upselling assistant. 
        Current cart: [${cartDescription}].
        Full Menu Data:
        ${menuDescription}
        Suggest exactly 3 items from the Full Menu that meet these criteria.
        Return ONLY a JSON object with a 'suggestionNames' array containing the product names exactly as they appear in the menu.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestionNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The names of the suggested products exactly as they appear in the menu."
            }
          },
          required: ["suggestionNames"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return [];
    const parsed = JSON.parse(resultText);
    return (parsed.suggestionNames || [])
      .map((name: string) => allProducts.find(p => p.name.toLowerCase() === name.toLowerCase()))
      .filter((p: Product | undefined) => !!p && p.stock > 0) as Product[];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};

// --- CORE AI STUDIO FEATURES ---

export const editImageWithAI = async (base64Image: string, mimeType: string, prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Editing Error:", error);
    throw error;
  }
};

export const generateImageWithAI = async (prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { 
          aspectRatio: aspectRatio as any, 
          imageSize: imageSize as any 
        }
      }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const analyzeMediaWithAI = async (base64Media: string, mimeType: string, prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Media, mimeType } },
          { text: prompt }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Media Analysis Error:", error);
    throw error;
  }
};

export const complexQueryWithThinking = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Thinking Query Error:", error);
    throw error;
  }
};

export const searchGroundingWithAI = async (prompt: string, useMaps: boolean = false) => {
  try {
    const ai = getAI();
    const model = useMaps ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';
    const tools = useMaps ? [{ googleMaps: {} }] : [{ googleSearch: {} }];
    
    const config: any = { tools };

    if (useMaps && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }
          }
        };
      } catch (e) {
        console.warn("Geolocation access denied, proceeding without user location.");
      }
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Grounding Error:", error);
    throw error;
  }
};

export const animateImageWithVeo = async (base64Image: string, mimeType: string, prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Animate this photo with cinematic movement',
      image: { imageBytes: base64Image, mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Veo Animation Error:", error);
    throw error;
  }
};

export const generateVideoWithVeo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Veo Video Generation Error:", error);
    throw error;
  }
};

export const fastResponseWithAI = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Fast Response Error:", error);
    throw error;
  }
};

export const generateSpeechWithAI = async (text: string, voiceName: string = 'Kore') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      // Fixed: Wrapped parts in a single Content object for SDK compatibility
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw error;
  }
};

export const transcribeAudioWithAI = async (base64Audio: string, mimeType: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fixed: Wrapped parts in a single Content object to follow recommended structure
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Transcribe the following audio exactly." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
