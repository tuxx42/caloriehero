import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { OrderStatus } from "@caloriehero/shared-types";

interface StatusBadgeProps {
  status: OrderStatus;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; color: string }
> = {
  pending_payment: { label: "Pending Payment", bg: "#fef3c7", color: "#d97706" },
  confirmed: { label: "Confirmed", bg: "#dbeafe", color: "#2563eb" },
  preparing: { label: "Preparing", bg: "#ede9fe", color: "#7c3aed" },
  ready: { label: "Ready", bg: "#d1fae5", color: "#059669" },
  out_for_delivery: { label: "On the Way", bg: "#cffafe", color: "#0891b2" },
  delivered: { label: "Delivered", bg: "#dcfce7", color: "#16a34a" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", color: "#dc2626" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "#f4f4f5",
    color: "#71717a",
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
