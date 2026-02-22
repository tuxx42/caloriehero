import { api } from "../client";
import type { UserProfile, UserWithProfile } from "../types";

export function getMe(): Promise<UserWithProfile> {
  return api.get<UserWithProfile>("/users/me");
}

export function updateProfile(
  data: Partial<{
    macro_targets: { calories: number; protein: number; carbs: number; fat: number };
    fitness_goal: string;
    allergies: string[];
    dietary_preferences: string[];
    delivery_address: string;
    delivery_lat: number;
    delivery_lng: number;
    weight_kg: number;
    height_cm: number;
    age: number;
    gender: string;
    activity_level: string;
  }>,
): Promise<UserProfile> {
  return api.put<UserProfile>("/users/me/profile", data);
}
