"use client";

import { useState } from "react";
import { useMeals } from "@/hooks/use-api";
import * as api from "@/lib/api";
import type { Meal } from "@caloriehero/shared-types";
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MealForm } from "@/components/meal-form";

const categoryColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-blue-100 text-blue-700",
  dinner: "bg-purple-100 text-purple-700",
  snack: "bg-green-100 text-green-700",
};

export default function MealsPage() {
  const { meals, loading, error, refetch } = useMeals();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = meals.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (meal: Meal) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editingMeal) {
        await api.updateMeal(meal.id, {
          name: meal.name,
          description: meal.description,
          category: meal.category,
          nutritionalInfo: meal.nutritionalInfo,
          servingSize: meal.servingSize,
          price: meal.price,
          allergens: meal.allergens,
          dietaryTags: meal.dietaryTags,
          active: meal.active,
        });
      } else {
        await api.createMeal({
          name: meal.name,
          description: meal.description,
          category: meal.category,
          nutritionalInfo: meal.nutritionalInfo,
          servingSize: meal.servingSize,
          price: meal.price,
          allergens: meal.allergens,
          dietaryTags: meal.dietaryTags,
          active: meal.active,
        });
      }
      refetch();
    } catch (err) {
      // API unavailable — surface the error but the hook already has local mock
      setSaveError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setSaving(false);
      setShowForm(false);
      setEditingMeal(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMeal(id);
      refetch();
    } catch {
      // If API is down, mark inactive locally via refetch (mock data won't change)
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {meals.filter((m) => m.active).length} active, {meals.filter((m) => !m.active).length} inactive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setEditingMeal(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" /> Add Meal
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          API unavailable — showing mock data. Changes will not persist.
        </div>
      )}

      {saveError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {saveError}
        </div>
      )}

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search meals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading meals...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Meal</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Category</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Calories</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">P / C / F</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Price</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((meal) => (
                <tr key={meal.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-900">{meal.name}</p>
                      <p className="text-xs text-zinc-400">{meal.servingSize}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", categoryColors[meal.category])}>
                      {meal.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{meal.nutritionalInfo.calories}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span className="text-blue-600">{meal.nutritionalInfo.protein}g</span>
                    {" / "}
                    <span className="text-amber-600">{meal.nutritionalInfo.carbs}g</span>
                    {" / "}
                    <span className="text-red-500">{meal.nutritionalInfo.fat}g</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">฿{meal.price}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      meal.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                    )}>
                      {meal.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingMeal(meal); setShowForm(true); }}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        disabled={saving}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">No meals found</div>
        )}
      </div>

      {showForm && (
        <MealForm
          meal={editingMeal}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingMeal(null); }}
        />
      )}
    </div>
  );
}
