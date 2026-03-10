// ============ FOOD DATABASE ============
// Nigerian foods, general foods, fast food, and drinks
// All calorie/macro values per 100g

export type FoodCategory = "nigerian" | "general" | "fast_food" | "drinks";

export interface PortionOption {
  label: string;
  grams: number;
}

export interface FoodEntry {
  name: string;
  aliases: string[];
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultPortionUnit: string;
  defaultPortionGrams: number;
  portionOptions: PortionOption[];
}

export interface NutritionResult {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  portionGrams: number;
  portionLabel: string;
}

// ============ THE DATABASE ============

export const FOOD_DATABASE: FoodEntry[] = [
  // ──────────── NIGERIAN FOODS ────────────
  {
    name: "Jollof Rice",
    aliases: ["jollof", "party jollof", "party rice"],
    category: "nigerian",
    caloriesPer100g: 170,
    proteinPer100g: 3.5,
    carbsPer100g: 28,
    fatPer100g: 5,
    defaultPortionUnit: "plate",
    defaultPortionGrams: 350,
    portionOptions: [
      { label: "Small plate", grams: 200 },
      { label: "Medium plate", grams: 350 },
      { label: "Large plate", grams: 500 },
      { label: "Party portion", grams: 600 },
    ],
  },
  {
    name: "Fried Rice",
    aliases: ["nigerian fried rice", "party fried rice"],
    category: "nigerian",
    caloriesPer100g: 165,
    proteinPer100g: 4,
    carbsPer100g: 25,
    fatPer100g: 6,
    defaultPortionUnit: "plate",
    defaultPortionGrams: 350,
    portionOptions: [
      { label: "Small plate", grams: 200 },
      { label: "Medium plate", grams: 350 },
      { label: "Large plate", grams: 500 },
      { label: "Party portion", grams: 600 },
    ],
  },
  {
    name: "Egusi Soup",
    aliases: ["egusi", "melon soup"],
    category: "nigerian",
    caloriesPer100g: 180,
    proteinPer100g: 8,
    carbsPer100g: 6,
    fatPer100g: 14,
    defaultPortionUnit: "bowl",
    defaultPortionGrams: 250,
    portionOptions: [
      { label: "Small bowl", grams: 150 },
      { label: "Medium bowl", grams: 250 },
      { label: "Large bowl", grams: 400 },
    ],
  },
  {
    name: "Ogbono Soup",
    aliases: ["ogbono", "draw soup", "apon"],
    category: "nigerian",
    caloriesPer100g: 160,
    proteinPer100g: 7,
    carbsPer100g: 5,
    fatPer100g: 12,
    defaultPortionUnit: "bowl",
    defaultPortionGrams: 250,
    portionOptions: [
      { label: "Small bowl", grams: 150 },
      { label: "Medium bowl", grams: 250 },
      { label: "Large bowl", grams: 400 },
    ],
  },
  {
    name: "Okra Soup",
    aliases: ["okra", "okro", "okro soup", "ila"],
    category: "nigerian",
    caloriesPer100g: 90,
    proteinPer100g: 5,
    carbsPer100g: 8,
    fatPer100g: 4,
    defaultPortionUnit: "bowl",
    defaultPortionGrams: 250,
    portionOptions: [
      { label: "Small bowl", grams: 150 },
      { label: "Medium bowl", grams: 250 },
      { label: "Large bowl", grams: 400 },
    ],
  },
  {
    name: "Eba",
    aliases: ["garri", "eba garri", "cassava flakes"],
    category: "nigerian",
    caloriesPer100g: 360,
    proteinPer100g: 1.5,
    carbsPer100g: 85,
    fatPer100g: 0.5,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 300,
    portionOptions: [
      { label: "Small wrap", grams: 200 },
      { label: "Medium wrap", grams: 300 },
      { label: "Large wrap", grams: 450 },
    ],
  },
  {
    name: "Pounded Yam",
    aliases: ["pounded yam", "iyan", "yam"],
    category: "nigerian",
    caloriesPer100g: 310,
    proteinPer100g: 2,
    carbsPer100g: 74,
    fatPer100g: 0.3,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 350,
    portionOptions: [
      { label: "Small wrap", grams: 200 },
      { label: "Medium wrap", grams: 350 },
      { label: "Large wrap", grams: 500 },
    ],
  },
  {
    name: "Amala",
    aliases: ["amala", "yam flour"],
    category: "nigerian",
    caloriesPer100g: 340,
    proteinPer100g: 2,
    carbsPer100g: 80,
    fatPer100g: 0.5,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 300,
    portionOptions: [
      { label: "Small wrap", grams: 200 },
      { label: "Medium wrap", grams: 300 },
      { label: "Large wrap", grams: 450 },
    ],
  },
  {
    name: "Fufu",
    aliases: ["fufu", "akpu", "cassava fufu"],
    category: "nigerian",
    caloriesPer100g: 330,
    proteinPer100g: 1.5,
    carbsPer100g: 78,
    fatPer100g: 0.3,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 300,
    portionOptions: [
      { label: "Small wrap", grams: 200 },
      { label: "Medium wrap", grams: 300 },
      { label: "Large wrap", grams: 450 },
    ],
  },
  {
    name: "Suya",
    aliases: ["suya", "beef suya", "chicken suya", "tsire"],
    category: "nigerian",
    caloriesPer100g: 220,
    proteinPer100g: 25,
    carbsPer100g: 3,
    fatPer100g: 12,
    defaultPortionUnit: "sticks",
    defaultPortionGrams: 200,
    portionOptions: [
      { label: "2 sticks", grams: 100 },
      { label: "4 sticks", grams: 200 },
      { label: "6 sticks", grams: 300 },
      { label: "Full order", grams: 400 },
    ],
  },
  {
    name: "Puff Puff",
    aliases: ["puff puff", "puff-puff", "buns"],
    category: "nigerian",
    caloriesPer100g: 330,
    proteinPer100g: 5,
    carbsPer100g: 45,
    fatPer100g: 14,
    defaultPortionUnit: "pieces",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "3 pieces", grams: 90 },
      { label: "5 pieces", grams: 150 },
      { label: "8 pieces", grams: 240 },
    ],
  },
  {
    name: "Moi Moi",
    aliases: ["moi moi", "moin moin", "bean pudding"],
    category: "nigerian",
    caloriesPer100g: 140,
    proteinPer100g: 9,
    carbsPer100g: 15,
    fatPer100g: 5,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 200,
    portionOptions: [
      { label: "1 wrap", grams: 150 },
      { label: "2 wraps", grams: 300 },
      { label: "Small portion", grams: 100 },
    ],
  },
  {
    name: "Akara",
    aliases: ["akara", "bean cake", "bean fritters", "kosai"],
    category: "nigerian",
    caloriesPer100g: 280,
    proteinPer100g: 10,
    carbsPer100g: 20,
    fatPer100g: 18,
    defaultPortionUnit: "pieces",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "3 pieces", grams: 90 },
      { label: "5 pieces", grams: 150 },
      { label: "8 pieces", grams: 240 },
    ],
  },
  {
    name: "Fried Plantain",
    aliases: ["fried plantain", "dodo", "plantain fried"],
    category: "nigerian",
    caloriesPer100g: 250,
    proteinPer100g: 1.5,
    carbsPer100g: 35,
    fatPer100g: 12,
    defaultPortionUnit: "serving",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "Small serving", grams: 100 },
      { label: "Medium serving", grams: 150 },
      { label: "Large serving", grams: 250 },
    ],
  },
  {
    name: "Boiled Plantain",
    aliases: ["boiled plantain", "plantain boiled"],
    category: "nigerian",
    caloriesPer100g: 120,
    proteinPer100g: 1.3,
    carbsPer100g: 31,
    fatPer100g: 0.4,
    defaultPortionUnit: "serving",
    defaultPortionGrams: 200,
    portionOptions: [
      { label: "1 plantain", grams: 150 },
      { label: "2 plantains", grams: 300 },
      { label: "Small serving", grams: 100 },
    ],
  },
  {
    name: "Pepper Soup",
    aliases: ["pepper soup", "goat pepper soup", "catfish pepper soup", "chicken pepper soup"],
    category: "nigerian",
    caloriesPer100g: 85,
    proteinPer100g: 10,
    carbsPer100g: 3,
    fatPer100g: 4,
    defaultPortionUnit: "bowl",
    defaultPortionGrams: 400,
    portionOptions: [
      { label: "Small bowl", grams: 250 },
      { label: "Medium bowl", grams: 400 },
      { label: "Large bowl", grams: 600 },
    ],
  },
  {
    name: "Beans and Plantain",
    aliases: ["beans and plantain", "beans and dodo", "ewa and dodo"],
    category: "nigerian",
    caloriesPer100g: 175,
    proteinPer100g: 8,
    carbsPer100g: 28,
    fatPer100g: 4,
    defaultPortionUnit: "plate",
    defaultPortionGrams: 400,
    portionOptions: [
      { label: "Small plate", grams: 250 },
      { label: "Medium plate", grams: 400 },
      { label: "Large plate", grams: 550 },
    ],
  },

  // ──────────── GENERAL FOODS ────────────
  {
    name: "White Rice",
    aliases: ["white rice", "plain rice", "boiled rice", "rice"],
    category: "general",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3,
    defaultPortionUnit: "plate",
    defaultPortionGrams: 300,
    portionOptions: [
      { label: "Small plate", grams: 200 },
      { label: "Medium plate", grams: 300 },
      { label: "Large plate", grams: 450 },
    ],
  },
  {
    name: "Grilled Chicken",
    aliases: ["grilled chicken", "chicken breast", "chicken grilled"],
    category: "general",
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    defaultPortionUnit: "piece",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "Small piece", grams: 100 },
      { label: "Medium piece", grams: 150 },
      { label: "Large piece", grams: 250 },
      { label: "Double", grams: 300 },
    ],
  },
  {
    name: "Fried Chicken",
    aliases: ["fried chicken", "chicken fried", "crispy chicken"],
    category: "general",
    caloriesPer100g: 260,
    proteinPer100g: 24,
    carbsPer100g: 10,
    fatPer100g: 14,
    defaultPortionUnit: "piece",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "1 piece", grams: 100 },
      { label: "2 pieces", grams: 200 },
      { label: "3 pieces", grams: 300 },
    ],
  },
  {
    name: "Beef",
    aliases: ["beef", "steak", "beef stew", "meat"],
    category: "general",
    caloriesPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15,
    defaultPortionUnit: "piece",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "Small piece", grams: 80 },
      { label: "Medium piece", grams: 150 },
      { label: "Large piece", grams: 250 },
    ],
  },
  {
    name: "Fish",
    aliases: ["fish", "grilled fish", "fried fish", "tilapia", "mackerel", "titus"],
    category: "general",
    caloriesPer100g: 140,
    proteinPer100g: 24,
    carbsPer100g: 0,
    fatPer100g: 5,
    defaultPortionUnit: "piece",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "Small fillet", grams: 100 },
      { label: "Medium fillet", grams: 150 },
      { label: "Large fillet/whole", grams: 250 },
    ],
  },
  {
    name: "Fried Egg",
    aliases: ["fried egg", "egg fried", "sunny side up"],
    category: "general",
    caloriesPer100g: 196,
    proteinPer100g: 14,
    carbsPer100g: 1,
    fatPer100g: 15,
    defaultPortionUnit: "egg",
    defaultPortionGrams: 60,
    portionOptions: [
      { label: "1 egg", grams: 60 },
      { label: "2 eggs", grams: 120 },
      { label: "3 eggs", grams: 180 },
    ],
  },
  {
    name: "Boiled Egg",
    aliases: ["boiled egg", "egg boiled", "hard boiled egg"],
    category: "general",
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11,
    defaultPortionUnit: "egg",
    defaultPortionGrams: 50,
    portionOptions: [
      { label: "1 egg", grams: 50 },
      { label: "2 eggs", grams: 100 },
      { label: "3 eggs", grams: 150 },
    ],
  },
  {
    name: "Salad",
    aliases: ["salad", "green salad", "vegetable salad", "mixed salad"],
    category: "general",
    caloriesPer100g: 45,
    proteinPer100g: 2,
    carbsPer100g: 7,
    fatPer100g: 1,
    defaultPortionUnit: "bowl",
    defaultPortionGrams: 200,
    portionOptions: [
      { label: "Small bowl", grams: 100 },
      { label: "Medium bowl", grams: 200 },
      { label: "Large bowl", grams: 350 },
    ],
  },
  {
    name: "Bread",
    aliases: ["bread", "sliced bread", "white bread", "agege bread"],
    category: "general",
    caloriesPer100g: 265,
    proteinPer100g: 9,
    carbsPer100g: 49,
    fatPer100g: 3.2,
    defaultPortionUnit: "slices",
    defaultPortionGrams: 60,
    portionOptions: [
      { label: "1 slice", grams: 30 },
      { label: "2 slices", grams: 60 },
      { label: "3 slices", grams: 90 },
      { label: "Half loaf", grams: 200 },
    ],
  },

  // ──────────── FAST FOOD ────────────
  {
    name: "Shawarma",
    aliases: ["shawarma", "chicken shawarma", "beef shawarma"],
    category: "fast_food",
    caloriesPer100g: 230,
    proteinPer100g: 12,
    carbsPer100g: 22,
    fatPer100g: 11,
    defaultPortionUnit: "wrap",
    defaultPortionGrams: 350,
    portionOptions: [
      { label: "Small wrap", grams: 250 },
      { label: "Regular wrap", grams: 350 },
      { label: "Large wrap", grams: 500 },
    ],
  },
  {
    name: "Pizza",
    aliases: ["pizza", "pizza slice"],
    category: "fast_food",
    caloriesPer100g: 270,
    proteinPer100g: 11,
    carbsPer100g: 33,
    fatPer100g: 10,
    defaultPortionUnit: "slice",
    defaultPortionGrams: 120,
    portionOptions: [
      { label: "1 slice", grams: 120 },
      { label: "2 slices", grams: 240 },
      { label: "3 slices", grams: 360 },
      { label: "Half pizza", grams: 480 },
    ],
  },
  {
    name: "Burger",
    aliases: ["burger", "hamburger", "cheeseburger", "chicken burger"],
    category: "fast_food",
    caloriesPer100g: 250,
    proteinPer100g: 14,
    carbsPer100g: 24,
    fatPer100g: 11,
    defaultPortionUnit: "burger",
    defaultPortionGrams: 200,
    portionOptions: [
      { label: "Small burger", grams: 150 },
      { label: "Regular burger", grams: 200 },
      { label: "Large burger", grams: 300 },
      { label: "Double burger", grams: 400 },
    ],
  },
  {
    name: "French Fries",
    aliases: ["french fries", "fries", "chips"],
    category: "fast_food",
    caloriesPer100g: 310,
    proteinPer100g: 3.4,
    carbsPer100g: 41,
    fatPer100g: 15,
    defaultPortionUnit: "serving",
    defaultPortionGrams: 150,
    portionOptions: [
      { label: "Small", grams: 80 },
      { label: "Medium", grams: 150 },
      { label: "Large", grams: 250 },
    ],
  },

  // ──────────── DRINKS ────────────
  {
    name: "Coca-Cola",
    aliases: ["coca-cola", "coke", "coca cola", "coka cola"],
    category: "drinks",
    caloriesPer100g: 42,
    proteinPer100g: 0,
    carbsPer100g: 10.6,
    fatPer100g: 0,
    defaultPortionUnit: "can",
    defaultPortionGrams: 330,
    portionOptions: [
      { label: "Small can (330ml)", grams: 330 },
      { label: "Bottle (500ml)", grams: 500 },
      { label: "Large bottle (1L)", grams: 1000 },
    ],
  },
  {
    name: "Malt Drink",
    aliases: ["malt", "malta", "maltina", "amstel malta", "dubic malt"],
    category: "drinks",
    caloriesPer100g: 45,
    proteinPer100g: 0.5,
    carbsPer100g: 10,
    fatPer100g: 0,
    defaultPortionUnit: "bottle",
    defaultPortionGrams: 330,
    portionOptions: [
      { label: "Small bottle (330ml)", grams: 330 },
      { label: "Large bottle (500ml)", grams: 500 },
    ],
  },
  {
    name: "Zobo",
    aliases: ["zobo", "zobo drink", "hibiscus drink", "hibiscus tea"],
    category: "drinks",
    caloriesPer100g: 35,
    proteinPer100g: 0.3,
    carbsPer100g: 8,
    fatPer100g: 0,
    defaultPortionUnit: "glass",
    defaultPortionGrams: 300,
    portionOptions: [
      { label: "Small glass", grams: 200 },
      { label: "Medium glass", grams: 300 },
      { label: "Large glass", grams: 500 },
    ],
  },
];

