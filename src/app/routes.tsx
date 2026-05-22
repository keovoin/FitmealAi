import { createBrowserRouter, Outlet } from "react-router";
import { Splash } from "./screens/Splash";
import { Login } from "./screens/Login";
import { OnboardingGoal } from "./screens/OnboardingGoal";
import { OnboardingWorkout } from "./screens/OnboardingWorkout";
import { OnboardingMeal } from "./screens/OnboardingMeal";
import { OnboardingDiet } from "./screens/OnboardingDiet";
import { SettingsWorkout } from "./screens/SettingsWorkout";
import { SettingsMeal } from "./screens/SettingsMeal";
import { HomeDashboard } from "./screens/HomeDashboard";
import { AIGenerating } from "./screens/AIGenerating";
import { MealPlan } from "./screens/MealPlan";
import { Workout } from "./screens/Workout";
import { Habits } from "./screens/Habits";
import { Progress } from "./screens/Progress";
import { Paywall } from "./screens/Paywall";
import { ABAPayment } from "./screens/ABAPayment";
import { PaymentPending } from "./screens/PaymentPending";
import { Settings } from "./screens/Settings";
import { BottomNav } from "./components/BottomNav";

// Main layout that includes bottom nav for app sections
function AppLayout() {
  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-[90px] no-scrollbar">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

// Plain layout for screens without bottom nav
function PlainLayout() {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar relative">
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PlainLayout />,
    children: [
      { index: true, element: <Splash /> },
      { path: "login", element: <Login /> },
      { path: "onboarding/goal", element: <OnboardingGoal /> },
      { path: "onboarding/workout", element: <OnboardingWorkout /> },
      { path: "onboarding/meal", element: <OnboardingMeal /> },
      { path: "onboarding/diet", element: <OnboardingDiet /> },
      { path: "settings/workout", element: <SettingsWorkout /> },
      { path: "settings/meal", element: <SettingsMeal /> },
      { path: "generating", element: <AIGenerating /> },
      { path: "paywall", element: <Paywall /> },
      { path: "payment/aba", element: <ABAPayment /> },
      { path: "payment/pending", element: <PaymentPending /> },
    ],
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "home", element: <HomeDashboard /> },
      { path: "meals", element: <MealPlan /> },
      { path: "workout", element: <Workout /> },
      { path: "habits", element: <Habits /> },
      { path: "progress", element: <Progress /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
