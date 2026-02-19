import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/auth";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGuard>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="meal/[id]"
          options={{
            presentation: "modal",
            title: "Meal Detail",
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#18181b",
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            title: "Your Cart",
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#18181b",
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            title: "Checkout",
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#18181b",
          }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{
            presentation: "modal",
            title: "Order Tracking",
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#18181b",
          }}
        />
      </Stack>
    </AuthGuard>
  );
}