// ============ UTILITY FUNCTIONS ============

/**
 * Find a food in the database by name or alias.
 * Case-insensitive, partial matching supported.
 */
export function findFood(query: string): FoodEntry[] {
  const normalised = query.toLowerCase().trim();

  if (!normalised) return [];

  // Exact match first (name or alias)
  const exactMatches = FOOD_DATABASE.filter(
    (food) =>
      food.name.toLowerCase() === normalised ||
      food.aliases.some((alias) => alias.toLowerCase() === normalised)
  );

  if (exactMatches.length > 0) return exactMatches;

  // Partial match (name or alias contains query, or query contains name/alias)
  const partialMatches = FOOD_DATABASE.filter(
    (food) =>
      food.name.toLowerCase().includes(normalised) ||
      normalised.includes(food.name.toLowerCase()) ||
      food.aliases.some(
        (alias) =>
          alias.toLowerCase().includes(normalised) ||
          normalised.includes(alias.toLowerCase())
      )
  );

  return partialMatches;
}

/**
 * Calculate nutrition for a given food and portion.
 * If portionGrams is not provided, uses the food's default portion.
 * If portionLabel is provided, looks up the grams from portionOptions.
 */
export function calculateNutrition(
  food: FoodEntry,
  portionGrams?: number,
  portionLabel?: string
): NutritionResult {
  let grams = food.defaultPortionGrams;
  let label = food.defaultPortionUnit;

  if (portionLabel) {
    const option = food.portionOptions.find(
      (opt) => opt.label.toLowerCase() === portionLabel.toLowerCase()
    );
    if (option) {
      grams = option.grams;
      label = option.label;
    }
  }

  if (portionGrams !== undefined) {
    grams = portionGrams;
    label = `${grams}g`;
  }

  const multiplier = grams / 100;

  return {
    calories: Math.round(food.caloriesPer100g * multiplier),
    proteinG: Math.round(food.proteinPer100g * multiplier * 10) / 10,
    carbsG: Math.round(food.carbsPer100g * multiplier * 10) / 10,
    fatG: Math.round(food.fatPer100g * multiplier * 10) / 10,
    portionGrams: grams,
    portionLabel: label,
  };
}
