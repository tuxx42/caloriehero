export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  macro_targets: MacroTargets;
  fitness_goal: string;
  allergies: string[];
  dietary_preferences: string[];
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  serving_size: string;
  price: number;
  allergens: string[];
  dietary_tags: string[];
  image_url: string | null;
  active: boolean;
  protein_price_per_gram: number | null;
  carbs_price_per_gram: number | null;
  fat_price_per_gram: number | null;
  nutritional_benefits: string | null;
}

export interface OrderItem {
  id: string;
  meal_id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  extra_protein: number;
  extra_carbs: number;
  extra_fat: number;
}

export interface PricingConfig {
  id: string;
  protein_price_per_gram: number;
  carbs_price_per_gram: number;
  fat_price_per_gram: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  type: string;
  total: number;
  delivery_slot_id: string | null;
  delivery_address: string | null;
  poster_order_id: string | null;
  stripe_payment_intent_id: string | null;
  items: OrderItem[];
}

export interface ScoredMeal {
  meal_id: string;
  meal_name: string;
  score: number;
  category: string;
}

export interface PlanItem {
  slot: string;
  meal_id: string;
  meal_name: string;
  score: number;
  slot_targets: MacroTargets;
  extra_protein: number;
  extra_carbs: number;
  extra_fat: number;
  extra_price: number;
  meal: Meal;
}

export interface DailyPlan {
  id: string;
  date: string;
  total_score: number;
  actual_macros: MacroTargets;
  target_macros: MacroTargets;
  total_extra_price: number;
  items: PlanItem[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_km: number;
  delivery_fee: number;
  active: boolean;
}

export interface DeliverySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  zone_id: string;
  capacity: number;
  booked_count: number;
  available: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  schedule: Record<string, boolean>;
  macro_targets: MacroTargets;
  paused_at: string | null;
  cancelled_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SlotAlternative {
  meal_id: string;
  meal_name: string;
  score: number;
  category: string;
  meal: Meal;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}
