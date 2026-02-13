import { GoogleGenAI, Type } from "@google/genai";
import { Product, OrderItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseOrderWithAI = async (text: string) => {
  try {
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

/**
 * Suggests complementary products based on items in the cart, stock levels, and popularity.
 */
export const getComplementarySuggestions = async (cartItems: OrderItem[], allProducts: Product[]) => {
  if (cartItems.length === 0) return [];

  const cartDescription = cartItems.map(i => i.product.name).join(", ");
  // Provide full context: Name, Category, Stock, Popularity
  const menuDescription = allProducts
    .map(p => `${p.name} (Cat: ${p.category}, Stock: ${p.stock}, Popularity: ${p.popularity})`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a smart restaurant upselling assistant. 
        Current cart: [${cartDescription}].
        Full Menu Data:
        ${menuDescription}
        
        Rules for suggesting items:
        1. Relevance: Items must pair well with the current cart (e.g., drinks for food, sides for mains).
        2. Stock Awareness: Never suggest items with Stock <= 0. Prefer items with higher stock.
        3. Popularity: Prefer items with higher Popularity scores if they are relevant.
        4. No Duplicates: Do not suggest items already in the cart.
        
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
    
    // Map names back to actual product objects from the menu
    return (parsed.suggestionNames || [])
      .map((name: string) => allProducts.find(p => p.name.toLowerCase() === name.toLowerCase()))
      .filter((p: Product | undefined) => !!p && p.stock > 0) as Product[];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};