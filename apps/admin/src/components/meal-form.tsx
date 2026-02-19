"use client";

import { useState } from "react";
import type { Meal, MealCategory, Allergen, DietaryTag } from "@caloriehero/shared-types";
import { X } from "lucide-react";

const categories: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];
const allergens: Allergen[] = ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "sesame"];
const dietaryTags: DietaryTag[] = ["vegetarian", "vegan", "gluten_free", "keto", "low_carb", "high_protein", "dairy_free", "halal"];

interface MealFormProps {
  meal: Meal | null;
  onSave: (meal: Meal) => void;
  onClose: () => void;
}

export function MealForm({ meal, onSave, onClose }: MealFormProps) {
  const [name, setName] = useState(meal?.name ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [category, setCategory] = useState<MealCategory>(meal?.category ?? "lunch");
  const [calories, setCalories] = useState(meal?.nutritionalInfo.calories ?? 0);
  const [protein, setProtein] = useState(meal?.nutritionalInfo.protein ?? 0);
  const [carbs, setCarbs] = useState(meal?.nutritionalInfo.carbs ?? 0);
  const [fat, setFat] = useState(meal?.nutritionalInfo.fat ?? 0);
  const [servingSize, setServingSize] = useState(meal?.servingSize ?? "");
  const [price, setPrice] = useState(meal?.price ?? 0);
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>(meal?.allergens ?? []);
  const [selectedTags, setSelectedTags] = useState<DietaryTag[]>(meal?.dietaryTags ?? []);

  const toggleAllergen = (a: Allergen) =>
    setSelectedAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const toggleTag = (t: DietaryTag) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    onSave({
      id: meal?.id ?? crypto.randomUUID(),
      name,
      description,
      category,
      nutritionalInfo: { calories, protein, carbs, fat },
      servingSize,
      price,
      allergens: selectedAllergens,
      dietaryTags: selectedTags,
      active: true,
      createdAt: meal?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const inputClass = "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{meal ? "Edit Meal" : "Add Meal"}</h2>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as MealCategory)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Serving Size</label>
              <input className={inputClass} value={servingSize} onChange={(e) => setServingSize(e.target.value)} placeholder="e.g. 350g" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nutritional Info (per serving)</label>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-zinc-500">Calories</span>
                <input type="number" className={inputClass} value={calories} onChange={(e) => setCalories(Number(e.target.value))} min={0} />
              </div>
              <div>
                <span className="text-xs text-blue-600">Protein (g)</span>
                <input type="number" className={inputClass} value={protein} onChange={(e) => setProtein(Number(e.target.value))} min={0} />
              </div>
              <div>
                <span className="text-xs text-amber-600">Carbs (g)</span>
                <input type="number" className={inputClass} value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} min={0} />
              </div>
              <div>
                <span className="text-xs text-red-500">Fat (g)</span>
                <input type="number" className={inputClass} value={fat} onChange={(e) => setFat(Number(e.target.value))} min={0} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Price (THB)</label>
            <input type="number" className={inputClass} value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} />
          </div>

          <div>
            <label className={labelClass}>Allergens</label>
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedAllergens.includes(a)
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  {a.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {dietaryTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTags.includes(t)
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              {meal ? "Update" : "Create"} Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
