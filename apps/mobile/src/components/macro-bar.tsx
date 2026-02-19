import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MacroBarProps {
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function MacroBar({ macros }: MacroBarProps) {
  const total = macros.protein + macros.carbs + macros.fat || 1;
  const proteinPct = (macros.protein / total) * 100;
  const carbsPct = (macros.carbs / total) * 100;
  const fatPct = (macros.fat / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        <View style={[styles.segment, styles.proteinSegment, { flex: proteinPct }]} />
        <View style={[styles.segment, styles.carbsSegment, { flex: carbsPct }]} />
        <View style={[styles.segment, styles.fatSegment, { flex: fatPct }]} />
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.proteinDot]} />
          <Text style={styles.legendText}>P {macros.protein}g</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.carbsDot]} />
          <Text style={styles.legendText}>C {macros.carbs}g</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.fatDot]} />
          <Text style={styles.legendText}>F {macros.fat}g</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  barRow: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#e4e4e7",
  },
  segment: {
    height: "100%",
  },
  proteinSegment: {
    backgroundColor: "#3b82f6",
  },
  carbsSegment: {
    backgroundColor: "#f97316",
  },
  fatSegment: {
    backgroundColor: "#eab308",
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proteinDot: {
    backgroundColor: "#3b82f6",
  },
  carbsDot: {
    backgroundColor: "#f97316",
  },
  fatDot: {
    backgroundColor: "#eab308",
  },
  legendText: {
    fontSize: 12,
    color: "#71717a",
  },
});
