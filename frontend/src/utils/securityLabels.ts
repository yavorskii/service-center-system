export interface EventLabelStyle {
  label: string;
  tone: 'emerald' | 'rose' | 'amber' | 'purple' | 'sky' | 'slate';
}

export function describeSecurityEvent(status: string): EventLabelStyle {
  switch (status) {
    case 'SUCCESS':
      return { label: 'Успішний вхід', tone: 'emerald' };
    case 'SUCCESS_2FA':
      return { label: 'Успішний вхід із 2FA', tone: 'emerald' };
    case 'OAUTH_LOGIN':
      return { label: 'Вхід через Google', tone: 'emerald' };
    case 'OAUTH_REGISTER':
      return { label: 'Реєстрація через Google', tone: 'emerald' };
    case 'REGISTERED':
      return { label: 'Реєстрація акаунта', tone: 'sky' };
    case 'ACTIVATED':
      return { label: 'Активація email', tone: 'emerald' };
    case 'LOGOUT':
      return { label: 'Вихід із системи', tone: 'slate' };
    case 'TWO_FACTOR_REQUIRED':
      return { label: 'Очікування 2FA', tone: 'amber' };
    case '2FA_QR_GENERATED':
      return { label: 'Генерація QR-коду 2FA', tone: 'sky' };
    case '2FA_ENABLED':
    case '2FA_TOGGLED':
      return { label: '2FA увімкнено', tone: 'emerald' };
    case '2FA_DISABLED':
      return { label: '2FA вимкнено', tone: 'amber' };
    case 'GOOGLE_LINKED':
      return { label: 'Google-акаунт підключено', tone: 'emerald' };
    case 'GOOGLE_UNLINKED':
      return { label: "Google-акаунт від'єднано", tone: 'amber' };
    case 'GOOGLE_LINK_REQUIRED':
      return { label: 'Потрібна прив’язка Google', tone: 'amber' };
    case 'SESSIONS_TERMINATED':
    case 'SESSION_TERMINATED':
      return { label: 'Завершено активні сеанси', tone: 'sky' };
    case 'SESSION_TERMINATE_DENIED':
      return { label: 'Відмова завершення сеансів', tone: 'rose' };
    case 'USERNAME_CHANGED':
      return { label: 'Змінено логін входу', tone: 'sky' };
    case 'PROFILE_UPDATED':
      return { label: 'Оновлено профіль', tone: 'slate' };
    case 'PROFILE_UPDATE_DENIED':
      return { label: 'Відхилено зміну логіна', tone: 'rose' };
    case 'PASSWORD_RESET_REQUESTED':
      return { label: 'Запит на відновлення пароля', tone: 'amber' };
    case 'PASSWORD_RESET_2FA_REQUIRED':
      return { label: 'Відновлення: потрібен 2FA', tone: 'amber' };
    case 'PASSWORD_RESET_SUCCESS':
      return { label: 'Пароль змінено за токеном', tone: 'emerald' };
    case 'SUPPORT_TICKET_CREATED':
      return { label: 'Звернення в підтримку', tone: 'sky' };
    case 'SUPPORT_TICKET_UPDATED':
      return { label: 'Оновлено звернення', tone: 'sky' };
    case 'SUPPORT_REPLY_SENT':
      return { label: 'Відповідь підтримки на Email', tone: 'emerald' };
    case 'ACTIVATION_REQUIRED':
      return { label: 'Вхід до активації email', tone: 'amber' };
    case 'FAILED_CAPTCHA':
      return { label: 'CAPTCHA відхилено', tone: 'rose' };
    case 'FAILED_BAD_PASSWORD':
    case 'FAILED_BAD_USERNAME':
      return { label: 'Невдала спроба входу', tone: 'rose' };
    case 'FAILED_BAD_2FA':
      return { label: 'Невірний код 2FA', tone: 'rose' };
    case 'ACCOUNT_LOCKED':
    case 'OAUTH_BLOCKED':
      return { label: 'Вхід заблоковано (Brute Force)', tone: 'purple' };
    case 'BLOCKED_BY_ADMIN':
      return { label: 'Заблоковано адміністратором', tone: 'purple' };
    case 'UNBLOCKED_BY_ADMIN':
      return { label: 'Розблоковано адміністратором', tone: 'emerald' };
    case 'USER_DELETED_BY_ADMIN':
      return { label: 'Акаунт видалено адміном', tone: 'rose' };
    default:
      return { label: status, tone: 'slate' };
  }
}

export function getToneBadgeClasses(tone: EventLabelStyle['tone']): string {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'rose':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'amber':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'purple':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'sky':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function formatUtcTimestamp(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.replace('T', ' ').substring(0, 19);
  }
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}
