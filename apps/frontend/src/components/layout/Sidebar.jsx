import { NavLink } from "react-router-dom";
import { Stethoscope, Upload, Clock, ChevronRight } from "lucide-react";

const navItems = [
  { to: "/", icon: Upload, label: "X-ray 분석" },
  { to: "/history", icon: Clock, label: "판독 이력" },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 text-slate-100 shrink-0">
      {/* 로고 */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">CXR Insight</p>
          <p className="text-[10px] text-slate-400 font-medium">Chest X-ray Analysis</p>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              ].join(" ")
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* 하단 버전 표기 */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <p className="text-[10px] text-slate-500">capstone-cxr v0.1.0</p>
      </div>
    </aside>
  );
}