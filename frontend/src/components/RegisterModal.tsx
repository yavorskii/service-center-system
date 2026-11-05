import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, AlertCircle, RefreshCw, Lock, User, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser, CaptchaData } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCaptcha();
      setErrorMessage('');
      setRegisteredEmail(null);
      setGoogleLoading(false);
    }
  }, [isOpen]);

  const loadCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const data = await api.getCaptcha();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch {
      setErrorMessage('Не вдалося завантажити CAPTCHA');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      localStorage.removeItem('repairhub_google_mode');
      const url = await api.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося перейти до Google');
      setGoogleLoading(false);
    }
  };

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const passedCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Введіть пароль', color: 'bg-slate-700', text: 'text-slate-400', width: '0%' };
    if (passedCount <= 2) return { label: 'Слабкий пароль', color: 'bg-rose-500', text: 'text-rose-400', width: '30%' };
    if (passedCount <= 4) return { label: 'Середній рівень', color: 'bg-amber-500', text: 'text-amber-400', width: '65%' };
    return { label: 'Надійний пароль', color: 'bg-emerald-500', text: 'text-emerald-400', width: '100%' };
  };

  const strength = getStrengthLabel();
  const canAttemptSubmit = username.trim().length >= 3 && fullName.trim().length > 0 && email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasLength) {
      setErrorMessage('Помилка політики пароля: мінімальна довжина — 8 символів');
      return;
    }
    if (!hasUpper) {
      setErrorMessage('Помилка політики пароля: додайте хоча б одну велику літеру (A-Z)');
      return;
    }
    if (!hasLower) {
      setErrorMessage('Помилка політики пароля: додайте хоча б одну малу літеру (a-z)');
      return;
    }
    if (!hasNumber) {
      setErrorMessage('Помилка політики пароля: додайте хоча б одну цифру (0-9)');
      return;
    }
    if (!hasSpecial) {
      setErrorMessage('Помилка політики пароля: додайте хоча б один спеціальний символ (!@#$%^&*)');
      return;
    }
    if (!isMatch) {
      setErrorMessage('Підтвердження пароля не співпадає з введеним паролем');
      return;
    }
    if (!captchaData || captchaAnswer.trim().length === 0) {
      setErrorMessage('Введіть 5 символів із зображення CAPTCHA для захисту від ботів');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetEmail = email.trim().toLowerCase();
      const user = await api.register({
        username: username.trim(),
        fullName: fullName.trim(),
        email: targetEmail,
        phone: phone.trim() || undefined,
        password,
        captchaToken: captchaData.token,
        captchaAnswer: captchaAnswer.trim()
      });

      if (user.token) {
        onSuccess(user);
        onClose();
        return;
      }

      setRegisteredEmail(targetEmail);
    } catch (err: any) {
      setErrorMessage(err.message || 'Помилка реєстрації');
      loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Створення облікового запису</h2>
            <p className="text-xs text-slate-400">Особистий кабінет клієнта сервісного центру RepairHub</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {registeredEmail ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Перевірте вашу електронну пошту!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Ми надіслали лист із посиланням для підтвердження на адресу{' '}
              <span className="font-semibold text-white font-mono">{registeredEmail}</span>.
              Перейдіть за посиланням у листі (дійсне 24 години), щоб активувати акаунт і увійти.
            </p>
            <p className="text-xs text-slate-500">
              Якщо листа немає у «Вхідних» протягом 10–15 секунд, перевірте вкладку «Спам» або «Уся пошта».
            </p>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToLogin();
                }}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
              >
                Перейти до входу
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              disabled={googleLoading || isSubmitting}
              onClick={handleGoogleRegister}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{googleLoading ? 'Перехід до Google...' : 'Продовжити через Google'}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2.5 text-slate-500 text-[11px]">або заповніть форму реєстрації</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Логін користувача *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="vlad_yavorskyi"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ПІБ *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Владислав Яворський"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Електронна пошта *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Номер телефону
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+380991234567"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Пароль *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Підтвердження пароля *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Складність пароля:</span>
                <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasLength ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Мін. 8 символів</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasUpper ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Велика літера (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasLower ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Мала літера (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Цифра (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasSpecial ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Спецсимвол (!@#$%^&*)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${isMatch ? 'opacity-100' : 'opacity-30'}`} />
                  <span>Паролі співпадають</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Захист від ботів (CAPTCHA) *
                </label>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={isLoadingCaptcha}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                  <span>Оновити код</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div
                  className="bg-slate-950 p-1.5 rounded-lg border border-slate-700 flex items-center justify-center min-w-[160px] h-[52px]"
                  dangerouslySetInnerHTML={{ __html: captchaData?.svg || '<span class="text-xs text-slate-500">Завантаження...</span>' }}
                />
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Введіть 5 символів"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-center font-mono tracking-widest text-white uppercase focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canAttemptSubmit || isSubmitting || googleLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition duration-200"
            >
              {isSubmitting ? 'Створення облікового запису...' : 'Зареєструватися'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">Вже маєте обліковий запис? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Увійти
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
