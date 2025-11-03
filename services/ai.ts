import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected import path
import { AICryptanalysisResult } from "../types";

/**
 * Initializes the Gemini API client.
 */
const initializeAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Calls the Gemini API to get a cipher suggestion based on a user's query.
 * @param query The user's request for a cipher.
 * @param ciphersList The list of available ciphers.
 * @returns A promise that resolves to the suggested cipher key and an explanation.
 */
export const getAIAdvisorSuggestion = async (query: string, ciphersList: any[]): Promise<{cipherKey: string, explanation: string}> => {
    const ai = initializeAI();
    const prompt = `You are a cryptography expert advising a user.
The user wants to find a cipher for a specific need.
Based on the user's request, suggest the single best cipher from the provided list.

Available Ciphers (JSON format):
${JSON.stringify(ciphersList, null, 2)}

User's Request: "${query}"

Your task:
1. Analyze the user's request.
2. Select the most appropriate cipher from the list. Consider the cipher's description, category, and complexity.
3. Provide a brief, friendly explanation for your choice.

Respond ONLY with a valid JSON object in the following format:
{
  "cipherKey": "the-key-of-the-suggested-cipher",
  "explanation": "Your user-friendly explanation of why this cipher is a good fit."
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    cipherKey: {
                        type: Type.STRING,
                        description: "The key of the suggested cipher, e.g., 'vigenere-cipher'."
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A user-friendly explanation for the suggestion."
                    }
                },
                required: ["cipherKey", "explanation"]
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });

    return JSON.parse(response.text);
};

/**
 * Calls the Gemini API to analyze a cipher processing error.
 * @param mode The current cipher mode ('encode' or 'decode').
 * @param cipherName The name of the cipher being used.
 * @param inputText The user's input text.
 * @param error The error message that occurred.
 * @returns A promise that resolves to an explanation and the segment of text that caused the error.
 */
export const getAIErrorAnalysis = async (mode: 'encode' | 'decode', cipherName: string, inputText: string, error: Error | string): Promise<{explanation: string, errorSegment: string}> => {
    const ai = initializeAI();
    const prompt = `The user encountered an error trying to ${mode} text with the "${cipherName}" cipher.

User Input: "${inputText}"
Error details: "${error instanceof Error ? error.message : String(error)}"

Analyze the user's input and the error. Provide a helpful, user-friendly explanation and a suggested fix.

Respond ONLY with a valid JSON object in the following format:
{
  "explanation": "A concise, friendly explanation of the problem and how to fix it.",
  "errorSegment": "The specific substring from the user's input that caused the error. If you cannot determine a specific segment, return an empty string."
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    explanation: {
                        type: Type.STRING,
                        description: "A concise, friendly explanation of the problem and how to fix it."
                    },
                    errorSegment: {
                        type: Type.STRING,
                        description: "The specific substring from the user's input that caused the error. If you cannot determine a specific segment, return an empty string."
                    }
                },
                required: ["explanation", "errorSegment"]
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });

    let analysis = { explanation: '', errorSegment: '' };
    try {
        analysis = JSON.parse(response.text);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON response:", parseError);
        analysis.explanation = response.text;
    }
    return analysis;
};


/**
 * Calls the Gemini API to perform cryptanalysis on a given ciphertext.
 * @param ciphertext The encrypted text to analyze.
 * @param ciphersList The list of all available ciphers in the app.
 * @returns A promise that resolves to a structured analysis result.
 */
export const getAICryptanalysis = async (ciphertext: string, ciphersList: any[]): Promise<AICryptanalysisResult> => {
    const ai = initializeAI();
    const prompt = `You are an expert cryptanalyst. Your task is to analyze the provided ciphertext and determine the encryption method used, then attempt to decrypt it. You must choose from the list of available ciphers.

Ciphertext: "${ciphertext}"

Available Ciphers (JSON format, with their keys and parameters):
${JSON.stringify(ciphersList.map(c => ({key: c.key, name: c.name, category: c.category, description: c.description, params: c.params?.map(p => p.key) || []})), null, 2)}

Your task:
1.  **Analyze:** Perform cryptanalysis on the ciphertext (e.g., frequency analysis, pattern recognition, Index of Coincidence).
2.  **Identify:** Based on your analysis, identify the most likely cipher used from the provided list. Some ciphers might be very simple (like Caesar), while others are complex (like Vigenère or Hill). The text could also be encoded (like Base64 or binary) rather than encrypted.
3.  **Decrypt:** Attempt to break the cipher and recover the original plaintext. If the cipher requires a key, try to find it.
4.  **Explain:** Detail your reasoning. Explain the clues in the ciphertext that led you to your conclusion.

Respond ONLY with a valid JSON object in the following format:
{
  "suspectedCipherKey": "the-key-of-the-most-likely-cipher",
  "confidence": "Your confidence level: 'High', 'Medium', 'Low', or 'Uncertain'",
  "reasoning": "A step-by-step explanation of your analysis and why you suspect this cipher.",
  "decryptedText": "Your best attempt at the decrypted plaintext. If you cannot decrypt, explain why.",
  "key": "The key you found, if applicable. Omit if not found or not applicable."
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suspectedCipherKey: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    decryptedText: { type: Type.STRING },
                    key: { type: Type.STRING },
                },
                required: ["suspectedCipherKey", "confidence", "reasoning", "decryptedText"]
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });

    return JSON.parse(response.text);
};
