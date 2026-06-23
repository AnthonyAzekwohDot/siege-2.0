import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { FOOD_DATABASE, findFood, calculateNutrition } from "@/lib/food-database";
import { sameOriginGuard, rejectByContentLength, MAX_IMAGE_BYTES } from "@/lib/api-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DetectedFoodItem, PhotoAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  const blocked = sameOriginGuard(request);
  if (blocked) return blocked;

  if (rejectByContentLength(request)) {
    return NextResponse.json({ success: false, error: "Image too large or missing length" }, { status: 413 });
  }

  const limited = await enforceRateLimit(request, "analyze-food");
  if (limited) return limited;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: { imageBase64?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { imageBase64 } = body;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json(
      { success: false, error: "imageBase64 is required" },
      { status: 400 }
    );
  }

  if (imageBase64.length > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { success: false, error: "Image too large" },
      { status: 413 }
    );
  }

  const openai = new OpenAI({ apiKey });

  // Build the food name list for the system prompt
  const foodNames = FOOD_DATABASE.map((f) => f.name).join(", ");

  const systemPrompt = `You are an expert nutrition analysis AI. You specialise in identifying foods from photos and estimating their nutritional content.

You have deep knowledge of Nigerian cuisine. Here is your reference database of foods to prioritise when identifying items: ${foodNames}

When analysing a food photo, identify each distinct food item visible. For each item, estimate the portion size and nutritional values.

Respond ONLY with valid JSON in this exact structure:
{
  "detectedItems": [
    {
      "name": "Food Name",
      "confidence": 0.85,
      "portionUnit": "plate",
      "portionValue": 1,
      "calories": 595,
      "proteinG": 12.3,
      "carbsG": 98.0,
      "fatG": 17.5
    }
  ],
  "totalCalories": 595,
  "estimationQualityScore": 0.8,
  "suggestedMealName": "Jollof Rice with Chicken",
  "suggestedMealType": "lunch",
  "clarificationNeeded": null
}

Rules:
- confidence: 0-1, how sure you are about the identification
- estimationQualityScore: 0-1, overall quality of the calorie estimation (lower if photo is blurry, items overlap, etc.)
- suggestedMealType: one of "breakfast", "lunch", "dinner", "snack"
- clarificationNeeded: null if clear, or a string question if the photo is ambiguous (e.g. "Is the sauce egusi or ogbono?")
- Always use realistic portion sizes
- If you recognise a Nigerian food, use its common Nigerian name`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse this food photo. Identify all food items and estimate their nutritional content.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    // Parse AI response - strip markdown fences if present
    let aiResult: {
      detectedItems: DetectedFoodItem[];
      totalCalories: number;
      estimationQualityScore: number;
      suggestedMealName: string;
      suggestedMealType: string;
      clarificationNeeded: string | null;
    };

    try {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      aiResult = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    // Enhance detected items with local food database for more accurate macros
    const enhancedItems: DetectedFoodItem[] = aiResult.detectedItems.map(
      (item) => {
        const dbMatches = findFood(item.name);

        if (dbMatches.length > 0) {
          const dbFood = dbMatches[0];
          // Find the closest portion option or calculate from portionValue
          const portionOption = dbFood.portionOptions.find(
            (opt) =>
              opt.label.toLowerCase().includes(item.portionUnit.toLowerCase())
          );

          const portionGrams = portionOption
            ? portionOption.grams * item.portionValue
            : dbFood.defaultPortionGrams * item.portionValue;

          const nutrition = calculateNutrition(dbFood, portionGrams);

          return {
            name: dbFood.name, // Use canonical name from DB
            confidence: Math.min(item.confidence + 0.05, 1), // Boost confidence when DB-matched
            portionUnit: item.portionUnit,
            portionValue: item.portionValue,
            calories: nutrition.calories,
            proteinG: nutrition.proteinG,
            carbsG: nutrition.carbsG,
            fatG: nutrition.fatG,
          };
        }

        // No DB match - use AI estimates as-is
        return item;
      }
    );

    // Recalculate total from enhanced items
    const totalCalories = enhancedItems.reduce(
      (sum, item) => sum + item.calories,
      0
    );

    const analysis: PhotoAnalysis = {
      detectedItems: enhancedItems,
      totalCalories,
      estimationQualityScore: aiResult.estimationQualityScore,
    };

    return NextResponse.json({
      success: true,
      analysis,
      suggestedMealName: aiResult.suggestedMealName,
      suggestedMealType: aiResult.suggestedMealType,
      clarificationNeeded: aiResult.clarificationNeeded,
    });
  } catch (error) {
    console.error("Food analysis error:", error);

    if (error instanceof OpenAI.APIError) {
      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json(
        {
          success: false,
          error:
            status === 429
              ? "Rate limit exceeded. Please try again in a moment."
              : "AI service temporarily unavailable",
        },
        { status }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to analyse food photo" },
      { status: 500 }
    );
  }
}
