import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "@/api/client";
import { useCartStore } from "@/stores/cart";
import type { Order } from "@caloriehero/shared-types";

const DELIVERY_SLOTS = [
  { id: "slot-1", label: "11:00 – 12:00" },
  { id: "slot-2", label: "12:00 – 13:00" },
  { id: "slot-3", label: "13:00 – 14:00" },
  { id: "slot-4", label: "17:00 – 18:00" },
  { id: "slot-5", label: "18:00 – 19:00" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  async function placeOrder() {
    if (!selectedSlot) {
      Alert.alert("Select a Delivery Slot", "Please choose a delivery time.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setPlacing(true);
    try {
      const order = await apiClient.post<Order>("/api/v1/orders", {
        items: items.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
        })),
        deliverySlotId: selectedSlot,
        type: "on_demand",
      });
      clearCart();
      router.replace(`/order/${order.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      Alert.alert("Order Failed", message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Order Summary</Text>
      <View style={styles.summaryCard}>
        {items.map((item) => (
          <View key={item.mealId} style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              {item.quantity}x {item.meal.name}
            </Text>
            <Text style={styles.summaryPrice}>
              ฿{(item.meal.price * item.quantity).toFixed(0)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>฿{totalPrice.toFixed(0)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Delivery Slot</Text>
      <View style={styles.slotsCard}>
        {DELIVERY_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.slotRow,
              selectedSlot === slot.id && styles.slotRowActive,
            ]}
            onPress={() => setSelectedSlot(slot.id)}
          >
            <View
              style={[
                styles.radioOuter,
                selectedSlot === slot.id && styles.radioOuterActive,
              ]}
            >
              {selectedSlot === slot.id && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.slotLabel,
                selectedSlot === slot.id && styles.slotLabelActive,
              ]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.placeButton, placing && styles.placeButtonDisabled]}
        onPress={placeOrder}
        disabled={placing}
        activeOpacity={0.85}
      >
        {placing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.placeButtonText}>Place Order</Text>
        )}
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
    gap: 14,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181b",
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    fontSize: 14,
    color: "#18181b",
    flex: 1,
  },
  summaryPrice: {
    fontSize: 14,
    color: "#71717a",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f4f4f5",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#18181b",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f97316",
  },
  slotsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  slotRowActive: {
    backgroundColor: "#fff7ed",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#f97316",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
  },
  slotLabel: {
    fontSize: 15,
    color: "#71717a",
  },
  slotLabelActive: {
    color: "#f97316",
    fontWeight: "600",
  },
  placeButton: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  placeButtonDisabled: {
    opacity: 0.6,
  },
  placeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
