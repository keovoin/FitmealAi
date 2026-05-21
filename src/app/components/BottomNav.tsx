import { Home, Utensils, Activity, LineChart, Settings } from "lucide-react";
import { NavLink } from "react-router";

export function BottomNav() {
  const tabs = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Meals", path: "/meals", icon: Utensils },
    { name: "Workout", path: "/workout", icon: Activity },
    { name: "Progress", path: "/progress", icon: LineChart },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="absolute bottom-6 left-6 right-6">
      <div className="bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-full h-[64px] flex items-center justify-around px-2 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isActive ? "bg-white/15 text-white shadow-inner" : "text-white/50 hover:text-white/80"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[#8F5CFF]" : ""} />
                  <span className={`text-[10px] mt-1 ${isActive ? "font-medium" : ""}`}>{tab.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
