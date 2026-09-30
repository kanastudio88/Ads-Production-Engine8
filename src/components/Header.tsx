import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { Logo } from './Logo';
import { Language, translations } from '../utils/translations';

interface HeaderProps {
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onToggleUserOnline: (userId: string) => void;
  onSwitchUser: (user: TeamMember) => void;
  onLogout: () => void;
  currentModuleName?: string;
  firebaseStatus?: 'connected' | 'connecting' | 'offline';
  lang: Language;
  onSetLang: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  firebaseStatus = 'connected',
  lang,
  onSetLang
}) => {
  const t = translations[lang];
  const [timeUtc, setTimeUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeUtc(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 w-full bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Left Unit: Logo & System Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 tracking-tight">Studio8</span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-slate-600">
              {t.productionHub}
            </span>
          </div>
        </div>

        {/* Live UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px]">
          <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
          <span>{timeUtc || '14:28:42 UTC'}</span>
        </div>

        {/* Firebase Cloud Sync Badge */}
        <div
          title={`Firebase Firestore: ${firebaseStatus}`}
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50/80 border border-amber-200/80 text-[11px] font-mono text-amber-800"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">{t.cloudSync}</span>
          <span className="text-[10px] text-amber-600 uppercase">
            {firebaseStatus === 'connected' ? t.synced : firebaseStatus}
          </span>
        </div>
      </div>

      {/* Center Unit: Logged In & Online Presence Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold uppercase">
            {t.online}
          </span>
        </div>
      </div>

      {/* Right Unit: Language Switcher, User Card & Sign Out */}
      <div className="flex items-center gap-2 relative">
        {/* Language Switch Toggle Button */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onSetLang('en')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onSetLang('bm')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              lang === 'bm'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tukar ke Bahasa Melayu"
          >
            BM
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 pr-2 py-1 text-left">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 tracking-tight leading-none">
              {currentUser.name}
            </span>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider leading-tight mt-0.5">
              {currentUser.role} · {currentUser.desk}
            </span>
          </div>

          <div className="w-7 h-7 rounded bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shadow-xs">
            {currentUser.seatNumber}
          </div>
        </div>

        {/* Logout / Lock Button */}
        <button
          onClick={onLogout}
          title={t.lockTerminal}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">logout</span>
          <span className="hidden sm:inline">{t.signOut}</span>
        </button>
      </div>
    </header>
  );
};
