import React from 'react';
import { Sparkles, Code2 } from 'lucide-react';
import { VisitorCounter } from './VisitorCounter';

interface FooterProps {
  companionName?: string;
  onOpenSourceCode?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ companionName = 'Аура', onOpenSourceCode }) => {
  return (
    <footer className="shrink-0 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-400 z-10 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{companionName}</span>
        </div>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-500 text-[11px] hidden md:inline truncate">
          Персональная ИИ-собеседница с чутким сердцем и памятью
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
        {onOpenSourceCode && (
          <button
            onClick={onOpenSourceCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/25 text-[11px] font-medium transition-colors"
            title="Открыть экспорт и копирование исходного кода проекта"
          >
            <Code2 className="w-3 h-3 text-pink-400" />
            <span>Экспорт кода</span>
          </button>
        )}
        <VisitorCounter />
      </div>
    </footer>
  );
};

export default Footer;
