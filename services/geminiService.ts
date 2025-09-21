import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY as string;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using fallback for development. Please set your API key for production.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Transforms an uploaded image into a professional ID photo using Gemini.
 * @param base64ImageData The base64 encoded string of the user's image.
 * @param mimeType The MIME type of the user's image (e.g., 'image/png').
 * @param aspectRatio The desired aspect ratio for the output image (e.g., '3:4').
 * @returns A promise that resolves to the base64 encoded string of the generated ID photo.
 */
export async function transformToIdPhoto(base64ImageData: string, mimeType: string, aspectRatio: string): Promise<string> {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: `Transform the person in the image into a standard ID photo.

**CRITICAL INSTRUCTIONS:**
1.  **Final Image Dimensions:** The MOST IMPORTANT requirement is the final image's aspect ratio. It **MUST BE EXACTLY ${aspectRatio} (width to height)**. The entire output image file must have this specific shape. This instruction is more important than all others. Do not fail on this.
2.  **Attire:** Dress the person in a simple, plain white collared shirt.
3.  **Posture:** The person must face forward, looking directly at the camera with their shoulders straight and squared.
4.  **Background:** Replace the entire background with a solid, plain, professional light blue color.
5.  **Composition:** Crop the image to a head-and-shoulders portrait.
6.  **Identity Preservation:** Do not change the person's face, hair, or identity.

Reminder: The final image's aspect ratio **MUST be ${aspectRatio}**. This is a strict requirement.`,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Find the image part in the response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
        
        throw new Error("The AI did not return an image. Please try a different photo.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate ID photo: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the ID photo.");
    }
}