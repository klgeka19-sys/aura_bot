import React from 'react';
import { Sparkles, MessageSquare, Radio, Mic, MicOff, Camera, Brain, Heart, Code2 } from 'lucide-react';
import { ConversationMode } from '../types';

interface HeaderProps {
  onOpenMemories: () => void;
  onOpenTopics: () => void;
  onOpenSettings: () => void;
  onOpenRelationshipSummary?: () => void;
  onOpenSourceCode?: () => void;
  summariesCount?: number;
  onNewSession: () => void;
  memoriesCount: number;
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  // Microphone on top panel with keep-alive
  isInterlocutorMicActive: boolean;
  onToggleInterlocutorMic: () => void;
  hasMicPermission: boolean;
  liveTranscript?: string;
  isSpeaking?: boolean;
  isLoading?: boolean;
  // Avatar selection
  avatarUrl: string;
  onOpenAvatarSelect: () => void;
  companionName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMemories,
  onOpenTopics,
  onOpenSettings,
  onOpenRelationshipSummary,
  onOpenSourceCode,
  summariesCount = 0,
  onNewSession,
  memoriesCount,
  mode,
  onModeChange,
  isInterlocutorMicActive,
  onToggleInterlocutorMic,
  hasMicPermission,
  liveTranscript = '',
  isSpeaking = false,
  isLoading = false,
  avatarUrl,
  onOpenAvatarSelect,
  companionName,
}) => {
  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 px-3 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shrink-0 z-30">
      {/* Zone 1: Companion avatar & Wordmark with Avatar Switcher trigger */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenAvatarSelect}
          className="relative group flex items-center gap-2 p-1 -m-1 rounded-xl hover:bg-slate-900/80 transition-all text-left"
          title="Нажмите, чтобы сменить аниме-образ или фото"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-pink-500/50 shadow-md shrink-0 group-hover:border-pink-400 transition-colors">
            <img
              src={avatarUrl}
              alt={companionName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white font-serif leading-none">
                {companionName}
              </span>
              <span className="text-[10px] text-pink-300 font-sans tracking-wide hidden sm:inline">
                · Живое аниме
              </span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-pink-300 transition-colors flex items-center gap-1">
              <span>Сменить образ</span>
              <span className="text-[8px]">▾</span>
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Microphone & Conversation Mode Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* MICROPHONE BUTTON (Web Speech API with Auto-Send & Keep-Alive) */}
        <button
          onClick={onToggleInterlocutorMic}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 border shadow-sm ${
            isInterlocutorMicActive
              ? isSpeaking
                ? 'bg-purple-500/20 text-purple-200 border-purple-500/50 shadow-purple-950/40 ring-1 ring-purple-500/40'
                : isLoading
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-amber-950/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-emerald-950/40 ring-2 ring-emerald-500/30 animate-pulse'
              : hasMicPermission
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:border-rose-500/50 hover:bg-slate-800'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
          }`}
          title={
            isInterlocutorMicActive
              ? isSpeaking
                ? 'Аура сейчас говорит. После озвучки микрофон автоматически останется активным для вашего ответа'
                : liveTranscript
                ? `Распознано: «${liveTranscript}». Нажмите, чтобы отправить сейчас, или сделайте паузу`
                : 'Микрофон АКТИВЕН (Web Speech API). Говорите — речь автоматически переведется в текст и отправится в чат. Нажмите, чтобы отключить'
              : hasMicPermission
              ? 'Включить микрофон: распознает речь (Web Speech API) и автоматически отправит в чат Ауры'
              : 'Включить микрофон (запросить разрешение)'
          }
        >
          {isInterlocutorMicActive ? (
            isSpeaking ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                <span className="hidden sm:inline font-semibold">Аура говорит...</span>
                <span className="sm:hidden font-semibold">Аура...</span>
              </>
            ) : isLoading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span className="hidden sm:inline font-semibold">Аура думает...</span>
                <span className="sm:hidden font-semibold">Ждём...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                {liveTranscript ? (
                  <span className="font-semibold text-emerald-200 truncate max-w-[120px] sm:max-w-[180px]">
                    «{liveTranscript}»
                  </span>
                ) : (
                  <>
                    <span className="hidden md:inline font-semibold">Микрофон: слушаю</span>
                    <span className="md:hidden font-semibold">Слушаю...</span>
                  </>
                )}
              </>
            )
          ) : (
            <>
              <Mic className={`w-3.5 h-3.5 ${hasMicPermission ? 'text-slate-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">Микрофон</span>
              <span className="sm:hidden">Микрофон</span>
              {!hasMicPermission && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200">
                  запрос
                </span>
              )}
            </>
          )}
        </button>

        {/* Conversation Mode Switcher (Live vs Text) */}
        <div className="flex items-center p-0.5 sm:p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
          <button
            onClick={() => onModeChange('text')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              mode === 'text'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Режим письменных ответов"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Письменно</span>
          </button>
          <button
            onClick={() => {
              if (mode === 'live' && !isInterlocutorMicActive) {
                onToggleInterlocutorMic();
              } else {
                onModeChange('live');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              mode === 'live'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm ring-1 ring-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Режим рации: непрерывный разговор (Аура ответит голосом, микрофон включится на прием)"
          >
            <Radio className={`w-3.5 h-3.5 ${mode === 'live' ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Live-рация</span>
          </button>
        </div>
      </div>

      {/* Zone 3: Navigation Links & Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs sm:text-sm font-medium text-slate-300">
          {onOpenRelationshipSummary && (
            <button
              onClick={onOpenRelationshipSummary}
              className="hover:text-rose-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-rose-300/90"
              title="Открыть сводку отношений от Ауры"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
              <span>Сводка связи{summariesCount ? ` (${summariesCount})` : ''}</span>
            </button>
          )}
          <button
            onClick={onOpenMemories}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-amber-200/90"
            title="Открыть память собеседницы"
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Память ({memoriesCount})</span>
          </button>
          <button
            onClick={onOpenTopics}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
          >
            Глубокие темы
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
          >
            Настройки
          </button>
          {onOpenSourceCode && (
            <button
              onClick={onOpenSourceCode}
              className="hover:text-pink-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-pink-300/90 font-medium"
              title="Открыть просмотр и экспорт исходного кода приложения"
            >
              <Code2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Экспорт кода</span>
            </button>
          )}
        </nav>

        {onOpenSourceCode && (
          <button
            onClick={onOpenSourceCode}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 hover:text-white border border-pink-500/35 text-xs font-medium transition-all shadow-sm shrink-0"
            title="Открыть просмотр, копирование и экспорт исходного кода приложения"
          >
            <Code2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden xs:inline">Экспорт кода</span>
            <span className="xs:hidden">Код</span>
          </button>
        )}

        <button
          onClick={onNewSession}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg hover:opacity-90 transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
          title="Начать новую душевную беседу"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Новая беседа</span>
        </button>
      </div>
    </header>
  );
};
