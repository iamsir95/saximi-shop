import React from 'react';
import { Bell, UserCircle, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="admin-header h-16 border-b border-white/10 bg-slate-950/54 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-10">
      <div className="min-w-0">
        <h2 className="admin-title text-xl font-bold text-white truncate">{title}</h2>
        <p className="admin-subtitle text-[11px] text-slate-500">Quản trị Saximi shop</p>
      </div>

      <div className="admin-header-actions flex items-center gap-3">
        {/* Search Input */}
        <div className="admin-search relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-56 bg-white/6 border border-white/10 text-sm rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 transition-colors"
          />
        </div>

        {/* Notifications Button */}
        <button className="relative w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400"></span>
        </button>

        {/* User Profile */}
        <div className="admin-user flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="w-9 h-9 rounded-xl bg-cyan-400/12 border border-cyan-400/24 flex items-center justify-center text-cyan-300 font-bold">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="admin-user-text">
            <div className="text-sm font-semibold text-white leading-4">Admin</div>
            <div className="text-[11px] text-slate-500">Saximi</div>
          </div>
        </div>
      </div>
    </header>
  );
};
