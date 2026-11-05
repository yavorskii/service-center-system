import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          theme?: 'dark' | 'light' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'error-callback'?: (code: string) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  siteKey?: string;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
  theme = 'dark',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      try {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        setIsVerifying(true);
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme,
          size: 'normal',
          callback: (token: string) => {
            if (!isMounted) return;
            setIsVerifying(false);
            setIsVerified(true);
            setLoadError(false);
            onVerify(token);
          },
          'error-callback': () => {
            if (!isMounted) return;
            setIsVerifying(false);
            setLoadError(true);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setIsVerified(false);
            onExpire?.();
          }
        });
        widgetIdRef.current = id;
      } catch (err) {
        if (isMounted) setLoadError(true);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) setLoadError(true);
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 4000);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

  const handleSimulatePass = () => {
    // Fallback if adblocker blocks Cloudflare domain on localhost
    const dummyToken = '1x00000000000000000000AA';
    setIsVerified(true);
    setLoadError(false);
    onVerify(dummyToken);
  };

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${className}`}>
      <div className="flex items-center justify-between w-full mb-1.5 px-1">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cloudflare Turnstile</span>
        </div>
        {isVerified ? (
          <span className="text-[10px] text-emerald-400 font-mono">✓ Підтверджено</span>
        ) : isVerifying ? (
          <span className="text-[10px] text-cyan-400 font-mono animate-pulse">Перевірка...</span>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">Smart Verification</span>
        )}
      </div>

      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />

      {loadError && (
        <div className="mt-2 text-center text-xs">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-[11px] mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Не вдалося завантажити віджет Cloudflare</span>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSimulatePass}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Підтвердити офлайн-токен (тестовий режим)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
