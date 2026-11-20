'use client';

import { useState } from 'react';
import { AuthTabs, type AuthTab } from './auth-tabs';
import { LoginForm, type LoginErrors, type LoginValues } from './login-form';
import { RegisterForm, type RegisterErrors, type RegisterValues } from './register-form';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/hooks';

type AuthPageProps = {
  initialTab?: AuthTab;
};

const initialLoginValues: LoginValues = {
  email: '',
  password: '',
};

const initialRegisterValues: RegisterValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function validateEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function AuthPage({ initialTab = 'login' }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [loginValues, setLoginValues] = useState<LoginValues>(initialLoginValues);
  const [registerValues, setRegisterValues] = useState<RegisterValues>(initialRegisterValues);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [statusMessage, setStatusMessage] = useState('');

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  function handleLogin() {
    loginMutation.mutate({ email: loginValues.email, password: loginValues.password });
  }

  function handleRegister() {
    registerMutation.mutate({
      fullName: registerValues.fullName,
      email: registerValues.email,
      password: registerValues.password,
      verifiedPassword: registerValues.confirmPassword,
    });
  }

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!loginValues.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!validateEmail(loginValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!loginValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setLoginErrors(nextErrors);
    setStatusMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    handleLogin();
  }

  function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: RegisterErrors = {};
    if (!registerValues.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!registerValues.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!validateEmail(registerValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!registerValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    if (!registerValues.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (registerValues.confirmPassword !== registerValues.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setRegisterErrors(nextErrors);
    setStatusMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    handleRegister();
  }

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,520px)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-surface-container-low lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.65),transparent_40%),linear-gradient(180deg,rgba(243,243,244,0.92),rgba(226,226,226,0.85))]" />
        <div className="absolute inset-y-0 left-8 w-px bg-primary/15" />
        <div className="absolute bottom-8 left-14 h-24 w-24 rounded-full border border-primary/15" />
        <div className="absolute bottom-10 left-20 h-36 w-28 rounded-lg border border-primary/10 bg-surface-container-lowest/40 backdrop-blur-sm" />
      </aside>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-6 lg:py-12">
        <div className="w-full max-w-[440px] rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <div className="space-y-2.5 text-center">
            <h1 className="font-headline text-[clamp(2.75rem,7vw,4.25rem)] font-black leading-none tracking-[-0.06em] text-primary">
              ACCOUNT
            </h1>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Access your account
            </p>
          </div>

          <div className="mt-8">
            <AuthTabs activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} />
          </div>

          <div className="mt-8">
            {activeTab === 'login' ? (
              <LoginForm
                values={loginValues}
                errors={loginErrors}
                isSubmitting={loginMutation.isPending}
                onChange={(field, value) => setLoginValues((current) => ({ ...current, [field]: value }))}
                onSubmit={submitLogin}
              />
            ) : (
              <RegisterForm
                values={registerValues}
                errors={registerErrors}
                isSubmitting={registerMutation.isPending}
                onChange={(field, value) => setRegisterValues((current) => ({ ...current, [field]: value }))}
                onSubmit={submitRegister}
              />
            )}
          </div>

          {statusMessage ? (
            <p className="mt-5 text-center font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_30%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_50%_65%,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="absolute inset-x-14 top-10 h-80 rounded-[50%] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
        <div className="absolute inset-x-20 bottom-20 h-40 rounded-[48%] border border-white/5 bg-black/25" />
      </aside>
    </main>
  );
}
