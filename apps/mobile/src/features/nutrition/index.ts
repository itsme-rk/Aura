// ─── Nutrition Feature Barrel ─────────────────────────────

export {
  NutritionTodayScreen,
  AddProteinScreen,
  FoodSearchScreen,
} from './screens';

export {
  DEFAULT_FOODS,
  searchDefaultFoods,
  getDefaultFoodsByCategory,
  getDefaultCategories,
} from './data/foodLibrary';

export * as nutritionService from './services/nutrition.service';
