import React from "react";
import { Sprout } from "lucide-react";

export default function CompanyLogo() {
  return (
    <div className="flex items-center gap-2 select-none" id="company-logo-element">
      <div className="w-9 h-9 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/10 border border-emerald-300/30">
        <Sprout className="w-5 h-5 text-white animate-pulse" />
      </div>
      <div className="flex flex-col text-left">
        <span className="font-display font-black tracking-tight text-gray-950 dark:text-slate-100 text-base leading-none">
          MyCrop
        </span>
        <span className="text-[10px] font-mono font-bold text-gray-400 leading-none tracking-widest uppercase mt-0.5">
          Precision Ag
        </span>
      </div>
    </div>
  );
}
