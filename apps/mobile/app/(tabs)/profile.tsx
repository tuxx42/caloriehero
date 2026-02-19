import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/stores/auth";
import { apiClient } from "@/api/client";
import type { FitnessGoal, Allergen, DietaryTag } from "@caloriehero/shared-types";

const FITNESS_GOALS: { key: FitnessGoal; label: string }[] = [
  { key: "lose_weight", label: "Lose Weight" },
  { key: "maintain", label: "Maintain" },
  { key: "gain_muscle", label: "Gain Muscle" },
  { key: "bulk", label: "Bulk" },
  { key: "cut", label: "Cut" },
];

const ALLERGEN_OPTIONS: { key: Allergen; label: string }[] = [
  { key: "dairy", label: "Dairy" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "shellfish", label: "Shellfish" },
  { key: "tree_nuts", label: "Tree Nuts" },
  { key: "peanuts", label: "Peanuts" },
  { key: "wheat", label: "Wheat" },
  { key: "soy", label: "Soy" },
  { key: "sesame", label: "Sesame" },
];

const DIETARY_OPTIONS: { key: DietaryTag; label: string }[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten Free" },
  { key: "keto", label: "Keto" },
  { key: "low_carb", label: "Low Carb" },
  { key: "high_protein", label: "High Protein" },
  { key: "dairy_free", label: "Dairy Free" },
  { key: "halal", label: "Halal" },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("200");
  const [fat, setFat] = useState("67");
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("maintain");
  const [allergies, setAllergies] = useState<Allergen[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryTag[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleAllergen(key: Allergen) {
    setAllergies((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  }

  function toggleDietary(key: DietaryTag) {
    setDietaryPrefs((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await apiClient.patch("/api/v1/users/me/profile", {
        macroTargets: {
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fat: Number(fat),
        },
        fitnessGoal,
        allergies,
        dietaryPreferences: dietaryPrefs,
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name ?? "User"}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Macro Targets</Text>
        <View style={styles.macroGrid}>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Calories</Text>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="2000"
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              placeholder="150"
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              placeholder="200"
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.fieldLabel}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              placeholder="67"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Goal</Text>
        <View style={styles.chipGroup}>
          {FITNESS_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.key}
              style={[
                styles.chip,
                fitnessGoal === goal.key && styles.chipActive,
              ]}
              onPress={() => setFitnessGoal(goal.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  fitnessGoal === goal.key && styles.chipTextActive,
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        <View style={styles.chipGroup}>
          {ALLERGEN_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                styles.chipWarning,
                allergies.includes(opt.key) && styles.chipWarningActive,
              ]}
              onPress={() => toggleAllergen(opt.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  styles.chipWarningText,
                  allergies.includes(opt.key) && styles.chipWarningTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        <View style={styles.chipGroup}>
          {DIETARY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                styles.chipGreen,
                dietaryPrefs.includes(opt.key) && styles.chipGreenActive,
              ]}
              onPress={() => toggleDietary(opt.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  styles.chipGreenText,
                  dietaryPrefs.includes(opt.key) && styles.chipGreenTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveProfile}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    gap: 20,
    paddingBottom: 48,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181b",
  },
  userEmail: {
    fontSize: 13,
    color: "#71717a",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#18181b",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  macroField: {
    width: "47%",
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717a",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#18181b",
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f4f4f5",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#f97316",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#71717a",
  },
  chipTextActive: {
    color: "#f97316",
  },
  chipWarning: {
    backgroundColor: "#f4f4f5",
  },
  chipWarningActive: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  chipWarningText: {
    color: "#71717a",
  },
  chipWarningTextActive: {
    color: "#ef4444",
  },
  chipGreen: {
    backgroundColor: "#f4f4f5",
  },
  chipGreenActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#16a34a",
  },
  chipGreenText: {
    color: "#71717a",
  },
  chipGreenTextActive: {
    color: "#16a34a",
  },
  saveButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ef4444",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
