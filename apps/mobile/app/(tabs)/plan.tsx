import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "@/api/client";
import { useCartStore } from "@/stores/cart";
import type { PlanResult, MealSlot } from "@caloriehero/shared-types";

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const SLOT_ICONS: Record<MealSlot, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export default function PlanScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<PlanResult>("/api/v1/matching/plan", {
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67,
        },
        slots: [
          { slot: "breakfast", percentage: 0.25 },
          { slot: "lunch", percentage: 0.35 },
          { slot: "dinner", percentage: 0.3 },
          { slot: "snack", percentage: 0.1 },
        ],
        allergies: [],
        dietaryPreferences: [],
      });
      setPlan(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate plan";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  function orderPlan() {
    if (!plan) return;
    clearCart();
    plan.items.forEach((item) => {
      addItem(item.meal.id, {
        name: item.meal.name,
        price: item.meal.price,
        calories: item.meal.nutritionalInfo.calories,
      });
    });
    router.push("/cart");
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Meal Plan</Text>
        <Text style={styles.headerSubtitle}>
          AI-generated meals matched to your macros
        </Text>
      </View>

      {!plan && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate a personalized meal plan based on your macro targets.
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generatePlan}
          >
            <Text style={styles.generateButtonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Finding the best meals for you...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generatePlan}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan && !loading && (
        <>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Match Score</Text>
            <Text style={styles.scoreValue}>
              {Math.round(plan.totalScore * 100)}%
            </Text>
          </View>

          <View style={styles.slots}>
            {plan.items.map((item) => (
              <View key={item.slot} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotIcon}>{SLOT_ICONS[item.slot]}</Text>
                  <Text style={styles.slotLabel}>{SLOT_LABELS[item.slot]}</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>
                      {Math.round(item.score * 100)}% match
                    </Text>
                  </View>
                </View>
                <Text style={styles.mealName}>{item.meal.name}</Text>
                <View style={styles.slotFooter}>
                  <Text style={styles.slotCalories}>
                    {item.meal.nutritionalInfo.calories} kcal
                  </Text>
                  <Text style={styles.slotPrice}>
                    ฿{item.meal.price.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.orderButton}
              onPress={orderPlan}
              activeOpacity={0.85}
            >
              <Text style={styles.orderButtonText}>Order This Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={generatePlan}
              activeOpacity={0.85}
            >
              <Text style={styles.regenerateButtonText}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#18181b",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#71717a",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181b",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  generateButton: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#71717a",
  },
  errorState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  scoreCard: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#f97316",
  },
  slots: {
    gap: 10,
  },
  slotCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotIcon: {
    fontSize: 18,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
    flex: 1,
  },
  matchBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  matchText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#18181b",
  },
  slotFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slotCalories: {
    fontSize: 13,
    color: "#71717a",
  },
  slotPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f97316",
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  orderButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  regenerateButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181b",
  },
});
