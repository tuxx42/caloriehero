import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getMe, updateProfile } from "../api/endpoints/users";
import type { UserWithProfile } from "../api/types";
import { useAuthStore } from "../stores/auth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { FITNESS_GOALS, ALLERGEN_OPTIONS, DIETARY_OPTIONS } from "../utils/constants";

export function ProfilePage() {
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // Form state
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(200);
  const [fat, setFat] = useState(65);
  const [fitnessGoal, setFitnessGoal] = useState("maintenance");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUserData(data);
        if (data.profile) {
          setCalories(data.profile.macro_targets.calories);
          setProtein(data.profile.macro_targets.protein);
          setCarbs(data.profile.macro_targets.carbs);
          setFat(data.profile.macro_targets.fat);
          setFitnessGoal(data.profile.fitness_goal);
          setAllergies(data.profile.allergies);
          setDietaryPrefs(data.profile.dietary_preferences);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        macro_targets: { calories, protein, carbs, fat },
        fitness_goal: fitnessGoal,
        allergies,
        dietary_preferences: dietaryPrefs,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (
    list: string[],
    setter: (v: string[]) => void,
    item: string,
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* User info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
            {userData?.name?.[0] ?? "?"}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{userData?.name}</h2>
            <p className="text-sm text-gray-500">{userData?.email}</p>
          </div>
        </div>
      </div>

      {/* Macro targets */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Macro Targets</h3>
          <button
            onClick={() => navigate("/onboarding")}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            Recalculate
          </button>
        </div>
        {[
          { label: "Calories", value: calories, setter: setCalories, unit: "kcal" },
          { label: "Protein", value: protein, setter: setProtein, unit: "g" },
          { label: "Carbs", value: carbs, setter: setCarbs, unit: "g" },
          { label: "Fat", value: fat, setter: setFat, unit: "g" },
        ].map(({ label, value, setter, unit }) => (
          <div key={label}>
            <label className="text-sm text-gray-600 mb-1 block">
              {label} ({unit})
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      {/* Fitness goal */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Fitness Goal</h3>
        <div className="grid grid-cols-2 gap-2">
          {FITNESS_GOALS.map((goal) => (
            <button
              key={goal.value}
              onClick={() => setFitnessGoal(goal.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                fitnessGoal === goal.value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Allergies</h3>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => toggleItem(allergies, setAllergies, a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                allergies.includes(a)
                  ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {a.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary preferences */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleItem(dietaryPrefs, setDietaryPrefs, d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                dietaryPrefs.includes(d)
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {d.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Save + Logout */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        <button
          onClick={logout}
          className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
