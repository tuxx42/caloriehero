import { useEffect, useState } from "react";
import { listMeals } from "../../api/endpoints/meals";
import type { Meal } from "../../api/types";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function AdminMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMeals()
      .then(setMeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
        <span className="text-sm text-gray-500">{meals.length} meals</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                Category
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Cal</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                Pro
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                ฿/g P
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                ฿/g C
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                ฿/g F
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meals.map((meal) => (
              <tr key={meal.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {meal.name}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize hidden md:table-cell">
                  {meal.category}
                </td>
                <td className="px-4 py-3 text-gray-600">{Math.round(meal.calories)}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {Math.round(meal.protein)}g
                </td>
                <td className="px-4 py-3 text-gray-900 font-medium">
                  ฿{meal.price}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                  {meal.protein_price_per_gram != null
                    ? `฿${meal.protein_price_per_gram}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                  {meal.carbs_price_per_gram != null
                    ? `฿${meal.carbs_price_per_gram}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                  {meal.fat_price_per_gram != null
                    ? `฿${meal.fat_price_per_gram}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      meal.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {meal.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
