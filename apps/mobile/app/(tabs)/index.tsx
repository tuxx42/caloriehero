import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const dailyTarget = 2000;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingLabel}>Good morning,</Text>
        <Text style={styles.greetingName}>{user?.name ?? "there"} 👋</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Today's Target</Text>
        <Text style={styles.statsCalories}>{dailyTarget}</Text>
        <Text style={styles.statsUnit}>calories</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>150g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>200g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>67g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push("/(tabs)/plan")}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaIcon}>📋</Text>
        <View style={styles.ctaTextBlock}>
          <Text style={styles.ctaTitle}>Generate Today's Plan</Text>
          <Text style={styles.ctaSubtitle}>AI-matched meals for your goals</Text>
        </View>
        <Text style={styles.ctaChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/(tabs)/meals")}
        activeOpacity={0.85}
      >
        <Text style={styles.secondaryIcon}>🥗</Text>
        <View style={styles.ctaTextBlock}>
          <Text style={styles.secondaryTitle}>Browse Meals</Text>
          <Text style={styles.secondarySubtitle}>See all available options</Text>
        </View>
        <Text style={styles.secondaryChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recent orders yet.</Text>
          <Text style={styles.emptyStateSubtext}>
            Start by browsing meals or generating a plan.
          </Text>
        </View>
      </View>
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
  greeting: {
    gap: 2,
  },
  greetingLabel: {
    fontSize: 14,
    color: "#71717a",
  },
  greetingName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#18181b",
  },
  statsCard: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  statsTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  statsCalories: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 56,
  },
  statsUnit: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  macroRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 0,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  macroLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  macroDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 4,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  ctaIcon: {
    fontSize: 24,
  },
  ctaTextBlock: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  ctaSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  ctaChevron: {
    fontSize: 20,
    color: "rgba(255,255,255,0.5)",
  },
  secondaryIcon: {
    fontSize: 24,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#18181b",
  },
  secondarySubtitle: {
    fontSize: 12,
    color: "#71717a",
  },
  secondaryChevron: {
    fontSize: 20,
    color: "#a1a1aa",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181b",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#f4f4f5",
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717a",
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
  },
});
