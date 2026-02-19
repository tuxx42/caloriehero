import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "@/api/client";
import { MealCard } from "@/components/meal-card";
import type { Meal, MealCategory } from "@caloriehero/shared-types";

type CategoryFilter = "all" | MealCategory;

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

interface MealListResponse {
  items: Meal[];
  total: number;
  page: number;
  pageSize: number;
}

export default function MealsScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = category !== "all" ? `?category=${category}` : "";
      const data = await apiClient.get<MealListResponse>(
        `/api/v1/meals${params}`
      );
      setMeals(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load meals";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void fetchMeals();
  }, [fetchMeals]);

  function renderMeal({ item }: { item: Meal }) {
    return (
      <MealCard
        id={item.id}
        name={item.name}
        category={item.category}
        calories={item.nutritionalInfo.calories}
        price={item.price}
        onPress={() => router.push(`/meal/${item.id}`)}
      />
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No meals found.</Text>
        <TouchableOpacity onPress={fetchMeals}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterChip,
              category === cat.key && styles.filterChipActive,
            ]}
            onPress={() => setCategory(cat.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                category === cat.key && styles.filterChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMeals}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          renderItem={renderMeal}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f4f4f5",
  },
  filterChipActive: {
    backgroundColor: "#f97316",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#71717a",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#71717a",
  },
  retryText: {
    fontSize: 14,
    color: "#f97316",
    fontWeight: "600",
  },
});
