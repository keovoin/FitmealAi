const KEY = "vitaglass_prefs";

export interface WorkoutPrefs {
  types: string[];
  days: string;
  duration: string;
}

export interface MealPrefs {
  diets: string[];
  timings: string[];
  cookTime: string;
  allergies: string[];
}

interface Prefs {
  workout: WorkoutPrefs;
  meal: MealPrefs;
}

const DEFAULTS: Prefs = {
  workout: {
    types: ["strength"],
    days: "4 days",
    duration: "45 min",
  },
  meal: {
    diets: ["balanced"],
    timings: ["breakfast", "lunch", "dinner"],
    cookTime: "30 min",
    allergies: [],
  },
};

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}

export function getWorkoutPrefs(): WorkoutPrefs {
  return load().workout;
}

export function getMealPrefs(): MealPrefs {
  return load().meal;
}

export function saveWorkoutPrefs(workout: WorkoutPrefs) {
  save({ ...load(), workout });
}

export function saveMealPrefs(meal: MealPrefs) {
  save({ ...load(), meal });
}
