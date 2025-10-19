import { Product, Color, ImagePart } from "../types";
import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyBUdJCwzeSfEjTrmtNmetkA1MEebSH0ylw";
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to convert File to a Gemini Part
async function fileToGenerativePart(file: File): Promise<ImagePart> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

// Generates multiple floor plan variations from a text prompt.
export async function generateFloorPlanFromText(prompt: string): Promise<string[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: `Create 4 distinct architectural floor plan variations based on this description: "${prompt}". Present them as clean, black-and-white 2D architectural drawings. Do not include any text or labels.` }
                ],
            },
            config: {
                responseModalities: ["IMAGE" as any],
            },
        });

        const imageUrls: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                imageUrls.push(imageUrl);
            }
        }
        if (imageUrls.length === 0) {
            throw new Error("The model did not return any floor plan images from the text prompt.");
        }
        return imageUrls;

    } catch (e) {
        console.error("Error generating floor plans from text:", e);
        throw new Error("Failed to generate floor plans from your description. Please try again.");
    }
}


// Generates multiple floor plan variations from a user's sketch.
export async function generateFloorPlans(sketchImage: ImagePart): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          sketchImage,
          { text: "Create 4 distinct architectural floor plan variations from this sketch. Present them as clean, black-and-white 2D architectural drawings. Do not include any text or labels." }
        ],
      },
      config: {
        responseModalities: ["IMAGE" as any],
      },
    });

    const imageUrls: string[] = [];
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            imageUrls.push(imageUrl);
        }
    }
     if (imageUrls.length === 0) {
        throw new Error("The model did not return any floor plan images.");
    }
    return imageUrls;
  } catch (e) {
    console.error("Error generating floor plans:", e);
    throw new Error("Failed to generate floor plans. Please try again.");
  }
}

// Extracts room names from a selected floor plan.
export async function extractRoomNamesFromPlan(planImage: ImagePart): Promise<string[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    planImage,
                    { text: "Analyze this floor plan. List the names of all distinct rooms or areas (e.g., 'Master Bedroom', 'Living Room', 'Kitchen', 'Bathroom 1'). Return only a JSON array of strings. Example: [\"Living Room\", \"Kitchen\", \"Bedroom\"]" }
                ],
            },
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonText = response.text.trim();
        const rooms = JSON.parse(jsonText);
        if (Array.isArray(rooms) && rooms.every(r => typeof r === 'string')) {
            return rooms;
        }
        throw new Error("Invalid format for room names.");

    } catch (e) {
        console.error("Error extracting room names:", e);
        throw new Error("Could not identify rooms in the floor plan.");
    }
}

// Redesigns a specific room from a floor plan based on a style.
export async function redesignRoom(planImage: ImagePart, roomName: string, styleName: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    planImage,
                    { text: `From this floor plan, generate a photorealistic interior design render of the '${roomName}'. The style should be '${styleName}'. The image should be from a perspective view inside the room.` }
                ],
            },
            config: {
                responseModalities: ["IMAGE" as any],
            },
        });
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");

    } catch(e) {
        console.error(`Error redesigning room '${roomName}':`, e);
        throw new Error(`Failed to create a '${styleName}' design for the ${roomName}.`);
    }
}

// Finds and identifies products in a redesigned room image.
export async function findProductsInRoom(roomImage: ImagePart): Promise<Product[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    roomImage,
                    { text: "Analyze this image of a room. Identify distinct furniture and decor items. For each item, provide its name, a brief description, and a generic Google Shopping search URL for similar items. Return a JSON array of objects, where each object has 'name', 'description', and 'purchaseUrl' keys." }
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY" as any,
                    items: {
                        type: "OBJECT" as any,
                        properties: {
                            name: { type: "STRING" as any },
                            description: { type: "STRING" as any },
                            purchaseUrl: { type: "STRING" as any },
                        },
                        required: ["name", "description", "purchaseUrl"],
                    },
                },
            }
        });
        
        const jsonText = response.text.trim();
        // Handle cases where the model might return a string that is not valid JSON
        if (!jsonText.startsWith('[')) {
             throw new Error("Model returned invalid product data.");
        }
        const products = JSON.parse(jsonText);

        const productsWithImages: Product[] = [];
        for (const product of products) {
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        roomImage,
                        { text: `From the provided room image, create an image of only the '${product.name}' on a plain white background. The object should be isolated and cropped.`}
                    ]
                },
                config: {
                    responseModalities: ["IMAGE" as any],
                }
            });
            const part = imageResponse.candidates?.[0]?.content?.parts?.[0];
            let imageUrl = '';
            if (part?.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
            productsWithImages.push({ ...product, imageUrl });
        }
        return productsWithImages;
    } catch (e) {
        console.error("Error finding products:", e);
        throw new Error("Failed to identify products in the image.");
    }
}

// Generates a color palette from an image.
export async function generateColorPalette(imagePart: ImagePart): Promise<Color[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: "Extract the 5 most prominent colors from this image. For each color, provide a common name and its hex code. Return a JSON array of objects, where each object has 'name' (e.g., 'Dusty Rose') and 'hex' (e.g., '#D8B4B4') keys." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY" as any,
                    items: {
                        type: "OBJECT" as any,
                        properties: {
                            name: { type: "STRING" as any },
                            hex: { type: "STRING" as any },
                        },
                        required: ["name", "hex"],
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch(e) {
        console.error("Error generating color palette:", e);
        throw new Error("Failed to generate color palette.");
    }
}

// Generates a house exterior based on an interior design.
export async function generateHouseExterior(roomImage: ImagePart, roomStyle: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    roomImage,
                    { text: `The provided image is an interior design in the '${roomStyle}' style. Based on this interior, generate a photorealistic, architecturally beautiful exterior of a complete house in the same '${roomStyle}' style. The house should look like it belongs with this interior.` }
                ],
            },
            config: {
                responseModalities: ["IMAGE" as any],
            },
        });
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
        throw new Error("No house image was generated.");

    } catch(e) {
        console.error(`Error generating house exterior for style '${roomStyle}':`, e);
        throw new Error(`Failed to create a house exterior for the ${roomStyle} style.`);
    }
}


export const GeminiService = {
  fileToGenerativePart,
  generateFloorPlanFromText,
  generateFloorPlans,
  extractRoomNamesFromPlan,
  redesignRoom,
  findProductsInRoom,
  generateColorPalette,
  generateHouseExterior,
};