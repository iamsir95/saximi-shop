import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  gradient: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  gradient,
}) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-600 transition-all duration-300 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
          {change && (
            <p className={`text-xs mt-2 font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '↑' : '↓'} {change} <span className="text-slate-500 font-normal">so với tháng trước</span>
            </p>
          )}
        </div>

        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
};
