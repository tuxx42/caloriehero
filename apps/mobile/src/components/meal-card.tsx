import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { MealCategory } from "@caloriehero/shared-types";

interface MealCardProps {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  price: number;
  score?: number;
  onPress?: () => void;
}

const CATEGORY_COLORS: Record<MealCategory, string> = {
  breakfast: "#f97316",
  lunch: "#3b82f6",
  dinner: "#8b5cf6",
  snack: "#10b981",
};

export function MealCard({
  name,
  category,
  calories,
  price,
  score,
  onPress,
}: MealCardProps) {
  const categoryColor = CATEGORY_COLORS[category];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </View>
        {score !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(score * 100)}% match</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.calories}>{calories} kcal</Text>
        <Text style={styles.price}>฿{price.toFixed(0)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scoreBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#18181b",
    lineHeight: 21,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calories: {
    fontSize: 13,
    color: "#71717a",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f97316",
  },
});
