import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { apiClient } from "@/api/client";
import { StatusBadge } from "@/components/status-badge";
import type { Order, OrderStatus } from "@caloriehero/shared-types";

const STATUS_STEPS: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const STEP_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Payment Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STEP_ICONS: Record<OrderStatus, string> = {
  pending_payment: "💳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "🥡",
  out_for_delivery: "🛵",
  delivered: "🎉",
  cancelled: "❌",
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Order>(`/api/v1/orders/${id}`);
        setOrder(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load order";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    void fetchOrder();

    // Poll for updates every 15 seconds (SSE will replace this later)
    const interval = setInterval(() => {
      void fetchOrder();
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Order not found"}</Text>
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusIcon}>{STEP_ICONS[order.status]}</Text>
        <StatusBadge status={order.status} />
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      {!isCancelled && (
        <View style={styles.progressSection}>
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;
            return (
              <View key={step} style={styles.progressStep}>
                <View style={styles.progressLeft}>
                  <View
                    style={[
                      styles.stepDot,
                      isCompleted && styles.stepDotCompleted,
                      isActive && styles.stepDotActive,
                      isFuture && styles.stepDotFuture,
                    ]}
                  >
                    {isCompleted && <Text style={styles.stepCheck}>✓</Text>}
                    {isActive && <View style={styles.stepActiveDot} />}
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isFuture && styles.stepLabelFuture,
                  ]}
                >
                  {STEP_LABELS[step]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.itemsCard}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.quantity}x {item.mealName}
              </Text>
              <Text style={styles.orderItemPrice}>
                ฿{(item.unitPrice * item.quantity).toFixed(0)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>฿{order.total.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pollingNote}>Updates every 15 seconds</Text>
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
  statusHeader: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 48,
  },
  orderId: {
    fontSize: 13,
    color: "#71717a",
    fontFamily: "monospace",
  },
  progressSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  progressLeft: {
    alignItems: "center",
    width: 24,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotCompleted: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  stepDotActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  stepDotFuture: {
    borderColor: "#e4e4e7",
    backgroundColor: "#f4f4f5",
  },
  stepCheck: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
  },
  stepActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: "#e4e4e7",
    marginVertical: 3,
  },
  stepLineCompleted: {
    backgroundColor: "#f97316",
  },
  stepLabel: {
    fontSize: 14,
    color: "#18181b",
    paddingTop: 4,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#f97316",
    fontWeight: "700",
  },
  stepLabelFuture: {
    color: "#a1a1aa",
    fontWeight: "400",
  },
  itemsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181b",
  },
  itemsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemName: {
    fontSize: 14,
    color: "#18181b",
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    color: "#71717a",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f4f4f5",
  },
  orderTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#18181b",
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f97316",
  },
  pollingNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#a1a1aa",
  },
});
