import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuthStore } from "@/stores/auth";

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      // Mock auth — will be replaced with real Google OAuth via expo-auth-session
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAuth("mock-token-abc123", {
        id: "mock-user-id",
        email: "user@example.com",
        name: "Demo User",
      });
    } catch (err) {
      Alert.alert("Sign In Failed", "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>CH</Text>
        </View>
        <Text style={styles.appName}>CalorieHero</Text>
        <Text style={styles.subtitle}>Macro-matched meals, delivered</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.terms}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#71717a",
    textAlign: "center",
  },
  footer: {
    gap: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181b",
  },
  terms: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
  },
});
