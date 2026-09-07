'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Hourglass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { formatErrorMessage } from '@/lib/utils/error-formatter';

const AVATAR_OPTIONS = ['🦊', '🐱', '🐼', '🦁', '🦉', '🐺', '🐸', '🐨', '👩🏻‍💻', '👨🏽‍💻', '🧙‍♂️', '🧑‍🚀'];

export function AuthModal() {
  const {
    overlay,
    closeOverlay,
    authModalMode,
    openAuthModal,
    loginWithGoogle,
    login,
    register,
    authNotice,
  } = useApp();
  const { theme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync mode if changed from outside
  React.useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    if (authNotice) {
      setNoticeMessage(authNotice);
    }
  }, [authModalMode, authNotice]);

  if (overlay !== 'auth') return null;

  const handleGoogleClick = () => {
    setIsLoadingGoogle(true);
    setTimeout(() => {
      setIsLoadingGoogle(false);
      loginWithGoogle();
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, handle, avatar: selectedAvatar, password });
      }
    } catch (err: any) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setNoticeMessage(`Password reset instructions sent to ${email || 'your email'}!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  return (
    <div
      onClick={closeOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.hex }}
      />

      <div
        className="relative bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/50 rounded-3xl shadow-2xl w-full max-w-[460px] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 z-50 overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-variant/30 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
              style={{ backgroundColor: theme.hex + '18', color: theme.hex }}
            >
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Canvas'}
              </h2>
              <p className="text-xs text-outline">
                {mode === 'login'
                  ? 'Enter your calm focus space'
                  : 'Join the quiet productivity movement'}
              </p>
            </div>
          </div>
          <button
            onClick={closeOverlay}
            aria-label="Close modal"
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Notice Banner */}
          {noticeMessage && (
            <div
              className="p-3 rounded-2xl border text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                backgroundColor: theme.hex + '15',
                borderColor: theme.hex + '40',
                color: theme.hex,
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Toggle Switcher (Sign In vs Register) */}
          <div className="p-1 bg-surface-container-low/80 border border-surface-variant/50 rounded-2xl flex items-center relative">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all text-center',
                mode === 'login'
                  ? 'bg-surface-container-highest text-on-surface shadow-sm'
                  : 'text-outline hover:text-on-surface'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all text-center',
                mode === 'register'
                  ? 'bg-surface-container-highest text-on-surface shadow-sm'
                  : 'text-outline hover:text-on-surface'
              )}
            >
              Create Account
            </button>
          </div>

          {/* 1. Login with Google Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoadingGoogle}
            className="w-full py-3 px-4 rounded-2xl border border-surface-variant/70 bg-surface-container-low hover:bg-surface-container hover:border-surface-variant text-on-surface font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] cursor-pointer"
          >
            {isLoadingGoogle ? (
              <div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                style={{ color: theme.hex }}
              />
            ) : (
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
            )}
            <span>
              {isLoadingGoogle
                ? 'Connecting to Google...'
                : mode === 'login'
                ? 'Continue with Google'
                : 'Sign up with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="w-full border-t border-surface-variant/40" />
            <span className="absolute bg-surface-container-lowest px-3 text-[11px] font-medium text-outline">
              or continue with email
            </span>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Registration specific fields: Name, Handle, Avatar */}
            {mode === 'register' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 w-4 h-4 text-outline pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setHandle(
                          `@${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'}`
                        );
                      }}
                      placeholder="e.g. Elena Rostova"
                      className="w-full text-xs bg-surface-container border border-surface-variant/50 rounded-xl pl-10 pr-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
                    />
                  </div>
                </div>

                {/* Avatar Quick Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-outline">
                    Choose Profile Avatar
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(emoji)}
                        className={clsx(
                          'w-8 h-8 rounded-xl text-lg flex items-center justify-center shrink-0 transition-transform cursor-pointer',
                          selectedAvatar === emoji
                            ? 'bg-surface-container ring-2 ring-primary scale-110 shadow-xs'
                            : 'hover:bg-surface-container/60 hover:scale-105'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-outline" htmlFor="authEmail">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-outline pointer-events-none" />
                <input
                  id="authEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-xs bg-surface-container border border-surface-variant/50 rounded-xl pl-10 pr-3.5 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-outline" htmlFor="authPassword">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-outline hover:text-primary transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-outline pointer-events-none" />
                <input
                  id="authPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs bg-surface-container border border-surface-variant/50 rounded-xl pl-10 pr-10 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-outline hover:text-on-surface transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-outline select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-surface-container border-surface-variant accent-primary cursor-pointer"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-2xl text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: theme.hex }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Enter Focus Workspace' : 'Create Free Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Canvas Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-outline font-medium">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.hex }} />
            <span>End-to-end quiet sync. No ads, no tracking.</span>
          </div>
        </div>

        {/* Footer info switch */}
        <div className="px-6 py-3.5 bg-surface-container-low/60 border-t border-surface-variant/30 text-center text-xs text-outline shrink-0">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold underline hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: theme.hex }}
              >
                Sign up for free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold underline hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: theme.hex }}
              >
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
