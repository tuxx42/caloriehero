import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useCartStore, type CartItem } from "@/stores/cart";

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  function renderItem({ item }: { item: CartItem }) {
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.meal.name}</Text>
          <Text style={styles.itemCalories}>{item.meal.calories} kcal each</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>
            ฿{(item.meal.price * item.quantity).toFixed(0)}
          </Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.mealId, item.quantity - 1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.mealId, item.quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse meals or generate a plan to get started.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push("/(tabs)/meals")}
        >
          <Text style={styles.browseButtonText}>Browse Meals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.mealId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>฿{totalPrice.toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push("/checkout")}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  cartItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#18181b",
  },
  itemCalories: {
    fontSize: 12,
    color: "#71717a",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f97316",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 16,
    color: "#18181b",
    lineHeight: 20,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#18181b",
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#ffffff",
    padding: 20,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#18181b",
  },
  checkoutButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#18181b",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 21,
  },
  browseButton: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
