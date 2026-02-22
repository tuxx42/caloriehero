import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getMe, updateProfile } from "../api/endpoints/users";
import type { UserWithProfile } from "../api/types";
import { useAuthStore } from "../stores/auth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { FITNESS_GOALS, ALLERGEN_OPTIONS, DIETARY_OPTIONS, ACTIVITY_LEVELS } from "../utils/constants";

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
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* User info */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-2xl text-white font-semibold shadow-sm">
            {userData?.name?.[0] ?? "?"}
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">{userData?.name}</h2>
            <p className="text-sm text-stone-500">{userData?.email}</p>
          </div>
        </div>
      </div>

      {/* Body Stats */}
      {userData?.profile?.weight_kg != null && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-stone-900">Body Stats</h3>
            <button
              onClick={() => navigate("/onboarding")}
              className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              Update
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-stone-50 rounded-xl p-3">
              <div className="text-stone-500 text-xs">Weight</div>
              <div className="font-semibold text-stone-900">{userData.profile.weight_kg} kg</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <div className="text-stone-500 text-xs">Height</div>
              <div className="font-semibold text-stone-900">{userData.profile.height_cm} cm</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <div className="text-stone-500 text-xs">Age</div>
              <div className="font-semibold text-stone-900">{userData.profile.age}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <div className="text-stone-500 text-xs">Gender</div>
              <div className="font-semibold text-stone-900 capitalize">{userData.profile.gender}</div>
            </div>
          </div>
          {userData.profile.activity_level && (
            <div className="bg-stone-50 rounded-xl p-3 text-sm">
              <div className="text-stone-500 text-xs">Activity Level</div>
              <div className="font-semibold text-stone-900">
                {ACTIVITY_LEVELS.find((a) => a.value === userData.profile?.activity_level)?.label ?? userData.profile.activity_level}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Macro targets */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-stone-900">Macro Targets</h3>
          <button
            onClick={() => navigate("/onboarding")}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
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
            <label className="text-sm text-stone-600 mb-1 block">
              {label} ({unit})
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>
        ))}
      </div>

      {/* Fitness goal */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-3">
        <h3 className="font-semibold text-stone-900">Fitness Goal</h3>
        <div className="grid grid-cols-2 gap-2">
          {FITNESS_GOALS.map((goal) => (
            <button
              key={goal.value}
              onClick={() => setFitnessGoal(goal.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                fitnessGoal === goal.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-3">
        <h3 className="font-semibold text-stone-900">Allergies</h3>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => toggleItem(allergies, setAllergies, a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                allergies.includes(a)
                  ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {a.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-3">
        <h3 className="font-semibold text-stone-900">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleItem(dietaryPrefs, setDietaryPrefs, d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                dietaryPrefs.includes(d)
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
          className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        <button
          onClick={logout}
          className="px-6 py-3 bg-stone-100 text-stone-600 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
