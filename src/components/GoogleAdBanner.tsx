import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, ShieldCheck, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface GoogleAdBannerProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adPushed, setAdPushed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasAdBlocker, setHasAdBlocker] = useState(false);

  useEffect(() => {
    // 1. Ensure Google AdSense script with test client ID is loaded if not already present
    const existingScript = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3940256099942544';
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-ad-break-test', 'on');
      document.head.appendChild(script);
    }

    // 2. Safe push to adsbygoogle queue for the test slot
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          setAdPushed(true);
        }
      } catch (err) {
        // Adsbygoogle might throw if adblocker is active or slot already pushed
        console.warn('Google AdSense test slot notice:', err);
        setHasAdBlocker(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={adContainerRef}
      className={`shrink-0 w-full bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md transition-all duration-300 z-10 ${className}`}
    >
      {/* Top Meta Header: Google AdSense test info bar */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-1 flex items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-900/60">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Google 4-Color Icon Badge */}
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white shadow-xs text-[10px] font-bold shrink-0">
            <span className="text-[#4285F4]">G</span>
          </span>
          <span className="font-semibold text-slate-300">Google Ads</span>
          <span className="text-slate-600">•</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono text-[10px] border border-amber-500/30 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
            ТЕСТОВЫЙ БАННЕР (slot: 6300978111)
          </span>
          <span className="text-slate-500 text-[10px] hidden md:inline font-mono">
            pub: ca-pub-3940256099942544
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[10px] hidden sm:inline flex items-center gap-1">
            <Info className="w-2.5 h-2.5" />
            Безопасный режим превью
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Развернуть баннер' : 'Свернуть баннер'}
          >
            {isCollapsed ? (
              <>
                <span>Показать</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Свернуть</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner Content Area */}
      {!isCollapsed && (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 flex flex-col items-center justify-center">
          {/* Authentic Google AdSense Ins Element */}
          <div className="w-full flex justify-center items-center overflow-hidden min-h-[50px] sm:min-h-[70px]">
            <ins
              className="adsbygoogle"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '90px',
                textAlign: 'center'
              }}
              data-ad-client="ca-pub-3940256099942544"
              data-ad-slot="6300978111"
              data-ad-format="horizontal"
              data-full-width-responsive="true"
              data-adtest="on"
            />
          </div>

          {/* Test Ad Visual Banner Preview (displays realistic Google Ad layout for safe visual inspection in preview) */}
          <div className="w-full max-w-3xl mt-1 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/90 border border-slate-700/60 p-2 sm:p-2.5 shadow-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Ad
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-200 truncate text-[12px] sm:text-xs">
                    Google AdSense Sample Banner • Тестовое объявление
                  </h4>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    728×90 / Responsive
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  Проверка внешнего вида рекламы в нижней части страницы сайта (Клиент: ca-pub-3940256099942544)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://support.google.com/adsense/answer/48182"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1 transition-all"
              >
                <span>Google AdSense</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdBanner;
