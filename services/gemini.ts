import { GoogleGenAI, GenerateContentResponse, Modality, Type, Chat } from "@google/genai";
import { fileToBase64 } from "../utils/helpers";

// --- INITIALIZATION ---
const initializeAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- AUDIO HELPERS ---
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- IMAGE SERVICES ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = initializeAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const analyzeImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    const ai = initializeAI();
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

export const editImage = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    const ai = initializeAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image was returned from the model.");
};


// --- VIDEO SERVICES ---
export const generateVideo = async (prompt: string, aspectRatio: "16:9" | "9:16", image?: { data: string, mimeType: string } | null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const requestPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    };
    if (image) {
        requestPayload.image = { imageBytes: image.data, mimeType: image.mimeType };
    }

    let operation = await ai.models.generateVideos(requestPayload);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or did not return a valid link.");
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const analyzeVideo = async (prompt: string, videoFile: File): Promise<string> => {
    const ai = initializeAI();
    const videoPart = {
      inlineData: {
        data: await fileToBase64(videoFile),
        mimeType: videoFile.type,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [videoPart, textPart] },
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    return response.text;
};

// --- GROUNDING SERVICES ---
export const runGroundingSearch = async (query: string, tool: 'googleSearch' | 'googleMaps'): Promise<{text: string, sources: any[]}> => {
    const ai = initializeAI();
    
    const config: any = { 
        tools: [{ [tool]: {} }],
    };
    
    if (tool === 'googleMaps') {
        config.toolConfig = {
            retrievalConfig: {
                latLng: await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }),
                        (error) => {
                            // Default to a central location if geolocation fails or is denied
                            console.warn(`Geolocation error: ${error.message}. Defaulting location.`);
                            resolve({ latitude: 37.7749, longitude: -122.4194 }); 
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                })
            }
        };
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config,
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};

// --- TEXT-TO-SPEECH SERVICE ---
export const generateSpeech = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const ai = initializeAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }

    return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
};

// --- CODE ASSISTANT SERVICE ---
export const runCodeAssistant = async (
    mode: 'generate' | 'explain' | 'debug' | 'translate',
    options: {
        prompt?: string;
        language?: string;
        sourceCode?: string;
        targetLanguage?: string;
    }
): Promise<string | { explanation: string, correctedCode: string }> => {
    const ai = initializeAI();
    let systemInstruction = "You are a world-class AI code assistant.";
    let userPrompt = "";
    let useJson = false;

    switch (mode) {
        case 'generate':
            systemInstruction = `You are a senior software engineer. Generate a code snippet in ${options.language}. Respond ONLY with the code block itself, without any explanation or markdown formatting.`;
            userPrompt = `Generate code for the following request: ${options.prompt}`;
            break;
        case 'explain':
            systemInstruction = "You are a helpful code assistant who explains code clearly and concisely.";
            userPrompt = `Explain the following code snippet step-by-step:\n\n\`\`\`${options.language || ''}\n${options.sourceCode}\n\`\`\``;
            break;
        case 'debug':
            systemInstruction = "You are an expert debugger. Find bugs, explain them, and provide a corrected version of the code.";
            userPrompt = `Find any bugs in the following code, explain them, and provide a corrected version:\n\n\`\`\`${options.language || ''}\n${options.sourceCode}\n\`\`\``;
            useJson = true;
            break;
        case 'translate':
            systemInstruction = `You are an expert code translator. Translate the following code from ${options.language} to ${options.targetLanguage}. Respond ONLY with the translated code block, without any explanation or markdown formatting.`;
            userPrompt = `Translate the following code:\n\n\`\`\`${options.language}\n${options.sourceCode}\n\`\`\``;
            break;
    }

    const config: any = {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
    };

    if (useJson) {
        config.responseMimeType = "application/json";
        config.responseSchema = {
            type: Type.OBJECT,
            properties: {
                explanation: {
                    type: Type.STRING,
                    description: "A detailed explanation of the bug(s) found in the code."
                },
                correctedCode: {
                    type: Type.STRING,
                    description: "The complete, corrected version of the code."
                }
            },
            required: ["explanation", "correctedCode"]
        };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config,
    });

    if (useJson) {
        return JSON.parse(response.text);
    }
    return response.text;
};
