import { useState } from "react";
import { useNavigate } from "react-router";
import { useCartStore } from "../stores/cart";
import { createOrder, payOrder } from "../api/endpoints/orders";

export function CheckoutPage() {
  const { items, total, clearCart, itemPrice } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({
        items: items.map((i) => ({
          meal_id: i.meal.id,
          quantity: i.quantity,
          extra_protein: i.extraProtein,
          extra_carbs: i.extraCarbs,
          extra_fat: i.extraFat,
        })),
        type: "one_time",
      });

      // Create payment intent (will use Stripe Elements in production)
      await payOrder(order.id);
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Checkout</h1>

      {/* Order summary */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">Order Summary</h2>
        {items.map((item) => {
          const { meal, quantity, extraProtein, extraCarbs, extraFat } = item;
          const unitP = itemPrice(item);
          const hasExtras = extraProtein !== 0 || extraCarbs !== 0 || extraFat !== 0;
          const extraParts = [
            extraProtein !== 0 && `${extraProtein > 0 ? "+" : ""}${extraProtein}g P`,
            extraCarbs !== 0 && `${extraCarbs > 0 ? "+" : ""}${extraCarbs}g C`,
            extraFat !== 0 && `${extraFat > 0 ? "+" : ""}${extraFat}g F`,
          ].filter(Boolean);

          return (
            <div key={`${meal.id}-${extraProtein}-${extraCarbs}-${extraFat}`}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {meal.name} x {quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ฿{(unitP * quantity).toFixed(0)}
                </span>
              </div>
              {hasExtras && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  {extraParts.join(", ")}
                </p>
              )}
            </div>
          );
        })}
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">
            ฿{total().toFixed(0)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing..." : `Pay ฿${total().toFixed(0)}`}
      </button>
    </div>
  );
}
