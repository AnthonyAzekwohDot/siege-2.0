import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sameOriginGuard, rejectByContentLength } from "@/lib/api-guard";
import { enforceRateLimit } from "@/lib/rate-limit";

interface PreviousMeal {
  description: string;
  calories: number;
}

interface SuggestionItem {
  name: string;
  calories: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  const blocked = sameOriginGuard(request);
  if (blocked) return blocked;

  // Small JSON body — reject oversized/missing-length posts cheaply.
  if (rejectByContentLength(request, 64_000)) {
    return NextResponse.json({ success: false, error: "Request too large" }, { status: 413 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: {
    previousMeals?: PreviousMeal[];
    remainingCalories?: number;
    caloriesGoal?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { previousMeals, remainingCalories, caloriesGoal } = body;

  if (remainingCalories === undefined || caloriesGoal === undefined) {
    return NextResponse.json(
      {
        success: false,
        error: "remainingCalories and caloriesGoal are required",
      },
      { status: 400 }
    );
  }

  // Bound the prompt input so a huge previousMeals array can't inflate the call.
  const meals = Array.isArray(previousMeals) ? previousMeals.slice(0, 50) : [];

  // Count only requests that will actually reach OpenAI.
  const limited = await enforceRateLimit(request, "food-suggestions");
  if (limited) return limited;

  const openai = new OpenAI({ apiKey });

  const mealsContext =
    meals.length > 0
      ? `Today's meals so far:\n${meals.map((m) => `- ${m.description} (${m.calories} cal)`).join("\n")}`
      : "No meals logged yet today.";

  const systemPrompt = `You are a nutrition expert helping someone stay within their daily calorie budget while eating balanced, satisfying meals.

The user has a daily goal of ${caloriesGoal} calories and has ${remainingCalories} calories remaining.

${mealsContext}

Suggest 3-4 balanced food options that fit within the remaining calorie budget. Consider:
- Macro balance (protein, carbs, fats) relative to what they've already eaten
- Practical, realistic meal suggestions
- Include Nigerian food options where appropriate (jollof rice, suya, egusi soup, etc.)
- Keep portions realistic

Respond ONLY with valid JSON:
{
  "suggestions": [
    {
      "name": "Food name with portion",
      "calories": 350,
      "reason": "Brief reason why this is a good choice"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `I have ${remainingCalories} calories left today. What should I eat?`,
        },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    let parsed: { suggestions: SuggestionItem[] };

    try {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: parsed.suggestions,
    });
  } catch (error) {
    console.error("Food suggestions error:", error);

    if (error instanceof OpenAI.APIError && error.status === 429) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate food suggestions" },
      { status: 500 }
    );
  }
}
