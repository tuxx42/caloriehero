import { useState } from "react";
import { useNavigate } from "react-router";
import { updateProfile } from "../api/endpoints/users";
import {
  calculateMacros,
  type ActivityLevel,
  type BodyStats,
  type FitnessGoal,
  type Gender,
  type MacroResult,
} from "../utils/tdee";
import {
  ACTIVITY_LEVELS,
  ALLERGEN_OPTIONS,
  DEFAULT_MACROS,
  DIETARY_OPTIONS,
  FITNESS_GOALS,
} from "../utils/constants";
import { TargetIcon } from "../components/icons/Icons";

const STEPS = ["Welcome", "Goal", "Stats", "Review", "Preferences"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Goal
  const [goal, setGoal] = useState<FitnessGoal>("maintenance");

  // Step 2 — Body Stats
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderate");

  // Step 3 — Computed macros (editable)
  const [macros, setMacros] = useState<MacroResult>({ ...DEFAULT_MACROS });

  // Step 4 — Preferences
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  const stats: BodyStats = { weight, height, age, gender, activityLevel };

  const handleComputeMacros = () => {
    const result = calculateMacros(stats, goal);
    setMacros(result);
    setStep(3);
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

  const handleSkip = async () => {
    setSaving(true);
    try {
      await updateProfile({
        macro_targets: { ...DEFAULT_MACROS },
        fitness_goal: "maintenance",
        allergies: [],
        dietary_preferences: [],
      });
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        macro_targets: macros,
        fitness_goal: goal,
        allergies,
        dietary_preferences: dietaryPrefs,
        weight_kg: weight,
        height_cm: height,
        age,
        gender,
        activity_level: activityLevel,
      });
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-stone-200/60 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-500">
              Step {step + 1} of {STEPS.length}
            </span>
            {step > 0 && (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <TargetIcon className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
              <h1 className="font-display text-2xl text-stone-900">
                Let's personalize your nutrition
              </h1>
              <p className="text-stone-500">
                We'll calculate your ideal daily macros based on your body and
                goals. This only takes a minute.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                >
                  Get Started
                </button>
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="w-full py-3 bg-stone-100 text-stone-600 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  {saving ? "Saving..." : "Skip for now"}
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Fitness Goal */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="font-display text-xl text-stone-900">
                What's your fitness goal?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {FITNESS_GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 ${
                      goal === g.value
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-600 shadow-sm"
                        : "bg-white text-stone-900 border border-stone-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="font-semibold">{g.label}</div>
                    <div
                      className={`text-xs mt-1 ${goal === g.value ? "text-emerald-100" : "text-stone-500"}`}
                    >
                      {g.description}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Body Stats */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="font-display text-xl text-stone-900">
                Your body stats
              </h2>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-4">
                {/* Gender */}
                <div>
                  <label className="text-sm text-stone-600 mb-2 block">
                    Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["male", "female"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          gender === g
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight / Height / Age */}
                {[
                  {
                    label: "Weight (kg)",
                    value: weight,
                    setter: setWeight,
                    min: 30,
                    max: 250,
                  },
                  {
                    label: "Height (cm)",
                    value: height,
                    setter: setHeight,
                    min: 100,
                    max: 250,
                  },
                  {
                    label: "Age",
                    value: age,
                    setter: setAge,
                    min: 15,
                    max: 100,
                  },
                ].map(({ label, value, setter, min, max }) => (
                  <div key={label}>
                    <label className="text-sm text-stone-600 mb-1 block">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={value}
                      min={min}
                      max={max}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                ))}

                {/* Activity Level */}
                <div>
                  <label className="text-sm text-stone-600 mb-2 block">
                    Activity Level
                  </label>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((al) => (
                      <button
                        key={al.value}
                        onClick={() => setActivityLevel(al.value)}
                        className={`w-full p-3 rounded-xl text-left text-sm transition-all duration-200 ${
                          activityLevel === al.value
                            ? "bg-emerald-50 border-emerald-500 border-2 text-emerald-700"
                            : "bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <span className="font-medium">{al.label}</span>
                        <span className="text-stone-500 ml-2">
                          — {al.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-stone-100 text-stone-600 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComputeMacros}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                >
                  Calculate Macros
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Macro Review */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="font-display text-xl text-stone-900">
                Your daily macro targets
              </h2>
              <p className="text-sm text-stone-500">
                Calculated from your body stats. Feel free to adjust.
              </p>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-4">
                {[
                  {
                    label: "Calories",
                    key: "calories" as const,
                    unit: "kcal",
                    color: "text-stone-900",
                  },
                  {
                    label: "Protein",
                    key: "protein" as const,
                    unit: "g",
                    color: "text-blue-600",
                  },
                  {
                    label: "Carbs",
                    key: "carbs" as const,
                    unit: "g",
                    color: "text-amber-600",
                  },
                  {
                    label: "Fat",
                    key: "fat" as const,
                    unit: "g",
                    color: "text-rose-600",
                  },
                ].map(({ label, key, unit, color }) => (
                  <div key={key}>
                    <label
                      className={`text-sm font-medium mb-1 block ${color}`}
                    >
                      {label} ({unit})
                    </label>
                    <input
                      type="number"
                      value={macros[key]}
                      onChange={(e) =>
                        setMacros({ ...macros, [key]: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-stone-100 text-stone-600 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="font-display text-xl text-stone-900">
                Dietary preferences
              </h2>

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

              {/* Dietary */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100 space-y-3">
                <h3 className="font-semibold text-stone-900">
                  Dietary Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        toggleItem(dietaryPrefs, setDietaryPrefs, d)
                      }
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

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-stone-100 text-stone-600 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  {saving ? "Saving..." : "Finish Setup"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
