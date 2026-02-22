import { useEffect, useState } from "react";
import { getPricing, updatePricing } from "../../api/endpoints/settings";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function AdminPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proteinPrice, setProteinPrice] = useState(3);
  const [carbsPrice, setCarbsPrice] = useState(1);
  const [fatPrice, setFatPrice] = useState(1.5);

  useEffect(() => {
    getPricing()
      .then((p) => {
        setProteinPrice(p.protein_price_per_gram);
        setCarbsPrice(p.carbs_price_per_gram);
        setFatPrice(p.fat_price_per_gram);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePricing({
        protein_price_per_gram: proteinPrice,
        carbs_price_per_gram: carbsPrice,
        fat_price_per_gram: fatPrice,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Macro Pricing</h1>
      <p className="text-sm text-gray-500">
        Set the global per-gram prices for extra macros. Individual meals can
        override these values.
      </p>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        {[
          {
            label: "Protein (฿/gram)",
            value: proteinPrice,
            setter: setProteinPrice,
          },
          {
            label: "Carbs (฿/gram)",
            value: carbsPrice,
            setter: setCarbsPrice,
          },
          {
            label: "Fat (฿/gram)",
            value: fatPrice,
            setter: setFatPrice,
          },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {label}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Pricing"}
      </button>
    </div>
  );
}
