import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  foodItem: z.string().min(1, "foodItem is required"),
  portionSize: z.string().min(1, "portionSize is required"),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 }
    );
  }

  const { foodItem, portionSize } = parsed.data;

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a nutrition expert. Estimate the calories for the given food item and portion size as accurately as possible.

Consider Nigerian foods and their typical preparation methods. Be specific with your estimates.

Respond ONLY with valid JSON:
{
  "calories": 350,
  "confidence": "high"
}

Confidence levels:
- "high": well-known food with standard preparation (e.g. a boiled egg, a slice of bread)
- "medium": food with variable preparation or portion ambiguity (e.g. jollof rice - depends on oil used)
- "low": uncommon food, very vague portion, or highly variable preparation`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Estimate calories for: ${foodItem}, portion: ${portionSize}`,
        },
      ],
      max_tokens: 128,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    let aiResult: { calories: number; confidence: "high" | "medium" | "low" };

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

    return NextResponse.json({
      success: true,
      foodItem,
      portionSize,
      estimatedCalories: aiResult.calories,
      confidence: aiResult.confidence,
    });
  } catch (error) {
    console.error("Calorie estimation error:", error);

    if (error instanceof OpenAI.APIError && error.status === 429) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to estimate calories" },
      { status: 500 }
    );
  }
}
