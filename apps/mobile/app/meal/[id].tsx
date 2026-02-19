import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "@/api/client";
import { MacroBar } from "@/components/macro-bar";
import { useCartStore } from "@/stores/cart";
import type { Meal } from "@caloriehero/shared-types";

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchMeal() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Meal>(`/api/v1/meals/${id}`);
        setMeal(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load meal";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void fetchMeal();
  }, [id]);

  function handleAddToCart() {
    if (!meal) return;
    for (let i = 0; i < quantity; i++) {
      addItem(meal.id, {
        name: meal.name,
        price: meal.price,
        calories: meal.nutritionalInfo.calories,
      });
    }
    Alert.alert(
      "Added to Cart",
      `${quantity}x ${meal.name} added.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/cart") },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (error || !meal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Meal not found"}</Text>
      </View>
    );
  }

  const { nutritionalInfo: n } = meal;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>🍽️</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {meal.category.charAt(0).toUpperCase() + meal.category.slice(1)}
            </Text>
          </View>
          <Text style={styles.servingSize}>{meal.servingSize}</Text>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.description}>{meal.description}</Text>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{n.calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{n.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{n.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{n.fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        <MacroBar macros={{ protein: n.protein, carbs: n.carbs, fat: n.fat }} />

        {meal.allergens.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Allergens</Text>
            <View style={styles.tagGroup}>
              {meal.allergens.map((a) => (
                <View key={a} style={styles.allergenTag}>
                  <Text style={styles.allergenTagText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {meal.dietaryTags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Dietary</Text>
            <View style={styles.tagGroup}>
              {meal.dietaryTags.map((t) => (
                <View key={t} style={styles.dietaryTag}>
                  <Text style={styles.dietaryTagText}>{t.replace("_", " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>
            Add to Cart — ฿{(meal.price * quantity).toFixed(0)}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 64,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
  },
  servingSize: {
    fontSize: 13,
    color: "#71717a",
  },
  mealName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#18181b",
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    color: "#71717a",
    lineHeight: 21,
  },
  macroRow: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#18181b",
  },
  macroLabel: {
    fontSize: 11,
    color: "#71717a",
  },
  macroDivider: {
    width: 1,
    backgroundColor: "#e4e4e7",
    marginVertical: 4,
  },
  tagsSection: {
    gap: 8,
  },
  tagsSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
  },
  tagGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  allergenTag: {
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allergenTagText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },
  dietaryTag: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dietaryTagText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 20,
    color: "#18181b",
    lineHeight: 24,
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#18181b",
    minWidth: 32,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
