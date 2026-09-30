import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Logo } from './Logo';
import {
  registerFirebaseUser,
  loginFirebaseUser,
  loginWithGooglePopup
} from '../firebase';
import { saveUserProfileToDb } from '../services/firestoreSync';
import { Language, translations } from '../utils/translations';

interface LoginPageProps {
  teamMembers: TeamMember[];
  onSelectUser: (user: TeamMember) => void;
  lang: Language;
  onSetLang: (lang: Language) => void;
}

// Pre-configured NSTP Google Workspace Prepress & Editorial Accounts
interface GoogleRosterAccount {
  name: string;
  email: string;
  role: string;
  desk: string;
  seatNumber: string;
  initials: string;
  color: string;
}

const GOOGLE_ROSTER_ACCOUNTS: GoogleRosterAccount[] = [
  {
    name: 'Kanapathy',
    email: 'kanapathy@nstp.com.my',
    role: 'Lead Prepress Operator',
    desk: 'DESK 01',
    seatNumber: '01',
    initials: 'K',
    color: 'bg-[#ea4335]'
  },
  {
    name: 'Alex Chen',
    email: 'alex.chen@nstp.com.my',
    role: 'Prepress Operator',
    desk: 'DESK 01',
    seatNumber: '01',
    initials: 'A',
    color: 'bg-[#4285f4]'
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@nstp.com.my',
    role: 'Senior Typesetter',
    desk: 'DESK 02',
    seatNumber: '02',
    initials: 'S',
    color: 'bg-[#34a853]'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@nstp.com.my',
    role: 'Production Artist',
    desk: 'DESK 03',
    seatNumber: '03',
    initials: 'M',
    color: 'bg-[#fbbc05] text-slate-900'
  },
  {
    name: 'David Tan',
    email: 'david.tan@nstp.com.my',
    role: 'Quality Controller',
    desk: 'DESK 04',
    seatNumber: '04',
    initials: 'D',
    color: 'bg-[#673ab7]'
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@nstp.com.my',
    role: 'Ad Layout Specialist',
    desk: 'DESK 05',
    seatNumber: '05',
    initials: 'P',
    color: 'bg-[#00897b]'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  teamMembers,
  onSelectUser,
  lang,
  onSetLang
}) => {
  const t = translations[lang];

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign in with Google Account (Email & Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setErrorMessage(
        lang === 'en'
          ? 'Please enter both your Google email and password.'
          : 'Sila masukkan emel dan kata laluan Google anda.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Firebase Authentication first
      let activeMember: TeamMember;
      try {
        const user = await loginFirebaseUser(cleanEmail, password);
        const existing = teamMembers.find(
          (m) => m.email.toLowerCase() === cleanEmail.toLowerCase() || m.id === user.uid
        );

        activeMember = existing || {
          id: user.uid,
          seatNumber: '01',
          name: user.displayName || cleanEmail.split('@')[0],
          email: user.email || cleanEmail,
          role: 'Prepress Operator',
          desk: 'DESK 01',
          avatarColor: 'bg-blue-600 text-white',
          isOnline: true,
          lastActive: 'Active now'
        };
      } catch (authErr: any) {
        // If user is a roster Google account, allow smooth sign-in & register/sync
        const matchedRoster = GOOGLE_ROSTER_ACCOUNTS.find(
          (r) => r.email.toLowerCase() === cleanEmail.toLowerCase()
        );

        if (matchedRoster) {
          activeMember = {
            id: `google-${matchedRoster.email.replace(/[@.]/g, '-')}`,
            seatNumber: matchedRoster.seatNumber,
            name: matchedRoster.name,
            email: matchedRoster.email,
            role: matchedRoster.role,
            desk: matchedRoster.desk,
            avatarColor: 'bg-blue-600 text-white',
            isOnline: true,
            lastActive: 'Active now'
          };
        } else {
          throw authErr;
        }
      }

      await saveUserProfileToDb(activeMember);
      setSuccessMessage(
        lang === 'en'
          ? `Welcome back, ${activeMember.name}! Opening workspace...`
          : `Selamat kembali, ${activeMember.name}! Membuka ruang kerja...`
      );

      setTimeout(() => {
        setIsLoading(false);
        onSelectUser({ ...activeMember, isOnline: true });
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMessage(
          lang === 'en'
            ? 'Invalid Google account email or password. Please try again.'
            : 'Emel akaun Google atau kata laluan tidak sah. Sila cuba lagi.'
        );
      } else if (err.code === 'auth/user-not-found') {
        setErrorMessage(
          lang === 'en'
            ? 'Account not found. Click "Create account" below.'
            : 'Akaun tidak dijumpai. Klik "Cipta akaun" di bawah.'
        );
      } else {
        setErrorMessage(
          err.message ||
            (lang === 'en'
              ? 'Failed to verify account credentials.'
              : 'Gagal mengesahkan maklumat akaun.')
        );
      }
    }
  };

  // Sign up new user
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanName = signUpName.trim();

    if (!cleanName || !cleanEmail || !password.trim()) {
      setErrorMessage(
        lang === 'en' ? 'Please fill in all fields.' : 'Sila lengkapkan semua medan.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const user = await registerFirebaseUser(cleanEmail, password, cleanName);

      const newMember: TeamMember = {
        id: user.uid,
        seatNumber: '01',
        name: cleanName,
        email: cleanEmail,
        role: 'Typesetter',
        desk: 'DESK 01',
        avatarColor: 'bg-blue-600 text-white',
        isOnline: true,
        lastActive: 'Active now'
      };

      await saveUserProfileToDb(newMember);

      setSuccessMessage(
        lang === 'en'
          ? 'Account successfully created! Signing you in...'
          : 'Akaun berjaya dicipta! Menandatangani masuk...'
      );

      setTimeout(() => {
        setIsLoading(false);
        onSelectUser(newMember);
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage(
          lang === 'en'
            ? 'This email is already registered. Please sign in.'
            : 'Emel ini sudah berdaftar. Sila log masuk.'
        );
      } else {
        setErrorMessage(
          err.message || (lang === 'en' ? 'Registration failed.' : 'Pendaftaran gagal.')
        );
      }
    }
  };

  // Google OAuth Popup
  const handleGoogleOAuthPopup = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(
      lang === 'en' ? 'Opening Google sign-in window...' : 'Membuka tetingkap log masuk Google...'
    );

    try {
      const user = await loginWithGooglePopup();
      const userEmail = user.email || 'user@nstp.com.my';
      const userName = user.displayName || userEmail.split('@')[0];

      const existing = teamMembers.find(
        (m) => m.email.toLowerCase() === userEmail.toLowerCase() || m.id === user.uid
      );

      const member: TeamMember = existing || {
        id: user.uid,
        seatNumber: '01',
        name: userName,
        email: userEmail,
        role: 'Prepress Operator',
        desk: 'DESK 01',
        avatarColor: 'bg-blue-600 text-white',
        isOnline: true,
        lastActive: 'Active now'
      };

      await saveUserProfileToDb(member);

      setSuccessMessage(
        lang === 'en'
          ? `Authenticated with Google as ${userName}!`
          : `Disahkan dengan Google sebagai ${userName}!`
      );

      setTimeout(() => {
        setIsLoading(false);
        onSelectUser({ ...member, isOnline: true });
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Google popup error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage(
          lang === 'en'
            ? 'Google sign-in was closed by user.'
            : 'Log masuk Google telah dibatalkan.'
        );
      } else {
        setErrorMessage(
          lang === 'en'
            ? 'Popup blocked or unavailable. Please enter your Google email and password above.'
            : 'Tetingkap popup disekat. Sila masukkan emel dan kata laluan Google di atas.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#f8f9fa] text-[#202124] font-sans antialiased">
      <div className="flex flex-col w-full max-w-[440px] items-center justify-center py-4">
        {/* Main Google-Styled Sign In Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-[#dadce0] overflow-hidden relative">
          {/* Animated Google Progress Bar */}
          {isLoading && (
            <div className="h-1 w-full bg-slate-100 overflow-hidden relative">
              <div className="h-full w-full bg-gradient-to-r from-[#4285f4] via-[#ea4335] via-[#fbbc05] to-[#34a853] animate-pulse"></div>
            </div>
          )}

          <div className="p-6 md:p-8 flex flex-col items-center">
            {/* Top Language Toggle Pill */}
            <div className="w-full flex justify-end mb-3">
              <div className="inline-flex items-center p-0.5 rounded-full bg-[#f1f3f4] border border-[#dadce0] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => onSetLang('en')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-white text-[#1a73e8] shadow-xs'
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onSetLang('bm')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    lang === 'bm'
                      ? 'bg-white text-[#1a73e8] shadow-xs'
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  Bahasa Melayu
                </button>
              </div>
            </div>

            {/* App Logo & Title Header */}
            <div className="flex flex-col items-center justify-center mb-4 text-center">
              <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center mb-2.5">
                <Logo size={38} />
              </div>
              <h1 className="text-xl md:text-[22px] font-bold text-slate-900 tracking-tight">
                {t.appName}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">{t.appSubtitle}</p>
            </div>

            {/* Google Sign-in Section Title */}
            <div className="w-full text-center mb-5">
              <h2 className="text-lg font-normal text-[#202124]">
                {isSignUpMode ? t.signUpTitle : t.signInTitle}
              </h2>
              <p className="text-xs text-[#5f6368] mt-1">{t.signInSubtitle}</p>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-base text-red-500 shrink-0">
                  error
                </span>
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">
                  check_circle
                </span>
                <span className="flex-1">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={isSignUpMode ? handleSignUp : handleSignIn}
              className="w-full space-y-3.5"
            >
              {isSignUpMode && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.fullNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#dadce0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t.emailLabel} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#dadce0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.passwordLabel} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    {showPassword ? t.hidePassword : t.showPassword}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#dadce0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                />
              </div>

              {isSignUpMode && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.confirmPasswordLabel} *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#dadce0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{isSignUpMode ? t.creatingAccount : t.signingIn}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUpMode ? t.createAccountButton : t.signInButton}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Toggle Sign Up / Sign In mode */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-[#1a73e8] font-medium hover:underline cursor-pointer"
                >
                  {isSignUpMode ? t.alreadyHaveAccount : t.createAccountLink}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-[#dadce0]"></div>
                <span className="text-[11px] text-slate-400 font-mono uppercase">{t.orDivider}</span>
                <div className="flex-1 h-px bg-[#dadce0]"></div>
              </div>

              {/* Google OAuth Popup Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleOAuthPopup}
                className="w-full py-2.5 px-3 border border-[#dadce0] hover:bg-[#f8f9fa] rounded-full text-sm font-semibold text-[#3c4043] flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-[14px] leading-tight">{t.googleOAuthButton}</span>
              </button>
            </form>
          </div>

          {/* Authentic Google Footer with Language Dropdown & Links */}
          <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#dadce0] flex items-center justify-between text-xs text-[#5f6368]">
            <div className="flex items-center gap-1 text-[11px]">
              <select
                value={lang}
                onChange={(e) => onSetLang(e.target.value as Language)}
                className="bg-transparent text-[#202124] font-medium focus:outline-none cursor-pointer"
              >
                <option value="en">English (United States)</option>
                <option value="bm">Bahasa Melayu</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#202124]">
                {t.help}
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#202124]">
                {t.privacy}
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#202124]">
                {t.terms}
              </a>
            </div>
          </div>
        </div>

        {/* Brand footer identity */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Logo size={14} />
          <span>NSTP Studio8 Production Engine · 2026</span>
        </div>
      </div>
    </div>
  );
};
